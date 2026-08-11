import * as THREE from 'three';
import { Player, LaserShot, HitEvent, WeaponType, MapId, Team, PowerupType } from '../types';
import { MapBuilder, ArenaMeshBundle } from './MapBuilder';
import { PlayerAvatar } from './PlayerAvatar';
import { LaserTracerManager } from './LaserTracerManager';
import { FPSWeaponRenderer } from './FPSWeaponRenderer';
import { audioManager } from './AudioManager';
import { WEAPON_CONFIGS } from './WeaponConfigs';
import { MAP_CONFIGS } from './MapConfigs';

export interface GameEngineOptions {
  container: HTMLDivElement;
  onPointerLockChange: (locked: boolean) => void;
  onShootLaser: (shot: LaserShot) => void;
  onHitPlayer: (hit: HitEvent) => void;
  onLocalPlayerMove: (pos: { x: number; y: number; z: number }, rot: { y: number; pitch: number }) => void;
  onHitmarker: (isHeadshot: boolean) => void;
  onPowerupCollected?: (crystalType: string, toastMessage: string) => void;
  onServerCollectPowerup?: (powerupId: string) => void;
  onToggleGodMode?: (isGodMode: boolean) => void;
  onSpawnDevCrystal?: (type: 'red_crystal' | 'blue_crystal' | 'green_crystal', position: { x: number; y: number; z: number }) => void;
  onToggleStorm?: () => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private mapBundle: ArenaMeshBundle | null = null;
  private avatars = new Map<string, PlayerAvatar>();
  private tracerManager: LaserTracerManager;
  private weaponRenderer: FPSWeaponRenderer;
  private stormMesh: THREE.Mesh | null = null;

  // Local Player Physics & Controls State
  public localPlayerId: string = '';
  public localTeam: Team = 'red';
  public localWeaponType: WeaponType = 'pulse';
  public currentAmmo: number = 30;
  public maxAmmo: number = 30;
  public isReloading: boolean = false;
  public health: number = 100;
  public shield: number = 50;
  public isDead: boolean = false;
  public currentMapId: MapId = 'neon_grid';
  public isZoomed: boolean = false;
  public isLeftMouseDown: boolean = false;

  // Developer God Mode State
  public isGodMode: boolean = false;
  public isPaused: boolean = false;
  private godKeyBuffer: string[] = [];

  // Anatomical Limb Injury State (Sniper hits)
  public armHits: number = 0;
  public legHits: number = 0;
  public disabledWeapons: boolean = false;
  public speedMultiplier: number = 1.0;

  // Active Crystal Buff Timers (seconds)
  public redCrystalTimer: number = 0; // +10% Damage for 30s
  public greenCrystalTimer: number = 0; // +25 Shield & +25% Speed Overdrive for 30s

  public position = new THREE.Vector3(0, 1.6, 0);
  private velocity = new THREE.Vector3();
  public yaw = 0;
  public pitch = 0;

  private isGrounded = false;
  private isPointerLocked = false;
  private keysPressed: Record<string, boolean> = {};

  private lastShotTime = 0;
  private animationFrameId: number = 0;
  private clock = new THREE.Clock();

  // Callbacks
  private options: GameEngineOptions;

  constructor(options: GameEngineOptions) {
    this.options = options;
    this.container = options.container;

    // 1. THREE.JS SETUP
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.012);

    this.camera = new THREE.PerspectiveCamera(80, this.container.clientWidth / this.container.clientHeight, 0.1, 500);
    this.camera.position.copy(this.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Managers
    this.tracerManager = new LaserTracerManager(this.scene);
    this.weaponRenderer = new FPSWeaponRenderer(this.camera);

    // Event Listeners
    this.bindEvents();

    // Start Loop
    this.clock.start();
    this.animate();
  }

  public updateStorm(storm: { center: { x: number; y: number; z: number }; radius: number; isShrinking: boolean; isDisabled?: boolean }) {
    if (!this.stormMesh) {
      const geo = new THREE.CylinderGeometry(1, 1, 30, 48, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.stormMesh = new THREE.Mesh(geo, mat);
      this.stormMesh.position.y = 15;
      this.scene.add(this.stormMesh);
    }

    if (storm.isDisabled) {
      this.stormMesh.visible = false;
      return;
    }

    this.stormMesh.visible = true;
    this.stormMesh.position.x = storm.center.x;
    this.stormMesh.position.z = storm.center.z;
    this.stormMesh.scale.set(storm.radius, 1, storm.radius);

    // Pulse storm color if shrinking
    if (this.stormMesh.material instanceof THREE.MeshBasicMaterial) {
      this.stormMesh.material.color.setHex(storm.isShrinking ? 0xf43f5e : 0x00f3ff);
    }
  }

  public toggleStorm() {
    if (this.options.onToggleStorm) {
      this.options.onToggleStorm();
    }
  }

  public loadMap(mapId: MapId) {
    this.currentMapId = mapId;
    if (this.mapBundle) {
      this.scene.remove(this.mapBundle.sceneGroup);
    }
    this.mapBundle = MapBuilder.buildMap(mapId);
    this.scene.add(this.mapBundle.sceneGroup);
  }

  public setLocalPlayer(player: Player) {
    this.localPlayerId = player.id;
    this.localTeam = player.team;
    this.health = player.health;
    this.shield = player.shield;
    this.isDead = player.isDead;
    this.localWeaponType = player.weaponType;

    const config = WEAPON_CONFIGS[player.weaponType];
    this.maxAmmo = config.batteryCapacity;
    this.currentAmmo = config.batteryCapacity;
    this.weaponRenderer.setWeapon(player.weaponType);

    this.position.set(player.position.x, player.position.y + 1.5, player.position.z);
    this.yaw = player.rotation.y;
    this.pitch = player.rotation.pitch;
  }

  public updatePlayers(players: Player[]) {
    const activeIds = new Set<string>();

    players.forEach((p) => {
      activeIds.add(p.id);

      if (p.id === this.localPlayerId) {
        this.health = p.health;
        this.shield = p.shield;
        this.isDead = p.isDead;
        return;
      }

      let avatar = this.avatars.get(p.id);
      if (!avatar) {
        avatar = new PlayerAvatar(p, false);
        this.scene.add(avatar.mesh);
        this.avatars.set(p.id, avatar);
      }
      avatar.updateFromPlayerState(p);
    });

    // Remove disconnected players
    this.avatars.forEach((avatar, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(avatar.mesh);
        avatar.destroy();
        this.avatars.delete(id);
      }
    });
  }

  public handleRemoteLaserShot(shot: LaserShot) {
    const origin = new THREE.Vector3(shot.origin.x, shot.origin.y, shot.origin.z);
    const dir = new THREE.Vector3(shot.direction.x, shot.direction.y, shot.direction.z).normalize();
    const config = WEAPON_CONFIGS[shot.weaponType] || WEAPON_CONFIGS['pulse'];

    let tracerDistance = config.rayDistance;
    if (this.mapBundle && this.mapBundle.solidMeshes.length > 0) {
      const raycaster = new THREE.Raycaster(origin, dir, 0, config.rayDistance);
      const hits = raycaster.intersectObjects(this.mapBundle.solidMeshes, true);
      if (hits.length > 0) {
        tracerDistance = hits[0].distance;
        const hit = hits[0];
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
        this.tracerManager.spawnImpactParticles(hit.point, normal, '#ffaa00', 8);
      }
    }

    this.tracerManager.addLaserShot(shot, tracerDistance);
    audioManager.playLaserShot(shot.weaponType);
  }

  public switchWeapon(type: WeaponType) {
    if (this.disabledWeapons) {
      if (this.options.onPowerupCollected) {
        this.options.onPowerupCollected('alert', '⚠️ ALL WEAPONS DISABLED (BOTH ARMS SEVERELY INJURED)');
      }
      return;
    }
    if (this.armHits === 1 && type !== 'handgun') {
      if (this.options.onPowerupCollected) {
        this.options.onPowerupCollected('alert', '⚠️ ARM INJURED: RESTRICTED TO HANDGUN (PRESS SHIFT + 2)');
      }
      return;
    }
    if (this.isReloading) return;
    this.isZoomed = false;
    this.localWeaponType = type;
    const config = WEAPON_CONFIGS[type];
    this.maxAmmo = config.batteryCapacity;
    this.currentAmmo = config.batteryCapacity;
    this.weaponRenderer.setWeapon(type);
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      if (!this.isPointerLocked) {
        this.isZoomed = false;
        this.isLeftMouseDown = false;
      }
      this.options.onPointerLockChange(this.isPointerLocked);
    });

    this.container.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isDead) {
        this.container.requestPointerLock();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.isDead) return;
      // Lower sensitivity when zoomed for precision aiming
      const sensitivity = this.isZoomed ? 0.0011 : 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp pitch
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });

    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;

      // God Mode Activation Check: holding Shift and punching/typing G -> O -> D
      const isShiftHeld = Boolean(e.shiftKey || this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']);
      if (isShiftHeld) {
        if (e.code === 'KeyG') {
          this.godKeyBuffer = ['G'];
        } else if (e.code === 'KeyO' && (this.godKeyBuffer.length === 1 && this.godKeyBuffer[0] === 'G')) {
          this.godKeyBuffer.push('O');
        } else if (e.code === 'KeyD' && (this.godKeyBuffer.length === 2 && this.godKeyBuffer[1] === 'O')) {
          this.godKeyBuffer = [];
          this.toggleGodMode();
        } else if (this.keysPressed['KeyG'] && this.keysPressed['KeyO'] && this.keysPressed['KeyD']) {
          this.godKeyBuffer = [];
          this.toggleGodMode();
        }
      } else {
        this.godKeyBuffer = [];
      }

      // God Mode Hotkeys for Spawning Crystals & Storm Toggle
      if (this.isGodMode) {
        if (e.code === 'Digit7' || e.code === 'Numpad7') {
          this.spawnDevCrystal('red_crystal');
        } else if (e.code === 'Digit8' || e.code === 'Numpad8') {
          this.spawnDevCrystal('blue_crystal');
        } else if (e.code === 'Digit9' || e.code === 'Numpad9') {
          this.spawnDevCrystal('green_crystal');
        } else if (e.code === 'Digit0' || e.code === 'Numpad0') {
          this.toggleStorm();
        }
      }

      if (e.code === 'KeyR' && !this.isReloading && this.currentAmmo < this.maxAmmo) {
        this.isZoomed = false;
        this.reloadBattery();
      }

      // Weapon quickswitch 1-6 & Shift+2 Handgun
      if (e.code === 'Digit1') this.switchWeapon('pulse');
      if (e.code === 'Digit2') {
        if (isShiftHeld) {
          this.switchWeapon('handgun');
        } else {
          this.switchWeapon('rail');
        }
      }
      if (e.code === 'Digit3') this.switchWeapon('scatter');
      if (e.code === 'Digit4') this.switchWeapon('sniper');
      if (e.code === 'Digit5') this.switchWeapon('cannon');
      if (e.code === 'Digit6') this.switchWeapon('smg');
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked || this.isDead) return;
      if (e.button === 0) {
        this.isLeftMouseDown = true;
        this.tryShootLaser();
      } else if (e.button === 2) {
        this.isZoomed = !this.isZoomed;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isLeftMouseDown = false;
      }
    });

    window.addEventListener('blur', () => {
      this.isLeftMouseDown = false;
      this.isZoomed = false;
    });
  }

  public reloadBattery() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.isZoomed = false;
    audioManager.playRecharge();

    const config = WEAPON_CONFIGS[this.localWeaponType];
    setTimeout(() => {
      this.currentAmmo = this.maxAmmo;
      this.isReloading = false;
    }, config.reloadTime);
  }

  private tryShootLaser() {
    if (this.disabledWeapons) {
      if (this.options.onPowerupCollected) {
        this.options.onPowerupCollected('alert', '⚠️ CANNOT FIRE: ALL WEAPONS DISABLED (BOTH ARMS SEVERELY INJURED)');
      }
      return;
    }
    if (this.armHits === 1 && this.localWeaponType !== 'handgun') {
      this.switchWeapon('handgun');
    }

    if (this.isReloading || this.currentAmmo <= 0) {
      if (this.currentAmmo <= 0) this.reloadBattery();
      return;
    }

    const now = performance.now();
    const config = WEAPON_CONFIGS[this.localWeaponType];

    if (now - this.lastShotTime < config.fireRate) return;
    this.lastShotTime = now;

    this.currentAmmo--;
    this.weaponRenderer.triggerShootEffect();
    audioManager.playLaserShot(this.localWeaponType);

    // Calculate Ray Direction from Camera
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    // Add Weapon Spread
    if (config.spread > 0) {
      dir.x += (Math.random() - 0.5) * config.spread;
      dir.y += (Math.random() - 0.5) * config.spread;
      dir.z += (Math.random() - 0.5) * config.spread;
      dir.normalize();
    }

    const origin = this.weaponRenderer.getMuzzleWorldPosition();

    // Create Shot Event
    const shot: LaserShot = {
      id: Math.random().toString(36).substring(2, 9),
      shooterId: this.localPlayerId,
      shooterName: 'You',
      team: this.localTeam,
      weaponType: this.localWeaponType,
      origin: { x: origin.x, y: origin.y, z: origin.z },
      direction: { x: dir.x, y: dir.y, z: dir.z },
      color: config.beamColor,
      timestamp: Date.now(),
    };

    // Raycast for Hit Detection against opponents AND walls/ramps
    this.checkRaycastHit(origin, dir, config, shot);
    this.options.onShootLaser(shot);
  }

  private checkRaycastHit(origin: THREE.Vector3, dir: THREE.Vector3, config: typeof WEAPON_CONFIGS['pulse'], shot: LaserShot) {
    const raycaster = new THREE.Raycaster(origin, dir, 0, config.rayDistance);
    const targetMeshes: THREE.Object3D[] = [];
    const meshToPlayerId = new Map<THREE.Object3D, { id: string; location: 'head' | 'torso' | 'arm' | 'leg' }>();

    this.avatars.forEach((avatar, pid) => {
      if (avatar.mesh.visible) {
        avatar.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            targetMeshes.push(child);
            let location: 'head' | 'torso' | 'arm' | 'leg' = 'torso';
            if (child === avatar.visorMesh || child === avatar.headMesh || child.parent === avatar.headGroup) {
              location = 'head';
            } else if (child === avatar.armLeftMesh || child === avatar.armRightMesh) {
              location = 'arm';
            } else if (child === avatar.legLeftMesh || child === avatar.legRightMesh) {
              location = 'leg';
            } else {
              location = 'torso';
            }
            meshToPlayerId.set(child, { id: pid, location });
          }
        });
      }
    });

    // Solid environment objects (walls, pillars, ramps, floor)
    const solidMeshes = this.mapBundle?.solidMeshes || [];
    const allObjects = [...targetMeshes, ...solidMeshes];

    const hits = raycaster.intersectObjects(allObjects, true);

    let tracerDistance = config.rayDistance;

    if (hits.length > 0) {
      const hit = hits[0];
      tracerDistance = hit.distance;

      // Check if hit object or ancestor belongs to player avatar
      let match: { id: string; location: 'head' | 'torso' | 'arm' | 'leg' } | undefined;
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (meshToPlayerId.has(curr)) {
          match = meshToPlayerId.get(curr);
          break;
        }
        curr = curr.parent;
      }

      if (match) {
        // Player hit!
        const victimAvatar = this.avatars.get(match.id);
        let location = match.location;
        if (victimAvatar) {
          const relY = hit.point.y - victimAvatar.mesh.position.y;
          if (relY >= 1.60) {
            location = 'head';
          } else if (relY < 0.65) {
            location = 'leg';
          } else {
            const relX = hit.point.x - victimAvatar.mesh.position.x;
            const relZ = hit.point.z - victimAvatar.mesh.position.z;
            if (Math.hypot(relX, relZ) > 0.38) {
              location = 'arm';
            } else {
              location = 'torso';
            }
          }
        }

        const isHeadshot = location === 'head';
        const isSniper = this.localWeaponType === 'sniper';

        let calculatedDmg = 0;
        if (isSniper) {
          if (location === 'head' || location === 'torso') {
            calculatedDmg = 200; // One shot kill for torso & head!
          } else {
            calculatedDmg = 25; // 25 damage for limbs (arm / leg)
          }
        } else {
          const damageMultiplier = this.redCrystalTimer > 0 ? 1.10 : 1.0;
          calculatedDmg = Math.round(config.damage * (isHeadshot ? config.headshotMultiplier : 1.0) * damageMultiplier);
        }

        const isFatalOrHead = isHeadshot || (isSniper && (location === 'head' || location === 'torso'));
        audioManager.playHitmarker(isFatalOrHead);
        this.options.onHitmarker(isFatalOrHead);

        this.tracerManager.spawnImpactParticles(
          hit.point,
          hit.face?.normal || new THREE.Vector3(0, 1, 0),
          config.beamColor,
          15
        );

        this.options.onHitPlayer({
          shooterId: this.localPlayerId,
          victimId: match.id,
          damage: calculatedDmg,
          isHeadshot,
          weaponType: this.localWeaponType,
          hitPosition: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
          hitLocation: location,
        });
      } else {
        // Environment hit (wall, ramp, pillar, block) -> Laser cannot penetrate walls!
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
        this.tracerManager.spawnImpactParticles(hit.point, normal, '#ffaa00', 12);
      }
    }

    // Add laser tracer line clipped to actual obstacle or player hit distance
    this.tracerManager.addLaserShot(shot, tracerDistance);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isDead && !this.isPaused && this.isPointerLocked) {
      this.updateMovement(dt);

      if (this.isLeftMouseDown) {
        this.tryShootLaser();
      }
    }

    // Camera FOV Zoom interpolation
    let targetFov = 80;
    if (this.isZoomed && !this.isDead && this.isPointerLocked) {
      switch (this.localWeaponType) {
        case 'sniper':
          targetFov = 20;
          break;
        case 'rail':
          targetFov = 38;
          break;
        case 'pulse':
          targetFov = 50;
          break;
        case 'scatter':
          targetFov = 55;
          break;
        case 'cannon':
          targetFov = 48;
          break;
        case 'smg':
          targetFov = 52;
          break;
      }
    }

    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 18);
      this.camera.updateProjectionMatrix();
    }

    // Camera Orientation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.position.copy(this.position);

    // Update Weapon Bob & Recoil
    const isMoving = this.keysPressed['KeyW'] || this.keysPressed['KeyS'] || this.keysPressed['KeyA'] || this.keysPressed['KeyD'];
    const isSprinting = Boolean(this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']);
    const ammoRatio = this.currentAmmo / this.maxAmmo;
    this.weaponRenderer.update(dt, isMoving, isSprinting, ammoRatio, this.isZoomed, this.localWeaponType);

    // Update Laser Tracers & Particles
    this.tracerManager.update();

    // Rotate Powerup Gems
    if (this.mapBundle) {
      this.mapBundle.powerupMeshes.forEach((pGroup) => {
        const gem = pGroup.getObjectByName('floatingGem');
        if (gem) {
          gem.rotation.y += dt * 2.0;
          gem.position.y = Math.sin(performance.now() * 0.003) * 0.12;
        }
      });
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  private updateMovement(dt: number) {
    if (this.isGodMode) {
      this.health = 100;
      this.shield = 50;
      this.isDead = false;

      // Tick down active crystal buff timers
      if (this.redCrystalTimer > 0) this.redCrystalTimer = Math.max(0, this.redCrystalTimer - dt);
      if (this.greenCrystalTimer > 0) this.greenCrystalTimer = Math.max(0, this.greenCrystalTimer - dt);
      this.checkPowerupPickups();

      // GOD MODE FLIGHT PHYSICS
      const flySpeed = 22.0;

      // Vertical flight keys: Space (Ascend), Ctrl/C/E (Descend)
      if (this.keysPressed['Space']) {
        this.position.y += flySpeed * dt;
        this.velocity.y = 0;
        this.isGrounded = false;
      }
      if (this.keysPressed['ControlLeft'] || this.keysPressed['ControlRight'] || this.keysPressed['KeyC'] || this.keysPressed['KeyE']) {
        this.position.y -= flySpeed * dt;
      }

      // 3D Camera Direction Flight on WASD
      const cameraDir = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDir);
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

      const moveDir = new THREE.Vector3();
      if (this.keysPressed['KeyW']) moveDir.add(cameraDir);
      if (this.keysPressed['KeyS']) moveDir.sub(cameraDir);
      if (this.keysPressed['KeyD']) moveDir.add(right);
      if (this.keysPressed['KeyA']) moveDir.sub(right);

      if (moveDir.lengthSq() > 0) moveDir.normalize();

      this.position.x += moveDir.x * flySpeed * dt;
      this.position.y += moveDir.y * flySpeed * dt;
      this.position.z += moveDir.z * flySpeed * dt;

      // Clamp ground height and max ceiling
      this.position.y = Math.max(1.6, Math.min(85, this.position.y));

      // Emit position sync
      this.options.onLocalPlayerMove(
        { x: this.position.x, y: this.position.y - 1.5, z: this.position.z },
        { y: this.yaw, pitch: this.pitch }
      );
      return;
    }

    // Tick down active crystal buff timers
    if (this.redCrystalTimer > 0) {
      this.redCrystalTimer = Math.max(0, this.redCrystalTimer - dt);
    }
    if (this.greenCrystalTimer > 0) {
      this.greenCrystalTimer = Math.max(0, this.greenCrystalTimer - dt);
    }

    // Check for powerup/crystal pickups
    this.checkPowerupPickups();

    const isSprinting = Boolean(this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']);
    const speedMult = this.greenCrystalTimer > 0 ? 1.50 : 1.0; // Green Crystal +50% Speed Boost
    const legPenalty = this.speedMultiplier || 1.0; // 0.50 for 1 leg hit, 0.25 for 2 leg hits
    const speed = (isSprinting ? 12.5 : 7.5) * speedMult * legPenalty;

    // Movement Vectors based on Camera Yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keysPressed['KeyW']) moveDir.add(forward);
    if (this.keysPressed['KeyS']) moveDir.sub(forward);
    if (this.keysPressed['KeyD']) moveDir.add(right);
    if (this.keysPressed['KeyA']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) moveDir.normalize();

    // Horizontal Movement
    this.position.x += moveDir.x * speed * dt;
    this.position.z += moveDir.z * speed * dt;

    // 1. Horizontal Obstacle Push-Out (Walls, Pillars, Blocks)
    const playerRadius = 0.55;
    const feetY = this.position.y - 1.6;

    if (this.mapBundle && this.mapBundle.colliders) {
      this.mapBundle.colliders.forEach((box) => {
        const boxTop = box.max.y;
        const isBelowTop = feetY < boxTop - 0.6;
        const isAboveBottom = (feetY + 1.8) > box.min.y;

        if (isBelowTop && isAboveBottom) {
          const minX = box.min.x - playerRadius;
          const maxX = box.max.x + playerRadius;
          const minZ = box.min.z - playerRadius;
          const maxZ = box.max.z + playerRadius;

          if (
            this.position.x > minX &&
            this.position.x < maxX &&
            this.position.z > minZ &&
            this.position.z < maxZ
          ) {
            const pLeft = this.position.x - minX;
            const pRight = maxX - this.position.x;
            const pTop = this.position.z - minZ;
            const pBottom = maxZ - this.position.z;

            const minOverlap = Math.min(pLeft, pRight, pTop, pBottom);
            if (minOverlap === pLeft) this.position.x = minX;
            else if (minOverlap === pRight) this.position.x = maxX;
            else if (minOverlap === pTop) this.position.z = minZ;
            else if (minOverlap === pBottom) this.position.z = maxZ;
          }
        }
      });
    }

    // 2. Downward Raycast for Walkable Surface Detection (Ground, Ramps, Catwalks, Platforms)
    let groundHeight = 0;

    if (this.mapBundle && this.mapBundle.solidMeshes && this.mapBundle.solidMeshes.length > 0) {
      const rayOrigin = new THREE.Vector3(this.position.x, this.position.y + 0.8, this.position.z);
      const rayDirection = new THREE.Vector3(0, -1, 0);
      const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 15);

      const hits = raycaster.intersectObjects(this.mapBundle.solidMeshes, true);
      if (hits.length > 0) {
        for (const hit of hits) {
          if (hit.point.y <= rayOrigin.y - 0.1) {
            groundHeight = Math.max(groundHeight, hit.point.y);
            break;
          }
        }
      }
    }

    const targetEyeY = groundHeight + 1.6;

    // 3. Jump Physics & Gravity
    const gravity = -26;

    if (this.isGrounded) {
      this.velocity.y = 0;
      if (this.keysPressed['Space']) {
        this.velocity.y = 10.0;
        this.isGrounded = false;
        audioManager.playJump();
      } else {
        const diffY = targetEyeY - this.position.y;
        if (Math.abs(diffY) <= 1.4) {
          this.position.y = targetEyeY;
        } else if (diffY < -1.4) {
          this.isGrounded = false;
        }
      }
    }

    if (!this.isGrounded) {
      this.velocity.y += gravity * dt;
      this.position.y += this.velocity.y * dt;

      if (this.position.y <= targetEyeY) {
        this.position.y = targetEyeY;
        this.isGrounded = true;
        this.velocity.y = 0;
      }
    }

    // Clamp inside Arena Bounds
    const maxBound = 38;
    this.position.x = Math.max(-maxBound, Math.min(maxBound, this.position.x));
    this.position.z = Math.max(-maxBound, Math.min(maxBound, this.position.z));

    // Emit Position sync over WebSocket
    this.options.onLocalPlayerMove(
      { x: this.position.x, y: this.position.y - 1.5, z: this.position.z },
      { y: this.yaw, pitch: this.pitch }
    );
  }

  public toggleGodMode() {
    this.isGodMode = !this.isGodMode;
    audioManager.playPowerup();
    if (this.isGodMode) {
      this.health = 100;
      this.shield = 50;
      this.isDead = false;
    }
    if (this.options.onToggleGodMode) {
      this.options.onToggleGodMode(this.isGodMode);
    }
  }

  public spawnDevCrystal(crystalType: 'red_crystal' | 'blue_crystal' | 'green_crystal') {
    if (!this.isGodMode) return;

    // Raycast from camera center forward to find floor / target position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    let spawnPos = new THREE.Vector3();
    if (this.mapBundle && this.mapBundle.solidMeshes.length > 0) {
      const hits = raycaster.intersectObjects(this.mapBundle.solidMeshes, true);
      if (hits.length > 0 && hits[0].distance < 35) {
        spawnPos.copy(hits[0].point);
        spawnPos.y += 0.8;
      } else {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        spawnPos.copy(this.camera.position).add(dir.multiplyScalar(4));
      }
    } else {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      spawnPos.copy(this.camera.position).add(dir.multiplyScalar(4));
    }

    spawnPos.y = Math.max(0.8, spawnPos.y);

    if (this.options.onSpawnDevCrystal) {
      this.options.onSpawnDevCrystal(crystalType, { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z });
    }
  }

  public addDynamicPowerup(powerup: { id: string; type: string; position: { x: number; y: number; z: number } }) {
    if (!this.mapBundle) return;
    const pGroup = MapBuilder.createPowerupMesh({
      id: powerup.id,
      type: powerup.type as PowerupType,
      position: powerup.position,
      active: true,
      respawnTime: 20,
    });
    this.scene.add(pGroup);
    this.mapBundle.powerupMeshes.set(powerup.id, pGroup);
  }

  public hidePowerup(powerupId: string) {
    if (this.mapBundle) {
      const pGroup = this.mapBundle.powerupMeshes.get(powerupId);
      if (pGroup) {
        pGroup.visible = false;
        if (powerupId.startsWith('dev_crystal_')) {
          this.scene.remove(pGroup);
          this.mapBundle.powerupMeshes.delete(powerupId);
        }
      }
    }
  }

  public showPowerup(powerupId: string) {
    if (this.mapBundle) {
      const pGroup = this.mapBundle.powerupMeshes.get(powerupId);
      if (pGroup) pGroup.visible = true;
    }
  }

  private checkPowerupPickups() {
    if (!this.mapBundle || this.isDead) return;

    const currentMapConfig = MAP_CONFIGS[this.currentMapId] || MAP_CONFIGS['neon_grid'];

    this.mapBundle.powerupMeshes.forEach((pGroup, id) => {
      if (!pGroup.visible) return;

      const pPos = pGroup.position;
      const dist = Math.hypot(this.position.x - pPos.x, this.position.z - pPos.z);
      const dy = Math.abs((this.position.y - 1.5) - pPos.y);

      if (dist < 2.2 && dy < 2.5) {
        // Collect Powerup / Crystal!
        pGroup.visible = false;

        if (this.options.onServerCollectPowerup) {
          this.options.onServerCollectPowerup(id);
        }

        audioManager.playPowerup();

        const spawn = currentMapConfig.powerupSpawns.find((s) => s.id === id);
        const pType = spawn?.type || (id.includes('red') ? 'red_crystal' : id.includes('blue') ? 'blue_crystal' : id.includes('green') ? 'green_crystal' : 'red_crystal');

        if (pType === 'red_crystal' || pType === 'quad_damage') {
          this.redCrystalTimer = 30;
          if (this.options.onPowerupCollected) {
            this.options.onPowerupCollected('red_crystal', '🔴 RED CRYSTAL: +10% WEAPON DAMAGE (30s)');
          }
        } else if (pType === 'blue_crystal' || pType === 'health') {
          this.health = Math.min(100, this.health + 25);
          if (this.options.onPowerupCollected) {
            this.options.onPowerupCollected('blue_crystal', '🔵 BLUE CRYSTAL: +25 HP REHEALTH!');
          }
        } else if (pType === 'green_crystal' || pType === 'speed') {
          this.shield = Math.min(50, this.shield + 25);
          this.greenCrystalTimer = 30;
          if (this.options.onPowerupCollected) {
            this.options.onPowerupCollected('green_crystal', '🟢 GREEN CRYSTAL: SPEED BOOST ACTIVATED (+50% SPEED FOR 30s)');
          }
        }

        if (id.startsWith('dev_crystal_')) {
          this.scene.remove(pGroup);
          this.mapBundle.powerupMeshes.delete(id);
        }
      }
    });
  }

  private onResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

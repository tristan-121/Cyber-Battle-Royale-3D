import * as THREE from 'three';
import { Player, WeaponType } from '../types';
import { WEAPON_CONFIGS } from './WeaponConfigs';

export class PlayerAvatar {
  public mesh: THREE.Group;
  public headGroup: THREE.Group;
  public headMesh: THREE.Mesh;
  public visorMesh: THREE.Mesh;
  public bodyMesh: THREE.Mesh;
  public armLeftMesh: THREE.Mesh;
  public armRightMesh: THREE.Mesh;
  public legLeftMesh: THREE.Mesh;
  public legRightMesh: THREE.Mesh;
  public weaponMesh: THREE.Group;
  public currentWeaponType?: WeaponType;
  public nameCanvasMesh: THREE.Mesh;
  public nameTexture: THREE.CanvasTexture;
  private canvasContext: CanvasRenderingContext2D;

  public playerId: string;
  private isLocal: boolean;

  constructor(player: Player, isLocal: boolean = false) {
    this.playerId = player.id;
    this.isLocal = isLocal;
    this.mesh = new THREE.Group();
    this.headGroup = new THREE.Group();

    // Color based on team or custom hex
    let teamHex = 0x00f3ff;
    if (player.team === 'red') teamHex = 0xff2a00;
    if (player.team === 'blue') teamHex = 0x00a8ff;
    if (player.team === 'green') teamHex = 0x00ff66;

    // 1. TORSO / NEON ARMOR VEST
    const bodyGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.95, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x161b22,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 1.1;
    this.mesh.add(this.bodyMesh);

    // Glowing Neon Target Vest Plates (Front & Back hit sensors)
    const vestGeo = new THREE.BoxGeometry(0.55, 0.5, 0.55);
    const vestMat = new THREE.MeshStandardMaterial({
      color: teamHex,
      emissive: teamHex,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = 1.15;
    this.mesh.add(vest);

    // 2. ARMS (Left & Right)
    const armGeo = new THREE.BoxGeometry(0.20, 0.75, 0.20);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x21262d, roughness: 0.3, metalness: 0.7 });
    this.armLeftMesh = new THREE.Mesh(armGeo, armMat);
    this.armLeftMesh.position.set(-0.46, 1.1, 0);
    this.armRightMesh = new THREE.Mesh(armGeo, armMat);
    this.armRightMesh.position.set(0.46, 1.1, 0);
    this.mesh.add(this.armLeftMesh, this.armRightMesh);

    // 3. LEGS (Left & Right)
    const legGeo = new THREE.BoxGeometry(0.22, 0.80, 0.22);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 0.4 });
    this.legLeftMesh = new THREE.Mesh(legGeo, legMat);
    this.legLeftMesh.position.set(-0.20, 0.40, 0);
    this.legRightMesh = new THREE.Mesh(legGeo, legMat);
    this.legRightMesh.position.set(0.20, 0.40, 0);
    this.mesh.add(this.legLeftMesh, this.legRightMesh);

    // 4. HEAD & VISOR
    const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x21262d, roughness: 0.2 });
    this.headMesh = new THREE.Mesh(headGeo, headMat);

    // Visor Glow
    const visorGeo = new THREE.BoxGeometry(0.40, 0.14, 0.28);
    const visorMat = new THREE.MeshBasicMaterial({ color: teamHex });
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.position.set(0, 0.04, 0.18);

    this.headGroup.add(this.headMesh);
    this.headGroup.add(this.visorMesh);
    this.headGroup.position.y = 1.82;
    this.mesh.add(this.headGroup);

    // 3. BLASTER MODEL HELD IN HANDS
    this.weaponMesh = new THREE.Group();
    this.weaponMesh.position.set(0.35, 1.2, 0.2);
    this.mesh.add(this.weaponMesh);
    this.updateWeaponMesh(player.weaponType || 'pulse');

    // 4. OVERHEAD NAMEPLATE & HEALTH BAR
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.canvasContext = canvas.getContext('2d')!;
    this.nameTexture = new THREE.CanvasTexture(canvas);

    const nameGeo = new THREE.PlaneGeometry(1.6, 0.4);
    const nameMat = new THREE.MeshBasicMaterial({
      map: this.nameTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.nameCanvasMesh = new THREE.Mesh(nameGeo, nameMat);
    this.nameCanvasMesh.position.y = 2.4;
    this.mesh.add(this.nameCanvasMesh);

    // Local player body is hidden or translucent in FPS camera view
    if (this.isLocal) {
      this.mesh.visible = false; // Hidden in 1st person view (weapon render handled separately)
    }

    this.updateFromPlayerState(player);
  }

  private updateWeaponMesh(weaponType: WeaponType) {
    if (this.currentWeaponType === weaponType) return;
    this.currentWeaponType = weaponType;

    // Clear old weapon parts
    while (this.weaponMesh.children.length > 0) {
      const child = this.weaponMesh.children[0];
      this.weaponMesh.remove(child);
    }

    const config = WEAPON_CONFIGS[weaponType] || WEAPON_CONFIGS['pulse'];
    const beamHex = parseInt(config.beamColor.replace('#', '0x')) || 0x00f3ff;

    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.9, roughness: 0.2 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x21262d, metalness: 0.8 });
    const beamMat = new THREE.MeshBasicMaterial({ color: beamHex });

    switch (weaponType) {
      case 'pulse': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.55), darkMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8), beamMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, 0.35);
        this.weaponMesh.add(body, barrel);
        break;
      }
      case 'rail': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.50), darkMat);
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.60), metalMat);
        railL.position.set(-0.05, 0.02, 0.30);
        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.60), metalMat);
        railR.position.set(0.05, 0.02, 0.30);
        const coil = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.04), beamMat);
        coil.position.set(0, 0.02, 0.20);
        this.weaponMesh.add(body, railL, railR, coil);
        break;
      }
      case 'scatter': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.48), darkMat);
        [-0.04, 0, 0.04].forEach((x, i) => {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8), beamMat);
          b.rotation.x = Math.PI / 2;
          b.position.set(x, i === 1 ? 0.04 : -0.02, 0.32);
          this.weaponMesh.add(b);
        });
        this.weaponMesh.add(body);
        break;
      }
      case 'sniper': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.65), darkMat);
        const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), metalMat);
        longBarrel.rotation.x = Math.PI / 2;
        longBarrel.position.set(0, 0.02, 0.50);
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.10, 8), beamMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.set(0, 0.02, 0.88);
        this.weaponMesh.add(body, longBarrel, tip);
        break;
      }
      case 'cannon': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.50), darkMat);
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12), beamMat);
        drum.position.set(0, -0.12, 0.05);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.40, 12), metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, 0.35);
        this.weaponMesh.add(body, drum, barrel);
        break;
      }
      case 'smg': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.15, 0.38), darkMat);
        const clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.07), beamMat);
        clip.position.set(0, -0.14, 0.02);
        clip.rotation.x = 0.3;
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), beamMat);
        barrel.position.set(0, 0.02, 0.22);
        this.weaponMesh.add(body, clip, barrel);
        break;
      }
      case 'handgun': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), darkMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.20, 8), beamMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, 0.18);
        this.weaponMesh.add(body, barrel);
        break;
      }
    }
  }

  public updateFromPlayerState(player: Player) {
    // Smooth position lerp
    this.mesh.position.set(player.position.x, player.position.y, player.position.z);
    this.mesh.rotation.y = player.rotation.y;
    this.headGroup.rotation.x = player.rotation.pitch;

    if (player.weaponType) {
      this.updateWeaponMesh(player.weaponType);
    }

    if (player.isDead) {
      this.mesh.visible = false;
      return;
    }

    if (!this.isLocal) {
      this.mesh.visible = true;
    }

    // Render Overhead Nameplate Canvas
    const ctx = this.canvasContext;
    ctx.clearRect(0, 0, 256, 64);

    // Geometric Balance Dark Slate Panel
    ctx.fillStyle = 'rgba(2, 6, 23, 0.90)';
    ctx.fillRect(8, 4, 240, 56);

    // Cyan Left Tech Bar Accent
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(8, 4, 4, 56);

    // Border line
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 4, 240, 56);

    // Name Text (Monospace Font)
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(player.name, 20, 24);

    // HP Numerics Right Aligned
    ctx.textAlign = 'right';
    const hpVal = Math.max(0, Math.round(player.health));
    ctx.fillStyle = hpVal > 50 ? '#22d3ee' : hpVal > 20 ? '#fbbf24' : '#f43f5e';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${hpVal} HP`, 240, 24);

    // Health Bar Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 32, 220, 10);

    // Segmented Health Bar
    const hpRatio = hpVal / 100;
    ctx.fillStyle = hpVal > 50 ? '#22d3ee' : hpVal > 20 ? '#fbbf24' : '#f43f5e';
    ctx.fillRect(20, 32, 220 * hpRatio, 10);

    // Shield Bar Fill
    if (player.shield > 0) {
      const shieldRatio = Math.max(0, player.shield) / 50;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 46, 220 * shieldRatio, 4);
    }

    this.nameTexture.needsUpdate = true;
  }

  public destroy() {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

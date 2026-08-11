import * as THREE from 'three';
import { WeaponConfig, WeaponType } from '../types';
import { WEAPON_CONFIGS } from './WeaponConfigs';

export class FPSWeaponRenderer {
  public weaponGroup: THREE.Group;
  private camera: THREE.Camera;
  private currentWeaponType: WeaponType = 'pulse';

  private gunMesh: THREE.Group;
  private muzzleFlashMesh: THREE.Mesh;
  private batteryBarMesh: THREE.Mesh;

  private recoilOffset = 0;
  private bobTime = 0;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.weaponGroup = new THREE.Group();
    this.gunMesh = new THREE.Group();

    // Attach weapon group to camera
    this.camera.add(this.weaponGroup);

    // Initial dummy meshes
    this.muzzleFlashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0 })
    );

    this.batteryBarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff })
    );

    this.setWeapon('pulse');
  }

  public setWeapon(type: WeaponType) {
    this.currentWeaponType = type;
    const config = WEAPON_CONFIGS[type];
    const beamHex = parseInt(config.beamColor.replace('#', '0x')) || 0x00f3ff;

    // Clear old meshes
    while (this.weaponGroup.children.length > 0) {
      this.weaponGroup.remove(this.weaponGroup.children[0]);
    }

    this.gunMesh = new THREE.Group();

    // Standard Materials
    const darkBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f141d, roughness: 0.2, metalness: 0.85 });
    const metalBarrelMat = new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.3, metalness: 0.9 });
    const accentMat = new THREE.MeshStandardMaterial({ color: beamHex, emissive: beamHex, emissiveIntensity: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: beamHex, transparent: true, opacity: 0.6, emissive: beamHex, emissiveIntensity: 0.5 });

    let muzzleZ = -0.65;

    switch (type) {
      case 'pulse': { // 1. PULSE RIFLE (Cyan)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.60), darkBodyMat);
        this.gunMesh.add(body);

        // Top Tactical Rail & Holo Sight Box
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.45), darkBodyMat);
        rail.position.set(0, 0.11, -0.02);
        this.gunMesh.add(rail);

        const scope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.12), accentMat);
        scope.position.set(0, 0.15, 0.05);
        this.gunMesh.add(scope);

        // Main Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.40, 12), metalBarrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.42);
        this.gunMesh.add(barrel);

        // Cyan Muzzle Brake Tip
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.08), accentMat);
        tip.position.set(0, 0.02, -0.62);
        this.gunMesh.add(tip);

        // Cyan Battery Core Module
        const battery = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), accentMat);
        battery.position.set(0, -0.06, 0.10);
        this.gunMesh.add(battery);

        muzzleZ = -0.68;
        break;
      }

      case 'rail': { // 2. HEAVY RAILGUN (Crimson)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 0.55), darkBodyMat);
        this.gunMesh.add(body);

        // Dual Electromagnetic Accelerator Rails
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.70), metalBarrelMat);
        railL.position.set(-0.06, 0.02, -0.52);
        this.gunMesh.add(railL);

        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.70), metalBarrelMat);
        railR.position.set(0.06, 0.02, -0.52);
        this.gunMesh.add(railR);

        // Crimson Glowing Energy Accelerator Coils
        [-0.30, -0.48, -0.66].forEach((zPos) => {
          const coil = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.04), accentMat);
          coil.position.set(0, 0.02, zPos);
          this.gunMesh.add(coil);
        });

        // Heavy Capacitor Unit
        const capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12), accentMat);
        capacitor.position.set(0, -0.12, 0.12);
        capacitor.rotation.x = Math.PI / 2;
        this.gunMesh.add(capacitor);

        muzzleZ = -0.88;
        break;
      }

      case 'scatter': { // 3. TRI-SCATTER LASER (Lime Green)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.52), darkBodyMat);
        this.gunMesh.add(body);

        // Triangular Cluster Barrel Frame
        const barrelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.35), darkBodyMat);
        barrelFrame.position.set(0, 0.01, -0.42);
        this.gunMesh.add(barrelFrame);

        // 3 Separate Output Nozzles arranged in Triangle
        const nozzlePositions = [
          [0, 0.06, -0.60],
          [-0.05, -0.04, -0.60],
          [0.05, -0.04, -0.60],
        ];
        nozzlePositions.forEach(([x, y, z]) => {
          const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 12), accentMat);
          nozzle.rotation.x = Math.PI / 2;
          nozzle.position.set(x, y, z);
          this.gunMesh.add(nozzle);
        });

        // Lower Pump Grip
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.22), metalBarrelMat);
        pump.position.set(0, -0.11, -0.28);
        this.gunMesh.add(pump);

        // Lime Green Power Cylinder
        const powerCell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), accentMat);
        powerCell.position.set(0, -0.12, 0.08);
        this.gunMesh.add(powerCell);

        muzzleZ = -0.68;
        break;
      }

      case 'sniper': { // 4. PRECISE BEAM SNIPER (Electric Violet)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.75), darkBodyMat);
        this.gunMesh.add(body);

        // Ultra-Long Precision Barrel
        const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.85, 12), metalBarrelMat);
        longBarrel.rotation.x = Math.PI / 2;
        longBarrel.position.set(0, 0.03, -0.72);
        this.gunMesh.add(longBarrel);

        // Flash Suppressor Tip
        const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 12), accentMat);
        suppressor.rotation.x = Math.PI / 2;
        suppressor.position.set(0, 0.03, -1.12);
        this.gunMesh.add(suppressor);

        // Dual Mount Optical Scope
        const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 12), darkBodyMat);
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.set(0, 0.13, -0.05);
        this.gunMesh.add(scopeBody);

        const scopeLensF = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 12), glassMat);
        scopeLensF.rotation.x = Math.PI / 2;
        scopeLensF.position.set(0, 0.13, -0.21);
        this.gunMesh.add(scopeLensF);

        // Front Folding Bipod Legs
        [-0.08, 0.08].forEach((x) => {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), metalBarrelMat);
          leg.position.set(x, -0.11, -0.42);
          leg.rotation.z = x > 0 ? -0.3 : 0.3;
          this.gunMesh.add(leg);
        });

        muzzleZ = -1.18;
        break;
      }

      case 'cannon': { // 5. AUTO LASER CANNON (Neon Amber)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.55), darkBodyMat);
        this.gunMesh.add(body);

        // Rotary Quad Barrel Cluster Frame
        const barrelHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16), metalBarrelMat);
        barrelHousing.rotation.x = Math.PI / 2;
        barrelHousing.position.set(0, 0.02, -0.48);
        this.gunMesh.add(barrelHousing);

        // 4 Rotary Barrels inside Housing
        const ringOffset = 0.06;
        [
          [ringOffset, ringOffset],
          [-ringOffset, ringOffset],
          [ringOffset, -ringOffset],
          [-ringOffset, -ringOffset],
        ].forEach(([bx, by]) => {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 12), accentMat);
          b.rotation.x = Math.PI / 2;
          b.position.set(bx, by + 0.02, -0.52);
          this.gunMesh.add(b);
        });

        // Amber Drum Magazine
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16), accentMat);
        drum.position.set(0, -0.16, -0.02);
        this.gunMesh.add(drum);

        muzzleZ = -0.80;
        break;
      }

      case 'smg': { // 6. VIPER CYBER-SMG (Neon Magenta)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.42), darkBodyMat);
        this.gunMesh.add(body);

        // Micro Dual Side-Vented Barrels
        const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), metalBarrelMat);
        barrelL.rotation.x = Math.PI / 2;
        barrelL.position.set(-0.025, 0.02, -0.32);
        this.gunMesh.add(barrelL);

        const barrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), metalBarrelMat);
        barrelR.rotation.x = Math.PI / 2;
        barrelR.position.set(0.025, 0.02, -0.32);
        this.gunMesh.add(barrelR);

        // Dual Muzzle Tip Glow
        const smgTip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.06), accentMat);
        smgTip.position.set(0, 0.02, -0.48);
        this.gunMesh.add(smgTip);

        // Angled Fast-Loader Magenta Battery Clip
        const clip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.09), accentMat);
        clip.position.set(0, -0.18, 0.02);
        clip.rotation.x = 0.35; // Forward angled clip
        this.gunMesh.add(clip);

        // Forward Vertical Grip
        const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.05), darkBodyMat);
        foregrip.position.set(0, -0.12, -0.20);
        this.gunMesh.add(foregrip);

        // Top Micro-Dot Reflex Sight Frame
        const reflex = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.08), accentMat);
        reflex.position.set(0, 0.12, -0.05);
        this.gunMesh.add(reflex);

        muzzleZ = -0.52;
        break;
      }

      case 'handgun': { // 7. TACTICAL CYBER-HANDGUN (Bright Cyan Sidearm)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.32), darkBodyMat);
        this.gunMesh.add(body);

        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.08, 0.34), metalBarrelMat);
        slide.position.set(0, 0.05, -0.02);
        this.gunMesh.add(slide);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 12), accentMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, -0.22);
        this.gunMesh.add(barrel);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.08), darkBodyMat);
        grip.position.set(0, -0.10, 0.08);
        grip.rotation.x = 0.25;
        this.gunMesh.add(grip);

        muzzleZ = -0.34;
        break;
      }
    }

    // Battery / Ammo LED Indicator Gauge Bar
    this.batteryBarMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.015, 0.02),
      new THREE.MeshBasicMaterial({ color: beamHex })
    );
    this.batteryBarMesh.position.set(0, 0.105, 0.12);
    this.gunMesh.add(this.batteryBarMesh);

    // Muzzle Flash Effect Mesh
    const flashGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const flashMat = new THREE.MeshBasicMaterial({
      color: beamHex,
      transparent: true,
      opacity: 0,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.02, muzzleZ);
    this.gunMesh.add(this.muzzleFlashMesh);

    // Position gun in front-right of camera
    this.gunMesh.position.set(0.28, -0.22, -0.55);
    this.weaponGroup.add(this.gunMesh);
  }

  public triggerShootEffect() {
    this.recoilOffset = 0.08; // Kick back
    if (this.muzzleFlashMesh) {
      (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1;
    }
  }

  public update(dt: number, isMoving: boolean, isSprinting: boolean, ammoRatio: number, isZoomed: boolean = false, weaponType: WeaponType = 'pulse') {
    // 1. Recoil Recovery
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 0.8);
    }

    // 2. Weapon Bobbing Animation
    if (isMoving) {
      this.bobTime += dt * (isSprinting ? 14 : 9);
    } else {
      this.bobTime += dt * 2; // Idle breathing
    }

    if (isZoomed) {
      if (weaponType === 'sniper') {
        this.gunMesh.visible = false;
      } else {
        this.gunMesh.visible = true;
        const bobX = Math.sin(this.bobTime) * 0.002;
        const bobY = Math.abs(Math.cos(this.bobTime)) * 0.002;
        this.gunMesh.position.set(
          0.0 + bobX,
          -0.16 - bobY,
          -0.42 + this.recoilOffset
        );
      }
    } else {
      this.gunMesh.visible = true;
      const bobX = Math.sin(this.bobTime) * (isMoving ? 0.015 : 0.003);
      const bobY = Math.abs(Math.cos(this.bobTime)) * (isMoving ? 0.018 : 0.004);

      this.gunMesh.position.set(
        0.28 + bobX,
        -0.22 - bobY,
        -0.55 + this.recoilOffset
      );
    }

    // 3. Muzzle Flash Fade
    if (this.muzzleFlashMesh) {
      const mat = this.muzzleFlashMesh.material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) {
        mat.opacity = Math.max(0, mat.opacity - dt * 15);
      }
    }

    // 4. Battery Gauge Scale
    if (this.batteryBarMesh) {
      this.batteryBarMesh.scale.x = Math.max(0, ammoRatio);
    }
  }

  public getMuzzleWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.muzzleFlashMesh.getWorldPosition(pos);
    return pos;
  }
}

import * as THREE from 'three';
import { LaserShot } from '../types';

interface ActiveTracer {
  mesh: THREE.Mesh;
  light?: THREE.PointLight;
  createdAt: number;
  duration: number;
}

interface ParticleSystem {
  points: THREE.Points;
  velocities: THREE.Vector3[];
  createdAt: number;
  duration: number;
}

export class LaserTracerManager {
  private scene: THREE.Scene;
  private tracers: ActiveTracer[] = [];
  private particleSystems: ParticleSystem[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public addLaserShot(shot: LaserShot, maxDistance?: number) {
    const origin = new THREE.Vector3(shot.origin.x, shot.origin.y, shot.origin.z);
    const dir = new THREE.Vector3(shot.direction.x, shot.direction.y, shot.direction.z).normalize();
    const length = maxDistance ? Math.max(0.5, maxDistance) : 80; // Distance laser line stretches
    const end = origin.clone().add(dir.clone().multiplyScalar(length));

    // Laser Beam Glowing Cylinder
    const beamRadius = shot.weaponType === 'rail' ? 0.22 : shot.weaponType === 'sniper' ? 0.08 : 0.12;
    const geo = new THREE.CylinderGeometry(beamRadius, beamRadius, length, 8);
    geo.rotateX(Math.PI / 2); // Orient along Z

    const colorHex = parseInt(shot.color.replace('#', '0x')) || 0x00f3ff;
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.95,
    });

    const mesh = new THREE.Mesh(geo, mat);

    // Position cylinder midpoint between origin and end
    const midPoint = origin.clone().add(end).multiplyScalar(0.5);
    mesh.position.copy(midPoint);
    mesh.lookAt(end);

    // Laser Light flash
    const light = new THREE.PointLight(colorHex, 3, 12);
    light.position.copy(origin);

    this.scene.add(mesh);
    this.scene.add(light);

    this.tracers.push({
      mesh,
      light,
      createdAt: performance.now(),
      duration: 160, // ms duration for beam flash
    });

    // Muzzle Spark at origin
    this.spawnImpactParticles(origin, dir, shot.color, 8);
  }

  public spawnImpactParticles(position: THREE.Vector3, normal: THREE.Vector3, colorStr: string, count = 20) {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const velocities: THREE.Vector3[] = [];

    const colorHex = parseInt(colorStr.replace('#', '0x')) || 0x00f3ff;

    for (let i = 0; i < count; i++) {
      positions.push(position.x, position.y, position.z);
      const vel = normal.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2))
        .normalize()
        .multiplyScalar(3 + Math.random() * 8);
      velocities.push(vel);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.25,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.particleSystems.push({
      points,
      velocities,
      createdAt: performance.now(),
      duration: 350,
    });
  }

  public update() {
    const now = performance.now();

    // 1. Update & Clean Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      const elapsed = now - tracer.createdAt;
      const progress = elapsed / tracer.duration;

      if (progress >= 1) {
        this.scene.remove(tracer.mesh);
        if (tracer.light) this.scene.remove(tracer.light);
        tracer.mesh.geometry.dispose();
        (tracer.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      } else {
        (tracer.mesh.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - progress);
        if (tracer.light) tracer.light.intensity = 3 * (1 - progress);
      }
    }

    // 2. Update & Clean Particle Systems
    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      const ps = this.particleSystems[i];
      const elapsed = now - ps.createdAt;
      const progress = elapsed / ps.duration;

      if (progress >= 1) {
        this.scene.remove(ps.points);
        ps.points.geometry.dispose();
        (ps.points.material as THREE.Material).dispose();
        this.particleSystems.splice(i, 1);
      } else {
        const positions = ps.points.geometry.attributes.position.array as Float32Array;
        const dt = 0.016;

        for (let j = 0; j < ps.velocities.length; j++) {
          const idx = j * 3;
          positions[idx] += ps.velocities[j].x * dt;
          positions[idx + 1] += ps.velocities[j].y * dt;
          positions[idx + 2] += ps.velocities[j].z * dt;
        }
        ps.points.geometry.attributes.position.needsUpdate = true;
        (ps.points.material as THREE.PointsMaterial).opacity = 1 - progress;
      }
    }
  }

  public clearAll() {
    this.tracers.forEach((t) => {
      this.scene.remove(t.mesh);
      if (t.light) this.scene.remove(t.light);
      t.mesh.geometry.dispose();
      (t.mesh.material as THREE.Material).dispose();
    });
    this.particleSystems.forEach((ps) => {
      this.scene.remove(ps.points);
      ps.points.geometry.dispose();
      (ps.points.material as THREE.Material).dispose();
    });
    this.tracers = [];
    this.particleSystems = [];
  }
}

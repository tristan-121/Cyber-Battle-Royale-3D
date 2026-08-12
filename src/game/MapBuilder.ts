import * as THREE from 'three';
import { MapConfig, MapId, Powerup } from '../types';
import { MAP_CONFIGS } from './MapConfigs';

export interface ArenaMeshBundle {
  sceneGroup: THREE.Group;
  colliders: THREE.Box3[];
  solidMeshes: THREE.Mesh[];
  powerupMeshes: Map<string, THREE.Group>;
  spawnPoints: { red: THREE.Vector3[]; blue: THREE.Vector3[]; ffa: THREE.Vector3[] };
}

export class MapBuilder {
  public static buildMap(mapId: MapId): ArenaMeshBundle {
    const config = MAP_CONFIGS[mapId] || MAP_CONFIGS['neon_grid'];
    const sceneGroup = new THREE.Group();
    const colliders: THREE.Box3[] = [];
    const solidMeshes: THREE.Mesh[] = [];
    const powerupMeshes = new Map<string, THREE.Group>();

    const themeHex = parseInt(config.themeColor.replace('#', '0x'));
    const floorSize = config.size;

    // 1. FLOOR
    const floorGeo = new THREE.PlaneGeometry(floorSize.width, floorSize.length, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    sceneGroup.add(floor);
    solidMeshes.push(floor);

    // Floor Collider
    const floorBox = new THREE.Box3(
      new THREE.Vector3(-floorSize.width / 2, -1, -floorSize.length / 2),
      new THREE.Vector3(floorSize.width / 2, 0, floorSize.length / 2)
    );
    colliders.push(floorBox);

    // Grid Overlay Lines on Floor
    const gridHelper = new THREE.GridHelper(floorSize.width, floorSize.width / 2, themeHex, 0x1f293d);
    gridHelper.position.y = 0.02;
    sceneGroup.add(gridHelper);

    // 2. BOUNDARY WALLS WITH NEON RIMS
    const wallHeight = floorSize.height;
    const wallThick = 2;
    const halfW = floorSize.width / 2;
    const halfL = floorSize.length / 2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x161b22,
      roughness: 0.4,
      metalness: 0.6,
    });

    const neonRimMat = new THREE.MeshBasicMaterial({
      color: themeHex,
    });

    // Helper to add wall
    const addWall = (width: number, length: number, x: number, z: number, ry: number = 0) => {
      const geo = new THREE.BoxGeometry(width, wallHeight, length);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, wallHeight / 2, z);
      mesh.rotation.y = ry;
      sceneGroup.add(mesh);

      // Add top/bottom glowing neon rim
      const rimTopGeo = new THREE.BoxGeometry(width + 0.2, 0.4, length + 0.2);
      const rimTop = new THREE.Mesh(rimTopGeo, neonRimMat);
      rimTop.position.set(x, wallHeight - 0.2, z);
      rimTop.rotation.y = ry;
      sceneGroup.add(rimTop);

      const rimMidGeo = new THREE.BoxGeometry(width + 0.1, 0.2, length + 0.1);
      const rimMid = new THREE.Mesh(rimMidGeo, neonRimMat);
      rimMid.position.set(x, 2, z);
      rimMid.rotation.y = ry;
      sceneGroup.add(rimMid);

      const box = new THREE.Box3().setFromObject(mesh);
      colliders.push(box);
      solidMeshes.push(mesh);
    };

    // North, South, East, West boundary walls
    addWall(floorSize.width, wallThick, 0, -halfL - wallThick / 2);
    addWall(floorSize.width, wallThick, 0, halfL + wallThick / 2);
    addWall(wallThick, floorSize.length, -halfW - wallThick / 2, 0);
    addWall(wallThick, floorSize.length, halfW + wallThick / 2, 0);

    // 3. ARENA OBSTACLES & STRUCTURES (Pillars, Ramps, Catwalks, Barriers)
    const obstacleMat = new THREE.MeshStandardMaterial({
      color: 0x21262d,
      roughness: 0.3,
      metalness: 0.7,
    });

    const addPillar = (x: number, z: number, w = 4, h = 8, l = 4, color = themeHex) => {
      const geo = new THREE.BoxGeometry(w, h, l);
      const mesh = new THREE.Mesh(geo, obstacleMat);
      mesh.position.set(x, h / 2, z);
      sceneGroup.add(mesh);

      // Neon accent stripes
      const accentGeo = new THREE.BoxGeometry(w + 0.1, 0.3, l + 0.1);
      const accentMat = new THREE.MeshBasicMaterial({ color });
      const accent = new THREE.Mesh(accentGeo, accentMat);
      accent.position.set(x, h - 0.5, z);
      sceneGroup.add(accent);

      const box = new THREE.Box3().setFromObject(mesh);
      colliders.push(box);
      solidMeshes.push(mesh);
    };

    const addCatwalk = (x: number, y: number, z: number, w: number, l: number) => {
      const geo = new THREE.BoxGeometry(w, 0.5, l);
      const mesh = new THREE.Mesh(geo, obstacleMat);
      mesh.position.set(x, y, z);
      sceneGroup.add(mesh);

      // Support pillars
      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, y);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x30363d });
      const p1 = new THREE.Mesh(pillarGeo, pMat);
      p1.position.set(x - w / 2 + 0.5, y / 2, z - l / 2 + 0.5);
      sceneGroup.add(p1);

      const p2 = new THREE.Mesh(pillarGeo, pMat);
      p2.position.set(x + w / 2 - 0.5, y / 2, z + l / 2 - 0.5);
      sceneGroup.add(p2);

      // Neon rail lines
      const railMat = new THREE.MeshBasicMaterial({ color: themeHex });
      const railGeo = new THREE.BoxGeometry(w, 0.1, 0.1);
      const r1 = new THREE.Mesh(railGeo, railMat);
      r1.position.set(x, y + 0.3, z - l / 2);
      sceneGroup.add(r1);

      const r2 = new THREE.Mesh(railGeo, railMat);
      r2.position.set(x, y + 0.3, z + l / 2);
      sceneGroup.add(r2);

      const box = new THREE.Box3().setFromObject(mesh);
      colliders.push(box);
      solidMeshes.push(mesh);
    };

    const addRamp = (x: number, z: number, w: number, l: number, h: number, ry: number) => {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(x, 0, z);
      rampGroup.rotation.y = ry;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(l, h);
      shape.lineTo(l, 0);
      shape.closePath();

      const extrudeSettings = { depth: w, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();

      const mesh = new THREE.Mesh(geo, obstacleMat);
      mesh.position.y = h / 2;
      rampGroup.add(mesh);

      // Glowing Neon Edge Rails along Ramps
      const rimMat = new THREE.MeshBasicMaterial({ color: themeHex });
      const rampSlopeLen = Math.hypot(l, h);
      const rimGeo = new THREE.BoxGeometry(rampSlopeLen, 0.15, 0.15);

      const r1 = new THREE.Mesh(rimGeo, rimMat);
      r1.rotation.z = Math.atan2(h, l);
      r1.position.set(0, h / 2 + 0.1, -w / 2 + 0.1);
      rampGroup.add(r1);

      const r2 = new THREE.Mesh(rimGeo, rimMat);
      r2.rotation.z = Math.atan2(h, l);
      r2.position.set(0, h / 2 + 0.1, w / 2 - 0.1);
      rampGroup.add(r2);

      sceneGroup.add(rampGroup);

      solidMeshes.push(mesh);
    };

    // Construct specific map layouts
    if (mapId === 'neon_grid') {
      // Center Platform (height = 5, size = 16x16)
      addPillar(0, 0, 16, 5, 16, 0x00f3ff);

      // Catwalks connecting center
      addCatwalk(-15, 5, 0, 14, 4);
      addCatwalk(15, 5, 0, 14, 4);
      addCatwalk(0, 5, -15, 4, 14);
      addCatwalk(0, 5, 15, 4, 14);

      // Corner cover pillars/platforms
      addPillar(-20, -20, 6, 7, 6, 0xff2a00); // Red team side
      addPillar(-25, -10, 4, 5, 4, 0xff2a00);

      addPillar(20, 20, 6, 7, 6, 0x00a8ff); // Blue team side
      addPillar(25, 10, 4, 5, 4, 0x00a8ff);

      addPillar(-20, 20, 6, 7, 6, 0x00ff66);
      addPillar(20, -20, 6, 7, 6, 0x00ff66);

      // Mid barriers
      addPillar(-10, 15, 8, 4, 2, 0x00f3ff);
      addPillar(10, -15, 8, 4, 2, 0x00f3ff);

      // --- RAMPS ---
      // 1. Central Platform Access Ramps (4 directions)
      addRamp(-13, 0, 6, 10, 5, 0); // West ramp
      addRamp(13, 0, 6, 10, 5, Math.PI); // East ramp
      addRamp(0, -13, 6, 10, 5, -Math.PI / 2); // North ramp
      addRamp(0, 13, 6, 10, 5, Math.PI / 2); // South ramp

      // 2. Outer Catwalk Access Ramps
      addRamp(-24, 0, 4, 8, 5, 0);
      addRamp(24, 0, 4, 8, 5, Math.PI);
      addRamp(0, -24, 4, 8, 5, -Math.PI / 2);
      addRamp(0, 24, 4, 8, 5, Math.PI / 2);

      // 3. Corner Tower Ramps
      addRamp(-20, -14, 4, 6, 7, Math.PI / 2);
      addRamp(20, 14, 4, 6, 7, -Math.PI / 2);
      addRamp(-20, 14, 4, 6, 7, -Math.PI / 2);
      addRamp(20, -14, 4, 6, 7, Math.PI / 2);
    } else if (mapId === 'cyber_station') {
      // Station Central Ice Reactor
      addPillar(0, 0, 12, 7, 12, 0x00a8ff);

      // Ice Translucent Barriers
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x00a8ff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.9,
      });

      const addGlassBarrier = (x: number, z: number, w: number, l: number) => {
        const geo = new THREE.BoxGeometry(w, 4, l);
        const mesh = new THREE.Mesh(geo, glassMat);
        mesh.position.set(x, 2, z);
        sceneGroup.add(mesh);
        colliders.push(new THREE.Box3().setFromObject(mesh));
        solidMeshes.push(mesh);
      };

      addGlassBarrier(-15, -10, 8, 1);
      addGlassBarrier(15, 10, 8, 1);
      addGlassBarrier(-15, 10, 8, 1);
      addGlassBarrier(15, -10, 8, 1);

      // High Sniper Towers
      addPillar(-28, 0, 8, 8, 8, 0xff2a00);
      addPillar(28, 0, 8, 8, 8, 0x00a8ff);

      addCatwalk(-15, 4, -20, 12, 4);
      addCatwalk(15, 4, 20, 12, 4);

      // --- RAMPS ---
      // Central Core Ramps
      addRamp(-11, 0, 6, 10, 7, 0);
      addRamp(11, 0, 6, 10, 7, Math.PI);
      addRamp(0, -11, 6, 10, 7, -Math.PI / 2);
      addRamp(0, 11, 6, 10, 7, Math.PI / 2);

      // Sniper Tower Ramps
      addRamp(-20, 0, 5, 12, 8, 0);
      addRamp(20, 0, 5, 12, 8, Math.PI);

      // Catwalk Ramps
      addRamp(-15, -12, 4, 8, 4, -Math.PI / 2);
      addRamp(15, 12, 4, 8, 4, Math.PI / 2);
    } else {
      // Inferno Vault
      addPillar(0, 0, 18, 8, 18, 0xff5500);

      // Obsidian Towers
      addPillar(-18, -18, 7, 10, 7, 0xff2a00);
      addPillar(18, 18, 7, 10, 7, 0xffaa00);
      addPillar(-18, 18, 7, 10, 7, 0xff2a00);
      addPillar(18, -18, 7, 10, 7, 0xffaa00);

      addCatwalk(-20, 6, 0, 6, 16);
      addCatwalk(20, 6, 0, 6, 16);

      // --- RAMPS ---
      // Central Lava Reactor Ramps
      addRamp(-15, 0, 8, 12, 8, 0);
      addRamp(15, 0, 8, 12, 8, Math.PI);
      addRamp(0, -15, 8, 12, 8, -Math.PI / 2);
      addRamp(0, 15, 8, 12, 8, Math.PI / 2);

      // Obsidian Tower Access Ramps
      addRamp(-18, -10, 5, 12, 10, -Math.PI / 2);
      addRamp(18, 10, 5, 12, 10, Math.PI / 2);
      addRamp(-18, 10, 5, 12, 10, Math.PI / 2);
      addRamp(18, -10, 5, 12, 10, -Math.PI / 2);

      // Catwalk Ramps
      addRamp(-20, -10, 4, 10, 6, -Math.PI / 2);
      addRamp(20, 10, 4, 10, 6, Math.PI / 2);
    }

    // 4. POWER-UP BASES & ANIMATED MESHS
    config.powerupSpawns.forEach((p) => {
      const pGroup = MapBuilder.createPowerupMesh({
        ...p,
        active: true,
        respawnTime: 20,
      });
      sceneGroup.add(pGroup);
      powerupMeshes.set(p.id, pGroup);
    });

    // 5. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneGroup.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    sceneGroup.add(dirLight);

    const redBaseLight = new THREE.PointLight(0xff2a00, 2, 25);
    redBaseLight.position.set(-30, 6, -30);
    sceneGroup.add(redBaseLight);

    const blueBaseLight = new THREE.PointLight(0x00a8ff, 2, 25);
    blueBaseLight.position.set(30, 6, 30);
    sceneGroup.add(blueBaseLight);

    // Convert vector configs
    const toVec = (vList: { x: number; y: number; z: number }[]) =>
      vList.map((v) => new THREE.Vector3(v.x, v.y, v.z));

    sceneGroup.updateMatrixWorld(true);

    return {
      sceneGroup,
      colliders,
      solidMeshes,
      powerupMeshes,
      spawnPoints: {
        red: toVec(config.spawnPointsRed),
        blue: toVec(config.spawnPointsBlue),
        ffa: toVec(config.spawnPointsFFA),
      },
    };
  }

  public static createPowerupMesh(p: Powerup): THREE.Group {
    const pGroup = new THREE.Group();
    pGroup.position.set(p.position.x, p.position.y, p.position.z);
    pGroup.userData = { powerupType: p.type };

    // Base Pad
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.3, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f293d,
      metalness: 0.8,
      roughness: 0.2,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.15;
    pGroup.add(base);

    // Floating Gem / Crystal Cluster
    let pColor = 0x00f3ff;
    if (p.type === 'red_crystal' || p.type === 'quad_damage') pColor = 0xff0044; // Vibrant Red Crystal
    if (p.type === 'blue_crystal' || p.type === 'shield' || p.type === 'health') pColor = 0x0088ff; // Sapphire Blue Crystal
    if (p.type === 'green_crystal' || p.type === 'speed') pColor = 0x00ff66; // Emerald Green Crystal
    if (p.type === 'overcharge') pColor = 0xffaa00;

    const crystalGroup = new THREE.Group();
    crystalGroup.name = 'floatingGem';

    const crystalMat = new THREE.MeshStandardMaterial({
      color: pColor,
      emissive: pColor,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.8,
    });

    // Main Central Crystal Shard
    const mainShardGeo = new THREE.OctahedronGeometry(0.65, 0);
    mainShardGeo.scale(0.8, 1.4, 0.8);
    const mainShard = new THREE.Mesh(mainShardGeo, crystalMat);
    crystalGroup.add(mainShard);

    // Surrounding Small Crystal Clusters
    const subShardGeo = new THREE.ConeGeometry(0.2, 0.6, 5);
    for (let i = 0; i < 3; i++) {
      const sub = new THREE.Mesh(subShardGeo, crystalMat);
      const angle = (i * Math.PI * 2) / 3;
      sub.position.set(Math.cos(angle) * 0.45, -0.1, Math.sin(angle) * 0.45);
      sub.rotation.x = 0.3;
      sub.rotation.y = angle;
      crystalGroup.add(sub);
    }

    pGroup.add(crystalGroup);

    // Glow Light
    const light = new THREE.PointLight(pColor, 2.0, 7);
    light.position.y = 0.5;
    pGroup.add(light);

    return pGroup;
  }
}

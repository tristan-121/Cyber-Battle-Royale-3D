import { MapConfig, MapId } from '../types';

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  neon_grid: {
    id: 'neon_grid',
    name: 'Neon Cyber Grid',
    description: 'High-tech subterranean laser arena featuring glowing grid lines, ramps, and dual-layer catwalks.',
    size: { width: 80, length: 80, height: 16 },
    themeColor: '#00f3ff',
    spawnPointsRed: [
      { x: -30, y: 1.5, z: -30 },
      { x: -25, y: 1.5, z: -32 },
      { x: -32, y: 1.5, z: -25 },
      { x: -28, y: 6.5, z: -28 }, // Catwalk spawn
    ],
    spawnPointsBlue: [
      { x: 30, y: 1.5, z: 30 },
      { x: 25, y: 1.5, z: 32 },
      { x: 32, y: 1.5, z: 25 },
      { x: 28, y: 6.5, z: 28 }, // Catwalk spawn
    ],
    spawnPointsFFA: [
      { x: -30, y: 1.5, z: -30 },
      { x: 30, y: 1.5, z: 30 },
      { x: -30, y: 1.5, z: 30 },
      { x: 30, y: 1.5, z: -30 },
      { x: 0, y: 6.5, z: 0 },
      { x: -15, y: 1.5, z: 0 },
      { x: 15, y: 1.5, z: 0 },
      { x: 0, y: 1.5, z: -15 },
      { x: 0, y: 1.5, z: 15 },
    ],
    powerupSpawns: [
      { id: 'p1', type: 'red_crystal', position: { x: 0, y: 7.2, z: 0 } }, // Center high platform (10% Damage Buff)
      { id: 'p2', type: 'blue_crystal', position: { x: -20, y: 1.5, z: 0 } }, // West (25% Heal)
      { id: 'p3', type: 'green_crystal', position: { x: 20, y: 1.5, z: 0 } }, // East (+25 Shield & +25% Speed)
      { id: 'p4', type: 'red_crystal', position: { x: 0, y: 1.5, z: -20 } },
      { id: 'p5', type: 'blue_crystal', position: { x: 0, y: 1.5, z: 20 } },
    ],
  },
  cyber_station: {
    id: 'cyber_station',
    name: 'Subzero Station',
    description: 'Orbital ice refinery with translucent ice barriers, multi-level central core, and high-velocity choke points.',
    size: { width: 90, length: 70, height: 18 },
    themeColor: '#00a8ff',
    spawnPointsRed: [
      { x: -35, y: 1.5, z: 0 },
      { x: -32, y: 1.5, z: -10 },
      { x: -32, y: 1.5, z: 10 },
      { x: -30, y: 7.5, z: 0 },
    ],
    spawnPointsBlue: [
      { x: 35, y: 1.5, z: 0 },
      { x: 32, y: 1.5, z: -10 },
      { x: 32, y: 1.5, z: 10 },
      { x: 30, y: 7.5, z: 0 },
    ],
    spawnPointsFFA: [
      { x: -35, y: 1.5, z: 0 },
      { x: 35, y: 1.5, z: 0 },
      { x: 0, y: 1.5, z: -25 },
      { x: 0, y: 1.5, z: 25 },
      { x: 0, y: 8.5, z: 0 },
      { x: -18, y: 1.5, z: -18 },
      { x: 18, y: 1.5, z: 18 },
      { x: -18, y: 1.5, z: 18 },
      { x: 18, y: 1.5, z: -18 },
    ],
    powerupSpawns: [
      { id: 'p1', type: 'green_crystal', position: { x: 0, y: 9.0, z: 0 } },
      { id: 'p2', type: 'red_crystal', position: { x: 0, y: 1.5, z: -25 } },
      { id: 'p3', type: 'blue_crystal', position: { x: -22, y: 1.5, z: 0 } },
      { id: 'p4', type: 'green_crystal', position: { x: 22, y: 1.5, z: 0 } },
    ],
  },
  inferno_vault: {
    id: 'inferno_vault',
    name: 'Inferno Vault',
    description: 'Industrial lava reactor vault with obsidian pillars, high-heat hazards, and tactical sniper towers.',
    size: { width: 85, length: 85, height: 20 },
    themeColor: '#ff5500',
    spawnPointsRed: [
      { x: -30, y: 1.5, z: -30 },
      { x: -25, y: 1.5, z: -30 },
      { x: -30, y: 1.5, z: -25 },
      { x: -28, y: 8.0, z: -28 },
    ],
    spawnPointsBlue: [
      { x: 30, y: 1.5, z: 30 },
      { x: 25, y: 1.5, z: 30 },
      { x: 30, y: 1.5, z: 25 },
      { x: 28, y: 8.0, z: 28 },
    ],
    spawnPointsFFA: [
      { x: -30, y: 1.5, z: -30 },
      { x: 30, y: 1.5, z: 30 },
      { x: -30, y: 1.5, z: 30 },
      { x: 30, y: 1.5, z: -30 },
      { x: 0, y: 9.5, z: 0 },
      { x: 0, y: 1.5, z: -25 },
      { x: 0, y: 1.5, z: 25 },
      { x: -25, y: 1.5, z: 0 },
      { x: 25, y: 1.5, z: 0 },
    ],
    powerupSpawns: [
      { id: 'p1', type: 'red_crystal', position: { x: 0, y: 10.0, z: 0 } },
      { id: 'p2', type: 'green_crystal', position: { x: -20, y: 1.5, z: 20 } },
      { id: 'p3', type: 'blue_crystal', position: { x: 20, y: 1.5, z: -20 } },
      { id: 'p4', type: 'green_crystal', position: { x: 0, y: 1.5, z: 0 } },
    ],
  },
};

import { WeaponConfig, WeaponType } from '../types';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pulse: {
    type: 'pulse',
    name: 'Pulse Rifle',
    description: 'Standard multi-burst laser rifle with high capacity and controlled firing speed.',
    damage: 22,
    headshotMultiplier: 1.5,
    fireRate: 260, // ms (slower)
    batteryCapacity: 30,
    reloadTime: 1200, // ms
    beamWidth: 0.12,
    rayDistance: 120,
    beamColor: '#00f3ff', // Cyan Neon
    soundType: 'pulse',
    spread: 0.012,
  },
  rail: {
    type: 'rail',
    name: 'Heavy Railgun',
    description: 'High-energy beam accelerator. Devastating damage with piercing neon beam.',
    damage: 68,
    headshotMultiplier: 1.8,
    fireRate: 1200, // ms (slower)
    batteryCapacity: 8,
    reloadTime: 2000,
    beamWidth: 0.28,
    rayDistance: 200,
    beamColor: '#ff2a00', // Crimson Neon
    soundType: 'rail',
    spread: 0.002,
  },
  scatter: {
    type: 'scatter',
    name: 'Tri-Scatter Laser',
    description: 'Fires 3 spreading laser beams simultaneously for close-quarters combat.',
    damage: 16, // per beam (x3)
    headshotMultiplier: 1.4,
    fireRate: 700, // ms (slower)
    batteryCapacity: 12,
    reloadTime: 1500,
    beamWidth: 0.15,
    rayDistance: 50,
    beamColor: '#00ff66', // Lime Green
    soundType: 'scatter',
    spread: 0.05,
  },
  sniper: {
    type: 'sniper',
    name: 'Precise Beam Sniper',
    description: 'Long-range high-intensity laser weapon with precision output.',
    damage: 85,
    headshotMultiplier: 2.2,
    fireRate: 1600, // ms (slower)
    batteryCapacity: 5,
    reloadTime: 2400,
    beamWidth: 0.08,
    rayDistance: 300,
    beamColor: '#a800ff', // Electric Violet
    soundType: 'sniper',
    spread: 0.0005,
  },
  cannon: {
    type: 'cannon',
    name: 'Auto Laser Cannon',
    description: 'Plasma repeater that melts shields with controlled bursts.',
    damage: 14,
    headshotMultiplier: 1.3,
    fireRate: 160, // ms (slower)
    batteryCapacity: 50,
    reloadTime: 2200,
    beamWidth: 0.18,
    rayDistance: 90,
    beamColor: '#ffbb00', // Neon Amber
    soundType: 'cannon',
    spread: 0.035,
  },
  smg: {
    type: 'smg',
    name: 'Viper Cyber-SMG',
    description: 'Ultra high-RPM submachine gun. Hold Left-Click for continuous rapid fire (10 HP/shot, 100 capacity).',
    damage: 10,
    headshotMultiplier: 1.35,
    fireRate: 80, // 80ms per shot = 12.5 shots/sec continuous rapid stream
    batteryCapacity: 100,
    reloadTime: 1800,
    beamWidth: 0.10,
    rayDistance: 85,
    beamColor: '#ff0077', // Neon Magenta / Electric Pink
    soundType: 'smg',
    spread: 0.024,
  },
  handgun: {
    type: 'handgun',
    name: 'Tactical Cyber-Handgun',
    description: 'Compact emergency sidearm (10 DMG, 20 capacity, 2.0s reload). Access via Shift + 2.',
    damage: 10,
    headshotMultiplier: 1.5,
    fireRate: 200, // 200ms per shot
    batteryCapacity: 20,
    reloadTime: 2000, // 2 seconds reload
    beamWidth: 0.08,
    rayDistance: 70,
    beamColor: '#38bdf8', // Bright Cyan
    soundType: 'pulse',
    spread: 0.012,
  },
};

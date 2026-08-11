export type Team = 'red' | 'blue' | 'green' | 'ffa';

export type WeaponType = 'pulse' | 'rail' | 'scatter' | 'sniper' | 'cannon' | 'smg' | 'handgun';

export type MapId = 'neon_grid' | 'cyber_station' | 'inferno_vault';

export type GameMode = 'br_solos' | 'br_squads' | 'ffa' | 'team_5v5';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  name: string;
  team: Team;
  color: string; // Hex color string
  position: Vector3D;
  rotation: {
    y: number; // yaw
    pitch: number; // camera pitch
  };
  health: number; // 0 - 100
  shield: number; // 0 - 50
  isDead: boolean;
  isEliminated: boolean;
  kills: number;
  deaths: number;
  placement?: number;
  score: number;
  ping: number;
  isBot: boolean;
  weaponType: WeaponType;
  activePowerup?: PowerupType;
  powerupTimer?: number;
  armorSkin: string;
  armHits?: number;
  legHits?: number;
  disabledWeapons?: boolean;
  speedMultiplier?: number;
}

export type PowerupType = 'health' | 'shield' | 'quad_damage' | 'speed' | 'overcharge' | 'red_crystal' | 'blue_crystal' | 'green_crystal';

export interface Powerup {
  id: string;
  type: PowerupType;
  position: Vector3D;
  active: boolean;
  respawnTime: number;
}

export interface LaserShot {
  id: string;
  shooterId: string;
  shooterName: string;
  team: Team;
  weaponType: WeaponType;
  origin: Vector3D;
  direction: Vector3D;
  color: string;
  timestamp: number;
}

export interface HitEvent {
  shooterId: string;
  victimId: string;
  damage: number;
  isHeadshot: boolean;
  weaponType: WeaponType;
  hitPosition: Vector3D;
  hitLocation?: 'head' | 'torso' | 'arm' | 'leg';
}

export interface KillfeedEntry {
  id: string;
  shooterName: string;
  shooterTeam: Team;
  victimName: string;
  victimTeam: Team;
  weaponType: WeaponType;
  isHeadshot: boolean;
  timestamp: number;
  isStormKill?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  team: Team;
  text: string;
  timestamp: number;
}

export interface StormZone {
  center: Vector3D;
  radius: number;
  targetRadius: number;
  phase: number;
  isShrinking: boolean;
  isDisabled?: boolean;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  mapId: MapId;
  gameMode: GameMode;
  status: 'waiting' | 'in_progress' | 'game_over';
  matchTimer: number; // remaining seconds
  aliveCount: number;
  totalPlayers: number;
  storm: StormZone;
  players: Player[];
  powerups: Powerup[];
  killfeed: KillfeedEntry[];
  winnerPlayerId?: string;
  winnerName?: string;
}

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  description: string;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // ms between shots
  batteryCapacity: number; // ammo before reload
  reloadTime: number; // ms
  beamWidth: number;
  rayDistance: number;
  beamColor: string;
  soundType: 'pulse' | 'rail' | 'scatter' | 'sniper' | 'cannon' | 'smg';
  spread: number;
}

export interface MapConfig {
  id: MapId;
  name: string;
  description: string;
  size: { width: number; length: number; height: number };
  themeColor: string;
  spawnPointsRed: Vector3D[];
  spawnPointsBlue: Vector3D[];
  spawnPointsFFA: Vector3D[];
  powerupSpawns: { id: string; type: PowerupType; position: Vector3D }[];
}

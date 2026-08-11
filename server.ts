import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

// Types duplicated for server-side independence
type Team = 'red' | 'blue' | 'green' | 'ffa';
type WeaponType = 'pulse' | 'rail' | 'scatter' | 'sniper' | 'cannon' | 'smg' | 'handgun';
type MapId = 'neon_grid' | 'cyber_station' | 'inferno_vault';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ServerPowerup {
  id: string;
  type: 'red_crystal' | 'blue_crystal' | 'green_crystal';
  position: Vector3D;
  isAvailable: boolean;
  respawnAt: number;
  isSingleUse?: boolean;
}

interface Player {
  id: string;
  name: string;
  team: Team;
  color: string;
  position: Vector3D;
  rotation: { y: number; pitch: number };
  health: number;
  shield: number;
  isDead: boolean;
  isEliminated: boolean;
  kills: number;
  deaths: number;
  placement?: number;
  score: number;
  ping: number;
  isBot: boolean;
  weaponType: WeaponType;
  armorSkin: string;
  isGodMode?: boolean;
  armHits?: number;
  legHits?: number;
  disabledWeapons?: boolean;
  speedMultiplier?: number;
}

interface KillfeedEntry {
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

interface StormZone {
  center: Vector3D;
  radius: number;
  targetRadius: number;
  phase: number;
  isShrinking: boolean;
  isDisabled?: boolean;
}

interface Room {
  id: string;
  name: string;
  mapId: MapId;
  gameMode: 'br_solos' | 'br_squads' | 'ffa' | 'team_5v5';
  status: 'waiting' | 'in_progress' | 'game_over';
  matchTimer: number; // seconds
  aliveCount: number;
  totalPlayers: number;
  storm: StormZone;
  players: Map<string, Player>;
  sockets: Map<string, WebSocket>;
  killfeed: KillfeedEntry[];
  powerups: Map<string, ServerPowerup>;
  winnerPlayerId?: string;
  winnerName?: string;
}

const MAP_POWERUP_SPAWNS: Record<string, Array<{ id: string; type: 'red_crystal' | 'blue_crystal' | 'green_crystal'; position: Vector3D }>> = {
  neon_grid: [
    { id: 'p1', type: 'red_crystal', position: { x: 0, y: 7.2, z: 0 } },
    { id: 'p2', type: 'blue_crystal', position: { x: -20, y: 1.5, z: 0 } },
    { id: 'p3', type: 'green_crystal', position: { x: 20, y: 1.5, z: 0 } },
    { id: 'p4', type: 'red_crystal', position: { x: 0, y: 1.5, z: -20 } },
    { id: 'p5', type: 'blue_crystal', position: { x: 0, y: 1.5, z: 20 } },
  ],
  cyber_station: [
    { id: 'p1', type: 'green_crystal', position: { x: 0, y: 9.0, z: 0 } },
    { id: 'p2', type: 'red_crystal', position: { x: 0, y: 1.5, z: -25 } },
    { id: 'p3', type: 'blue_crystal', position: { x: -22, y: 1.5, z: 0 } },
    { id: 'p4', type: 'green_crystal', position: { x: 22, y: 1.5, z: 0 } },
  ],
  inferno_vault: [
    { id: 'p1', type: 'red_crystal', position: { x: 0, y: 9.5, z: 0 } },
    { id: 'p2', type: 'blue_crystal', position: { x: -20, y: 1.5, z: 20 } },
    { id: 'p3', type: 'green_crystal', position: { x: 20, y: 1.5, z: -20 } },
    { id: 'p4', type: 'blue_crystal', position: { x: -20, y: 1.5, z: -20 } },
  ],
};

const MAP_WAYPOINTS: Record<string, Array<{ x: number; z: number }>> = {
  neon_grid: [
    { x: 0, z: 0 },
    { x: -20, z: -20 },
    { x: 20, z: 20 },
    { x: -20, z: 20 },
    { x: 20, z: -20 },
    { x: -15, z: 0 },
    { x: 15, z: 0 },
    { x: 0, z: -15 },
    { x: 0, z: 15 },
  ],
  cyber_station: [
    { x: 0, z: 0 },
    { x: -28, z: 0 },
    { x: 28, z: 0 },
    { x: 0, z: -25 },
    { x: 0, z: 25 },
    { x: -18, z: -18 },
    { x: 18, z: 18 },
  ],
  inferno_vault: [
    { x: 0, z: 0 },
    { x: -18, z: -18 },
    { x: 18, z: 18 },
    { x: -18, z: 18 },
    { x: 18, z: -18 },
    { x: -20, z: 0 },
    { x: 20, z: 0 },
  ],
};

interface BotAIState {
  patrolWaypointIndex: number;
  lastShotTime: number;
  stuckCounter: number;
  lastX: number;
  lastZ: number;
}

const botAIStates = new Map<string, BotAIState>();

const BOT_NAMES = [
  'VALKYRIE_X', 'PHANTOM_9', 'NOVA_PRIME', 'ZERO_DAY',
  'CYPHER_VR', 'STORM_RAIL', 'VECTOR_8', 'TITAN_SHIELD',
  'VOID_RUNNER', 'APEX_BEAM', 'HYPER_SHADOW', 'PULSE_VIPER'
];

interface AABB2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const MAP_OBSTACLES: Record<string, AABB2D[]> = {
  neon_grid: [
    { minX: -6, maxX: 6, minZ: -6, maxZ: 6 }, // Central Core Pillar
    { minX: -32, maxX: -24, minZ: -4, maxZ: 4 }, // Sniper Tower West
    { minX: 24, maxX: 32, minZ: -4, maxZ: 4 }, // Sniper Tower East
    { minX: -19, maxX: -11, minZ: -10.5, maxZ: -9.5 }, // Glass barrier 1
    { minX: 11, maxX: 19, minZ: 9.5, maxZ: 10.5 }, // Glass barrier 2
    { minX: -19, maxX: -11, minZ: 9.5, maxZ: 10.5 }, // Glass barrier 3
    { minX: 11, maxX: 19, minZ: -10.5, maxZ: -9.5 }, // Glass barrier 4
  ],
  cyber_station: [
    { minX: -8, maxX: 8, minZ: -8, maxZ: 8 }, // Core Subzero Tower
    { minX: -32, maxX: -24, minZ: -4, maxZ: 4 }, // West Pillar
    { minX: 24, maxX: 32, minZ: -4, maxZ: 4 }, // East Pillar
    { minX: -19, maxX: -11, minZ: -10.5, maxZ: -9.5 }, // Ice barrier 1
    { minX: 11, maxX: 19, minZ: 9.5, maxZ: 10.5 }, // Ice barrier 2
  ],
  inferno_vault: [
    { minX: -9, maxX: 9, minZ: -9, maxZ: 9 }, // Inferno Central Reactor
    { minX: -23, maxX: -13, minZ: -23, maxZ: -13 }, // Obsidian Pillar 1
    { minX: 13, maxX: 23, minZ: 13, maxZ: 23 }, // Obsidian Pillar 2
    { minX: -23, maxX: -13, minZ: 13, maxZ: 23 }, // Obsidian Pillar 3
    { minX: 13, maxX: 23, minZ: -23, maxZ: -13 }, // Obsidian Pillar 4
  ],
};

function lineIntersectsAABB(x1: number, z1: number, x2: number, z2: number, box: AABB2D): boolean {
  if ((x1 < box.minX && x2 < box.minX) || (x1 > box.maxX && x2 > box.maxX)) return false;
  if ((z1 < box.minZ && z2 < box.minZ) || (z1 > box.maxZ && z2 > box.maxZ)) return false;

  const dx = x2 - x1;
  const dz = z2 - z1;

  let tMin = 0;
  let tMax = 1;

  if (Math.abs(dx) > 1e-6) {
    const tx1 = (box.minX - x1) / dx;
    const tx2 = (box.maxX - x1) / dx;
    tMin = Math.max(tMin, Math.min(tx1, tx2));
    tMax = Math.min(tMax, Math.max(tx1, tx2));
  } else if (x1 < box.minX || x1 > box.maxX) {
    return false;
  }

  if (Math.abs(dz) > 1e-6) {
    const tz1 = (box.minZ - z1) / dz;
    const tz2 = (box.maxZ - z1) / dz;
    tMin = Math.max(tMin, Math.min(tz1, tz2));
    tMax = Math.min(tMax, Math.max(tz1, tz2));
  } else if (z1 < box.minZ || z1 > box.maxZ) {
    return false;
  }

  return tMin <= tMax;
}

function hasLineOfSight(x1: number, z1: number, x2: number, z2: number, mapId: string): boolean {
  const obstacles = MAP_OBSTACLES[mapId] || MAP_OBSTACLES.neon_grid;
  for (const obs of obstacles) {
    if (lineIntersectsAABB(x1, z1, x2, z2, obs)) {
      return false;
    }
  }
  return true;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Room Manager
  const rooms = new Map<string, Room>();

  function initRoomPowerups(room: Room) {
    room.powerups.clear();
    const spawns = MAP_POWERUP_SPAWNS[room.mapId] || MAP_POWERUP_SPAWNS.neon_grid;
    spawns.forEach((sp) => {
      room.powerups.set(sp.id, {
        id: sp.id,
        type: sp.type,
        position: sp.position,
        isAvailable: true,
        respawnAt: 0,
      });
    });
  }

  function createRoom(id: string, name: string, mapId: MapId = 'neon_grid'): Room {
    const room: Room = {
      id,
      name,
      mapId,
      gameMode: 'br_solos',
      status: 'in_progress',
      matchTimer: 240, // 4 min battle royale match
      aliveCount: 12,
      totalPlayers: 12,
      storm: {
        center: { x: 0, y: 0, z: 0 },
        radius: 38,
        targetRadius: 38,
        phase: 1,
        isShrinking: false,
      },
      players: new Map<string, Player>(),
      sockets: new Map<string, WebSocket>(),
      killfeed: [],
      powerups: new Map<string, ServerPowerup>(),
    };

    initRoomPowerups(room);

    // Populate initial Battle Royale bots
    populateBots(room);

    rooms.set(id, room);
    return room;
  }

  // Default Arena Room
  const defaultRoom = createRoom('arena_alpha', 'Battle Royale Sector 4B', 'neon_grid');

  function resetMatchRound(room: Room) {
    room.matchTimer = 240;
    room.status = 'in_progress';
    room.winnerPlayerId = undefined;
    room.winnerName = undefined;
    room.storm = {
      center: { x: (Math.random() - 0.5) * 8, y: 0, z: (Math.random() - 0.5) * 8 },
      radius: 38,
      targetRadius: 38,
      phase: 1,
      isShrinking: false,
    };

    // Rotate map
    const maps: MapId[] = ['neon_grid', 'cyber_station', 'inferno_vault'];
    room.mapId = maps[(maps.indexOf(room.mapId) + 1) % maps.length];

    initRoomPowerups(room);

    // Reset all players
    const numPlayers = room.players.size;
    let i = 0;
    room.players.forEach((p) => {
      p.health = 100;
      p.shield = 50;
      p.isDead = false;
      p.isEliminated = false;
      p.placement = undefined;
      p.armHits = 0;
      p.legHits = 0;
      p.disabledWeapons = false;
      p.speedMultiplier = 1.0;

      // Drop perimeter placement around arena
      const angle = (i / Math.max(1, numPlayers)) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 28 + Math.random() * 4;
      p.position = {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      };
      p.rotation.y = Math.atan2(-p.position.x, -p.position.z);
      i++;
    });

    broadcastToRoom(room, {
      type: 'MATCH_ROUND_RESTART',
      mapId: room.mapId,
      storm: room.storm,
    });
  }

  function populateBots(room: Room) {
    const weapons: WeaponType[] = ['pulse', 'rail', 'scatter', 'sniper', 'cannon', 'smg'];

    if (room.gameMode === 'team_5v5') {
      let redCount = 0;
      let blueCount = 0;
      room.players.forEach((p) => {
        if (p.team === 'red') redCount++;
        if (p.team === 'blue') blueCount++;
      });

      let bIdx = 0;
      // Fill Red Team up to 5
      while (redCount < 5 && bIdx < BOT_NAMES.length) {
        const botId = `bot_red_${bIdx}_${room.id}`;
        if (!room.players.has(botId)) {
          const spawnX = -22 + (Math.random() - 0.5) * 8;
          const spawnZ = (Math.random() - 0.5) * 12;
          const botPlayer: Player = {
            id: botId,
            name: `[BOT] ${BOT_NAMES[bIdx]}`,
            team: 'red',
            color: '#f43f5e',
            position: { x: spawnX, y: 0, z: spawnZ },
            rotation: { y: Math.PI / 2, pitch: 0 },
            health: 100,
            shield: 50,
            isDead: false,
            isEliminated: false,
            kills: 0,
            deaths: 0,
            score: 0,
            ping: 15,
            isBot: true,
            weaponType: weapons[Math.floor(Math.random() * weapons.length)],
            armorSkin: 'cyber_neon',
            armHits: 0,
            legHits: 0,
            disabledWeapons: false,
            speedMultiplier: 1.0,
          };
          room.players.set(botId, botPlayer);
          redCount++;
        }
        bIdx++;
      }

      // Fill Blue Team up to 5
      while (blueCount < 5 && bIdx < BOT_NAMES.length) {
        const botId = `bot_blue_${bIdx}_${room.id}`;
        if (!room.players.has(botId)) {
          const spawnX = 22 + (Math.random() - 0.5) * 8;
          const spawnZ = (Math.random() - 0.5) * 12;
          const botPlayer: Player = {
            id: botId,
            name: `[BOT] ${BOT_NAMES[bIdx]}`,
            team: 'blue',
            color: '#00f3ff',
            position: { x: spawnX, y: 0, z: spawnZ },
            rotation: { y: -Math.PI / 2, pitch: 0 },
            health: 100,
            shield: 50,
            isDead: false,
            isEliminated: false,
            kills: 0,
            deaths: 0,
            score: 0,
            ping: 15,
            isBot: true,
            weaponType: weapons[Math.floor(Math.random() * weapons.length)],
            armorSkin: 'cyber_neon',
            armHits: 0,
            legHits: 0,
            disabledWeapons: false,
            speedMultiplier: 1.0,
          };
          room.players.set(botId, botPlayer);
          blueCount++;
        }
        bIdx++;
      }
    } else {
      let botIndex = 0;
      while (room.players.size < 12 && botIndex < BOT_NAMES.length) {
        const botName = `[BOT] ${BOT_NAMES[botIndex]}`;
        const botId = `bot_${botIndex}_${room.id}`;

        if (!room.players.has(botId)) {
          const team: Team = 'ffa';
          const angle = (botIndex / 12) * Math.PI * 2;
          const radius = 26 + Math.random() * 6;
          const spawnX = Math.cos(angle) * radius;
          const spawnZ = Math.sin(angle) * radius;

          const botPlayer: Player = {
            id: botId,
            name: botName,
            team,
            color: botIndex % 2 === 0 ? '#00f3ff' : '#f43f5e',
            position: { x: spawnX, y: 0, z: spawnZ },
            rotation: { y: Math.atan2(-spawnX, -spawnZ), pitch: 0 },
            health: 100,
            shield: 50,
            isDead: false,
            isEliminated: false,
            kills: 0,
            deaths: 0,
            score: 0,
            ping: 15,
            isBot: true,
            weaponType: weapons[Math.floor(Math.random() * weapons.length)],
            armorSkin: 'cyber_neon',
            armHits: 0,
            legHits: 0,
            disabledWeapons: false,
            speedMultiplier: 1.0,
          };

          room.players.set(botId, botPlayer);
        }
        botIndex++;
      }
    }
  }

  // Broadcast helper
  function broadcastToRoom(room: Room, data: Record<string, unknown>, skipPlayerId?: string) {
    const payload = JSON.stringify(data);
    room.sockets.forEach((socket, pid) => {
      if (pid !== skipPlayerId && socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });
  }

  // Server Room Engine Tick (20Hz)
  setInterval(() => {
    rooms.forEach((room) => {
      // 1. Decrement match timer & update storm phases
      if (room.status === 'in_progress') {
        if (room.matchTimer > 0) {
          room.matchTimer -= 0.05;
        }

        // Storm phase transitions
        if (!room.storm.isDisabled) {
          if (room.matchTimer < 180 && room.storm.phase === 1) {
            room.storm.phase = 2;
            room.storm.targetRadius = 26;
            room.storm.isShrinking = true;
          } else if (room.matchTimer < 120 && room.storm.phase === 2) {
            room.storm.phase = 3;
            room.storm.targetRadius = 15;
            room.storm.isShrinking = true;
          } else if (room.matchTimer < 60 && room.storm.phase === 3) {
            room.storm.phase = 4;
            room.storm.targetRadius = 6;
            room.storm.isShrinking = true;
          }

          // Smooth storm shrinking
          if (room.storm.radius > room.storm.targetRadius) {
            room.storm.radius = Math.max(room.storm.targetRadius, room.storm.radius - 0.04);
          } else {
            room.storm.isShrinking = false;
          }

          // 2. Storm Damage Check on All Alive Players
          room.players.forEach((player) => {
            if (!player.isDead && !player.isEliminated && !player.isGodMode) {
              const dist = Math.hypot(player.position.x - room.storm.center.x, player.position.z - room.storm.center.z);
              if (dist > room.storm.radius) {
                // Deal storm damage (0.25 HP per 50ms = 5 HP/sec)
                let dmg = 0.25 * room.storm.phase;
                if (player.shield > 0) {
                  const shieldDmg = Math.min(player.shield, dmg);
                  player.shield -= shieldDmg;
                  dmg -= shieldDmg;
                }
                if (dmg > 0) {
                  player.health -= dmg;
                }

                if (player.health <= 0) {
                  player.health = 0;
                  player.isDead = true;
                  player.isEliminated = true;
                  player.deaths = 1;

                  const aliveCount = Array.from(room.players.values()).filter((p) => !p.isEliminated).length;
                  player.placement = aliveCount + 1;

                  const entry: KillfeedEntry = {
                    id: Math.random().toString(36).substring(2, 9),
                    shooterName: 'CYBER STORM',
                    shooterTeam: 'ffa',
                    victimName: player.name,
                    victimTeam: player.team,
                    weaponType: 'pulse',
                    isHeadshot: false,
                    timestamp: Date.now(),
                    isStormKill: true,
                  };
                  room.killfeed.unshift(entry);
                  if (room.killfeed.length > 8) room.killfeed.pop();

                  broadcastToRoom(room, {
                    type: 'PLAYER_ELIMINATED',
                    killfeedEntry: entry,
                    victimId: player.id,
                    shooterId: 'storm',
                  });
                }
              }
            }
          });
        }

        // 3. AI Bot Behavior, Seeking, Crystal Harvesting & Engagement Battle
        const now = Date.now();

        // Check powerup crystal respawns
        room.powerups.forEach((p, id) => {
          if (p.isSingleUse || id.startsWith('dev_crystal_')) {
            return; // Single-use dev crystals never respawn
          }
          if (!p.isAvailable && p.respawnAt > 0 && now >= p.respawnAt) {
            p.isAvailable = true;
            broadcastToRoom(room, {
              type: 'POWERUP_RESPAWNED',
              powerupId: p.id,
            });
          }
        });

        room.players.forEach((player) => {
          if (player.isBot && !player.isDead && !player.isEliminated) {
            let ai = botAIStates.get(player.id);
            if (!ai) {
              ai = {
                patrolWaypointIndex: Math.floor(Math.random() * 5),
                lastShotTime: 0,
                stuckCounter: 0,
                lastX: player.position.x,
                lastZ: player.position.z,
              };
              botAIStates.set(player.id, ai);
            }

            // A. Check for crystal pickup by bot if close to available crystal
            room.powerups.forEach((p) => {
              if (p.isAvailable) {
                const pDist = Math.hypot(player.position.x - p.position.x, player.position.z - p.position.z);
                if (pDist < 2.2) {
                  p.isAvailable = false;
                  if (p.isSingleUse || p.id.startsWith('dev_crystal_')) {
                    room.powerups.delete(p.id);
                  } else {
                    p.respawnAt = now + 20000;
                  }

                  // Apply crystal buff to bot
                  if (p.type === 'blue_crystal') {
                    player.health = Math.min(100, player.health + 25);
                  } else if (p.type === 'green_crystal') {
                    player.shield = Math.min(50, player.shield + 25);
                  } else if (p.type === 'red_crystal') {
                    player.health = Math.min(100, player.health + 15);
                    player.shield = Math.min(50, player.shield + 15);
                  }

                  broadcastToRoom(room, {
                    type: 'POWERUP_COLLECTED',
                    powerupId: p.id,
                    collectorId: player.id,
                    collectorName: player.name,
                    powerupType: p.type,
                  });
                }
              }
            });

            // B. Target Search: Find all opponents (ignore teammates in team_5v5)
            let closestOpponent: Player | null = null;
            let minOpponentDist = 999;
            let closestVisibleOpponent: Player | null = null;
            let minVisibleDist = 999;

            room.players.forEach((other) => {
              const isTeammate = room.gameMode === 'team_5v5' && other.team === player.team;
              if (!isTeammate && other.id !== player.id && !other.isDead && !other.isEliminated) {
                const dist = Math.hypot(
                  other.position.x - player.position.x,
                  other.position.z - player.position.z
                );
                if (dist < minOpponentDist) {
                  minOpponentDist = dist;
                  closestOpponent = other;
                }

                if (dist < 65) {
                  const visible = hasLineOfSight(
                    player.position.x,
                    player.position.z,
                    other.position.x,
                    other.position.z,
                    room.mapId
                  );
                  if (visible && dist < minVisibleDist) {
                    minVisibleDist = dist;
                    closestVisibleOpponent = other;
                  }
                }
              }
            });

            // C. Crystal Search: Find available crystal to collect
            let targetCrystal: ServerPowerup | null = null;
            let minCrystalDist = 999;

            const needsHealing = player.health < 80 || player.shield < 40;

            room.powerups.forEach((p) => {
              if (p.isAvailable) {
                const cDist = Math.hypot(p.position.x - player.position.x, p.position.z - player.position.z);
                if (cDist < minCrystalDist) {
                  if (needsHealing || cDist < 18 || !closestVisibleOpponent) {
                    minCrystalDist = cDist;
                    targetCrystal = p;
                  }
                }
              }
            });

            // D. Target Destination Determination
            let targetX = player.position.x;
            let targetZ = player.position.z;
            let isEngaging = false;
            let activeTargetOpponent: Player | null = null;

            if (closestVisibleOpponent || (closestOpponent && minOpponentDist < 35 && (!targetCrystal || minOpponentDist < minCrystalDist * 0.8))) {
              activeTargetOpponent = closestVisibleOpponent || closestOpponent;
              targetX = activeTargetOpponent!.position.x;
              targetZ = activeTargetOpponent!.position.z;
              isEngaging = true;
            } else if (targetCrystal) {
              targetX = targetCrystal.position.x;
              targetZ = targetCrystal.position.z;
            } else {
              const waypoints = MAP_WAYPOINTS[room.mapId] || MAP_WAYPOINTS.neon_grid;
              const wp = waypoints[ai.patrolWaypointIndex % waypoints.length];
              targetX = wp.x;
              targetZ = wp.z;

              const distToWp = Math.hypot(targetX - player.position.x, targetZ - player.position.z);
              if (distToWp < 3) {
                ai.patrolWaypointIndex = (ai.patrolWaypointIndex + 1 + Math.floor(Math.random() * 2)) % waypoints.length;
              }
            }

            // Storm override
            const distFromStormCenter = Math.hypot(player.position.x - room.storm.center.x, player.position.z - room.storm.center.z);
            if (distFromStormCenter > room.storm.radius - 6) {
              targetX = room.storm.center.x;
              targetZ = room.storm.center.z;
              isEngaging = false;
            }

            // E. Rotation and Movement towards target
            const dx = targetX - player.position.x;
            const dz = targetZ - player.position.z;
            const distToTarget = Math.hypot(dx, dz);

            if (distToTarget > 0.1) {
              const targetAngle = Math.atan2(-dx, -dz);
              let angleDiff = targetAngle - player.rotation.y;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

              player.rotation.y += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.22);

              if (activeTargetOpponent) {
                const dy = (activeTargetOpponent.position.y + 1.2) - (player.position.y + 1.2);
                player.rotation.pitch = Math.atan2(dy, distToTarget);
              } else {
                player.rotation.pitch = 0;
              }

              let speed = 0.22;
              let moveAngle = player.rotation.y;

              if (isEngaging) {
                if (distToTarget > 12) {
                  moveAngle = player.rotation.y;
                  speed = 0.25;
                } else if (distToTarget > 4) {
                  const weaveOffset = Math.sin(now * 0.002 + player.id.charCodeAt(4)) * 0.45;
                  moveAngle = player.rotation.y + weaveOffset;
                  speed = 0.22;
                } else {
                  const sideOffset = (player.id.charCodeAt(3) % 2 === 0 ? 1 : -1) * 0.8;
                  moveAngle = player.rotation.y + sideOffset;
                  speed = 0.18;
                }
              }

              let moveDirX = -Math.sin(moveAngle);
              let moveDirZ = -Math.cos(moveAngle);

              const distMoved = Math.hypot(player.position.x - ai.lastX, player.position.z - ai.lastZ);
              if (distMoved < 0.02) {
                ai.stuckCounter++;
                if (ai.stuckCounter > 6) {
                  moveAngle += Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1);
                  moveDirX = -Math.sin(moveAngle);
                  moveDirZ = -Math.cos(moveAngle);
                  if (ai.stuckCounter > 15) {
                    ai.patrolWaypointIndex++;
                    ai.stuckCounter = 0;
                  }
                }
              } else {
                ai.stuckCounter = 0;
              }

              ai.lastX = player.position.x;
              ai.lastZ = player.position.z;

              let candidateX = player.position.x + moveDirX * speed;
              let candidateZ = player.position.z + moveDirZ * speed;

              const obstacles = MAP_OBSTACLES[room.mapId] || MAP_OBSTACLES.neon_grid;
              let collides = false;
              const botRadius = 0.8;

              for (const obs of obstacles) {
                if (
                  candidateX > obs.minX - botRadius &&
                  candidateX < obs.maxX + botRadius &&
                  candidateZ > obs.minZ - botRadius &&
                  candidateZ < obs.maxZ + botRadius
                ) {
                  collides = true;
                  break;
                }
              }

              if (!collides) {
                player.position.x = candidateX;
                player.position.z = candidateZ;
              } else {
                const candXOnly = player.position.x + moveDirX * speed;
                let xOk = true;
                for (const obs of obstacles) {
                  if (
                    candXOnly > obs.minX - botRadius &&
                    candXOnly < obs.maxX + botRadius &&
                    player.position.z > obs.minZ - botRadius &&
                    player.position.z < obs.maxZ + botRadius
                  ) {
                    xOk = false;
                    break;
                  }
                }
                if (xOk) {
                  player.position.x = candXOnly;
                } else {
                  const candZOnly = player.position.z + moveDirZ * speed;
                  let zOk = true;
                  for (const obs of obstacles) {
                    if (
                      player.position.x > obs.minX - botRadius &&
                      player.position.x < obs.maxX + botRadius &&
                      candZOnly > obs.minZ - botRadius &&
                      candZOnly < obs.maxZ + botRadius
                    ) {
                      zOk = false;
                      break;
                    }
                  }
                  if (zOk) {
                    player.position.z = candZOnly;
                  }
                }
              }

              player.position.x = Math.max(-36, Math.min(36, player.position.x));
              player.position.z = Math.max(-36, Math.min(36, player.position.z));
            }

            // F. Shooting / Battle Engagement Firing
            if (activeTargetOpponent) {
              const canSee = hasLineOfSight(
                player.position.x,
                player.position.z,
                activeTargetOpponent.position.x,
                activeTargetOpponent.position.z,
                room.mapId
              );

              // Bot shooting time every 3.5 seconds (3500ms) excluding SMG
              let fireCooldown = 3500;
              if (player.weaponType === 'smg') fireCooldown = 80;

              if (canSee && (now - ai.lastShotTime >= fireCooldown)) {
                ai.lastShotTime = now;

                const spread = player.weaponType === 'sniper' ? 0.04 : 0.22;
                const fx = -Math.sin(player.rotation.y) * Math.cos(player.rotation.pitch) + (Math.random() - 0.5) * spread;
                const fy = Math.sin(player.rotation.pitch) + (Math.random() - 0.5) * spread;
                const fz = -Math.cos(player.rotation.y) * Math.cos(player.rotation.pitch) + (Math.random() - 0.5) * spread;

                const shotData = {
                  id: Math.random().toString(36).substring(2, 9),
                  shooterId: player.id,
                  shooterName: player.name,
                  team: player.team,
                  weaponType: player.weaponType,
                  origin: { x: player.position.x, y: player.position.y + 1.2, z: player.position.z },
                  direction: { x: fx, y: fy, z: fz },
                  color: player.weaponType === 'smg' ? '#ff0077' : '#f43f5e',
                  timestamp: now,
                };

                broadcastToRoom(room, {
                  type: 'LASER_SHOT',
                  shot: shotData,
                });

                const hitChance = Math.max(0.12, 0.45 - (minOpponentDist / 45));
                if (Math.random() < hitChance && !activeTargetOpponent.isGodMode) {
                  let damage = 18;
                  let isHeadshot = false;

                  if (player.weaponType === 'smg') {
                    damage = 10;
                  } else if (player.weaponType === 'rail') {
                    damage = 35;
                  } else if (player.weaponType === 'scatter') {
                    damage = 22;
                  } else if (player.weaponType === 'cannon') {
                    damage = 25;
                  } else if (player.weaponType === 'sniper') {
                    // Sniper limb & torso/head rules
                    const partRoll = Math.random();
                    if (partRoll < 0.60) {
                      // Torso/Head: 1-shot kill!
                      damage = 200;
                      isHeadshot = partRoll < 0.15;
                    } else if (partRoll < 0.80) {
                      // Arm hit: 25 damage + arm restriction
                      damage = 25;
                      activeTargetOpponent.armHits = (activeTargetOpponent.armHits || 0) + 1;
                      if (activeTargetOpponent.armHits === 1) {
                        activeTargetOpponent.weaponType = 'handgun';
                      } else if (activeTargetOpponent.armHits >= 2) {
                        activeTargetOpponent.disabledWeapons = true;
                      }
                    } else {
                      // Leg hit: 25 damage + speed decrease
                      damage = 25;
                      activeTargetOpponent.legHits = (activeTargetOpponent.legHits || 0) + 1;
                      if (activeTargetOpponent.legHits === 1) {
                        activeTargetOpponent.speedMultiplier = 0.50;
                      } else if (activeTargetOpponent.legHits >= 2) {
                        activeTargetOpponent.speedMultiplier = 0.25;
                      }
                    }
                  } else {
                    isHeadshot = Math.random() < 0.08;
                    if (isHeadshot) damage *= 1.4;
                  }

                  if (activeTargetOpponent.shield > 0) {
                    const shieldDmg = Math.min(activeTargetOpponent.shield, damage);
                    activeTargetOpponent.shield -= shieldDmg;
                    damage -= shieldDmg;
                  }
                  if (damage > 0) {
                    activeTargetOpponent.health -= damage;
                  }

                  if (activeTargetOpponent.health <= 0) {
                    activeTargetOpponent.health = 0;
                    activeTargetOpponent.isDead = true;
                    activeTargetOpponent.isEliminated = true;
                    activeTargetOpponent.deaths += 1;

                    player.kills += 1;
                    player.score += isHeadshot ? 250 : 150;

                    const aliveCount = Array.from(room.players.values()).filter((p) => !p.isEliminated).length;
                    activeTargetOpponent.placement = aliveCount + 1;

                    const entry: KillfeedEntry = {
                      id: Math.random().toString(36).substring(2, 9),
                      shooterName: player.name,
                      shooterTeam: player.team,
                      victimName: activeTargetOpponent.name,
                      victimTeam: activeTargetOpponent.team,
                      weaponType: player.weaponType,
                      isHeadshot,
                      timestamp: now,
                    };

                    room.killfeed.unshift(entry);
                    if (room.killfeed.length > 8) room.killfeed.pop();

                    broadcastToRoom(room, {
                      type: 'PLAYER_ELIMINATED',
                      killfeedEntry: entry,
                      victimId: activeTargetOpponent.id,
                      shooterId: player.id,
                    });
                  }
                }
              }
            }
          }
        });

        // 4. Check Victory Royale Condition
        const activeSurvivors = Array.from(room.players.values()).filter((p) => !p.isEliminated);
        room.aliveCount = activeSurvivors.length;
        room.totalPlayers = room.players.size;

        if (activeSurvivors.length <= 1 && room.totalPlayers > 1) {
          room.status = 'game_over';
          if (activeSurvivors.length === 1) {
            const winner = activeSurvivors[0];
            winner.placement = 1;
            room.winnerPlayerId = winner.id;
            room.winnerName = winner.name;
          }

          broadcastToRoom(room, {
            type: 'VICTORY_ROYALE',
            winnerId: room.winnerPlayerId,
            winnerName: room.winnerName || 'UNKNOWN CHAMPION',
          });

          // Restart round after 8 seconds
          setTimeout(() => {
            resetMatchRound(room);
          }, 8000);
        } else if (room.matchTimer <= 0) {
          room.status = 'game_over';
          const winner = activeSurvivors.sort((a, b) => b.health - a.health)[0];
          if (winner) {
            winner.placement = 1;
            room.winnerPlayerId = winner.id;
            room.winnerName = winner.name;
          }

          broadcastToRoom(room, {
            type: 'VICTORY_ROYALE',
            winnerId: room.winnerPlayerId,
            winnerName: room.winnerName || 'TIME OUT SURVIVOR',
          });

          setTimeout(() => {
            resetMatchRound(room);
          }, 8000);
        }
      }

      // 5. Broadcast State Sync to Clients
      broadcastToRoom(room, {
        type: 'STATE_SYNC',
        matchTimer: Math.ceil(room.matchTimer),
        aliveCount: room.aliveCount,
        totalPlayers: room.totalPlayers,
        storm: room.storm,
        status: room.status,
        winnerName: room.winnerName,
        players: Array.from(room.players.values()),
        mapId: room.mapId,
      });
    });
  }, 50);

  // WebSocket Connection Handler
  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId = 'arena_alpha';
    let playerId = '';

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'JOIN_ROOM': {
            currentRoomId = data.roomId || 'arena_alpha';
            let room = rooms.get(currentRoomId);
            if (!room) {
              room = createRoom(currentRoomId, data.roomName || 'Custom BR Sector', data.mapId || 'neon_grid');
            } else {
              // RESET ARENA AND STORM EACH TIME PLAYER ENTERS THE GAME
              if (data.mapId) {
                room.mapId = data.mapId;
              }
              resetMatchRound(room);
            }

            playerId = data.player.id;
            room.sockets.set(playerId, ws);

            const numP = room.players.size;
            const angle = (numP / 12) * Math.PI * 2;
            const radius = 26 + Math.random() * 4;
            const spawnX = Math.cos(angle) * radius;
            const spawnZ = Math.sin(angle) * radius;

            const newPlayer: Player = {
              ...data.player,
              position: { x: spawnX, y: 0, z: spawnZ },
              rotation: { y: Math.atan2(-spawnX, -spawnZ), pitch: 0 },
              health: 100,
              shield: 50,
              isDead: false,
              isEliminated: false,
              kills: 0,
              deaths: 0,
              score: 0,
              ping: 20,
              isBot: false,
              armHits: 0,
              legHits: 0,
              disabledWeapons: false,
              speedMultiplier: 1.0,
            };

            room.players.set(playerId, newPlayer);

            // Send full initial state to connected client
            ws.send(JSON.stringify({
              type: 'INIT_STATE',
              roomId: room.id,
              roomName: room.name,
              mapId: room.mapId,
              player: newPlayer,
              players: Array.from(room.players.values()),
              aliveCount: room.aliveCount,
              totalPlayers: room.totalPlayers,
              storm: room.storm,
              matchTimer: Math.ceil(room.matchTimer),
            }));

            // Notify others
            broadcastToRoom(room, {
              type: 'PLAYER_JOINED',
              player: newPlayer,
            }, playerId);
            break;
          }

          case 'PLAYER_MOVE': {
            const room = rooms.get(currentRoomId);
            if (room && playerId && room.players.has(playerId)) {
              const p = room.players.get(playerId)!;
              p.position = data.position;
              p.rotation = data.rotation;
            }
            break;
          }

          case 'SHOOT_LASER': {
            const room = rooms.get(currentRoomId);
            if (room) {
              broadcastToRoom(room, {
                type: 'LASER_SHOT',
                shot: data.shot,
              }, playerId);
            }
            break;
          }

          case 'HIT_PLAYER': {
            const room = rooms.get(currentRoomId);
            if (room) {
              const shooter = room.players.get(data.hit.shooterId);
              const victim = room.players.get(data.hit.victimId);

              if (victim && !victim.isDead && !victim.isEliminated && !victim.isGodMode) {
                let damageRemaining = data.hit.damage;
                const hitLoc = data.hit.hitLocation || 'torso';

                if (data.hit.weaponType === 'sniper') {
                  if (hitLoc === 'torso' || hitLoc === 'head') {
                    damageRemaining = 200; // One-shot kill!
                  } else if (hitLoc === 'arm') {
                    damageRemaining = 25;
                    victim.armHits = (victim.armHits || 0) + 1;
                    if (victim.armHits === 1) {
                      victim.weaponType = 'handgun';
                    } else if (victim.armHits >= 2) {
                      victim.disabledWeapons = true;
                    }
                  } else if (hitLoc === 'leg') {
                    damageRemaining = 25;
                    victim.legHits = (victim.legHits || 0) + 1;
                    if (victim.legHits === 1) {
                      victim.speedMultiplier = 0.50;
                    } else if (victim.legHits >= 2) {
                      victim.speedMultiplier = 0.25;
                    }
                  }
                }

                // Shield absorbs damage first
                if (victim.shield > 0) {
                  const shieldDmg = Math.min(victim.shield, damageRemaining);
                  victim.shield -= shieldDmg;
                  damageRemaining -= shieldDmg;
                }

                if (damageRemaining > 0) {
                  victim.health -= damageRemaining;
                }

                // Victim Death / Elimination
                if (victim.health <= 0) {
                  victim.health = 0;
                  victim.isDead = true;
                  victim.isEliminated = true;
                  victim.deaths = 1;

                  const aliveCount = Array.from(room.players.values()).filter((p) => !p.isEliminated).length;
                  victim.placement = aliveCount + 1;

                  if (shooter) {
                    shooter.kills += 1;
                    shooter.score += data.hit.isHeadshot ? 250 : 150;
                  }

                  const killfeedEntry: KillfeedEntry = {
                    id: Math.random().toString(36).substring(2, 9),
                    shooterName: shooter ? shooter.name : 'Unknown',
                    shooterTeam: shooter ? shooter.team : 'ffa',
                    victimName: victim.name,
                    victimTeam: victim.team,
                    weaponType: data.hit.weaponType,
                    isHeadshot: data.hit.isHeadshot,
                    timestamp: Date.now(),
                  };

                  room.killfeed.unshift(killfeedEntry);
                  if (room.killfeed.length > 8) room.killfeed.pop();

                  broadcastToRoom(room, {
                    type: 'PLAYER_ELIMINATED',
                    killfeedEntry,
                    victimId: victim.id,
                    shooterId: shooter?.id,
                  });
                }
              }
            }
            break;
          }

          case 'COLLECT_POWERUP': {
            const room = rooms.get(currentRoomId);
            if (room) {
              const p = room.powerups.get(data.powerupId);
              if (p && p.isAvailable) {
                p.isAvailable = false;
                if (p.isSingleUse || p.id.startsWith('dev_crystal_')) {
                  room.powerups.delete(p.id);
                } else {
                  p.respawnAt = Date.now() + 20000;
                }

                broadcastToRoom(room, {
                  type: 'POWERUP_COLLECTED',
                  powerupId: p.id,
                  collectorId: playerId,
                  collectorName: room.players.get(playerId)?.name,
                  powerupType: p.type,
                }, playerId);
              }
            }
            break;
          }

          case 'TOGGLE_GOD_MODE': {
            const room = rooms.get(currentRoomId);
            if (room) {
              const player = room.players.get(playerId);
              if (player) {
                player.isGodMode = data.isGodMode;
                if (player.isGodMode) {
                  player.health = 100;
                  player.shield = 50;
                  player.isDead = false;
                }
                broadcastToRoom(room, {
                  type: 'PLAYER_GOD_MODE_CHANGED',
                  playerId: player.id,
                  playerName: player.name,
                  isGodMode: player.isGodMode,
                });
              }
            }
            break;
          }

          case 'TOGGLE_STORM': {
            const room = rooms.get(currentRoomId);
            if (room) {
              const player = room.players.get(playerId);
              if (player && player.isGodMode) {
                room.storm.isDisabled = !room.storm.isDisabled;
                if (room.storm.isDisabled) {
                  room.storm.isShrinking = false;
                }
                broadcastToRoom(room, {
                  type: 'STORM_UPDATED',
                  storm: room.storm,
                  isDisabled: room.storm.isDisabled,
                });
              }
            }
            break;
          }

          case 'SPAWN_DEV_CRYSTAL': {
            const room = rooms.get(currentRoomId);
            if (room) {
              const player = room.players.get(playerId);
              if (player && player.isGodMode) {
                const powerupId = `dev_crystal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const powerup: ServerPowerup = {
                  id: powerupId,
                  type: data.crystalType,
                  position: data.position,
                  isAvailable: true,
                  respawnAt: 0,
                  isSingleUse: true,
                };
                room.powerups.set(powerupId, powerup);

                broadcastToRoom(room, {
                  type: 'DEV_CRYSTAL_SPAWNED',
                  powerup,
                  spawnerName: player.name,
                });
              }
            }
            break;
          }

          case 'CHAT_MESSAGE': {
            const room = rooms.get(currentRoomId);
            if (room) {
              broadcastToRoom(room, {
                type: 'CHAT_MESSAGE',
                message: data.message,
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket Error:', err);
      }
    });

    ws.on('close', () => {
      const room = rooms.get(currentRoomId);
      if (room && playerId) {
        room.sockets.delete(playerId);
        room.players.delete(playerId);

        broadcastToRoom(room, {
          type: 'PLAYER_LEFT',
          playerId,
        });

        populateBots(room);
      }
    });
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Battle Royale 3D Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

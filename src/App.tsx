import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import { Player, LaserShot, HitEvent, MapId, Team, WeaponType, KillfeedEntry, ChatMessage } from './types';
import { HUD } from './components/HUD';
import { LobbyModal } from './components/LobbyModal';
import { LoadoutModal } from './components/LoadoutModal';
import { ScoreboardOverlay } from './components/ScoreboardOverlay';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { audioManager } from './game/AudioManager';
import { MAP_CONFIGS } from './game/MapConfigs';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // App State
  const [inGame, setInGame] = useState(false);
  const [playerName, setPlayerName] = useState('TAGGER_ONE');
  const [selectedTeam, setSelectedTeam] = useState<Team>('red');
  const [selectedMap, setSelectedMap] = useState<MapId>('neon_grid');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('pulse');

  // Modals & Overlays
  const [showLoadout, setShowLoadout] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Game Engine & Server Synced State
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [aliveCount, setAliveCount] = useState(12);
  const [totalPlayers, setTotalPlayers] = useState(12);
  const [kills, setKills] = useState(0);
  const [matchTimer, setMatchTimer] = useState(300);
  const [storm, setStorm] = useState<{ center: { x: number; y: number; z: number }; radius: number; isShrinking: boolean }>({
    center: { x: 0, y: 0, z: 0 },
    radius: 120,
    isShrinking: false,
  });
  const [winnerName, setWinnerName] = useState<string>('');
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // HUD Dynamic Feedback
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [currentAmmo, setCurrentAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [hitmarkerActive, setHitmarkerActive] = useState(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState(false);

  // Crystal Buff States & Notifications
  const [redCrystalTimer, setRedCrystalTimer] = useState(0);
  const [greenCrystalTimer, setGreenCrystalTimer] = useState(0);
  const [crystalToast, setCrystalToast] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [isStormDisabled, setIsStormDisabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Laser Tag Arena Server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'INIT_STATE': {
            setLocalPlayer(data.player);
            setPlayers(data.players);
            setAliveCount(data.aliveCount || data.players.length);
            setTotalPlayers(data.totalPlayers || data.players.length);
            setMatchTimer(data.matchTimer);

            if (engineRef.current) {
              engineRef.current.setLocalPlayer(data.player);
              engineRef.current.updatePlayers(data.players);
            }
            break;
          }

          case 'STATE_SYNC': {
            setMatchTimer(data.matchTimer);
            setPlayers(data.players);
            setAliveCount(data.aliveCount || data.players.filter((p: Player) => !p.isEliminated).length);
            setTotalPlayers(data.totalPlayers || data.players.length);

            // Sync local kills
            const me = data.players.find((p: Player) => p.id === engineRef.current?.localPlayerId);
            if (me) {
              setKills(me.kills || me.tags || 0);
            }

            if (data.storm) {
              setStorm(data.storm);
              if (engineRef.current) {
                engineRef.current.updateStorm(data.storm);
              }
            }

            if (data.isRoundOver) {
              setIsGameOver(true);
              setWinnerName(data.winnerName || 'Unknown');
            }

            if (engineRef.current) {
              engineRef.current.updatePlayers(data.players);
            }
            break;
          }

          case 'LASER_SHOT': {
            if (engineRef.current && data.shot.shooterId !== engineRef.current.localPlayerId) {
              engineRef.current.handleRemoteLaserShot(data.shot);
            }
            break;
          }

          case 'PLAYER_ELIMINATED':
          case 'PLAYER_TAGGED_OUT': {
            setKillfeed((prev) => [data.killfeedEntry, ...prev.slice(0, 7)]);
            if (data.shooterId === engineRef.current?.localPlayerId) {
              audioManager.playTagKill();
            } else if (data.victimId === engineRef.current?.localPlayerId) {
              audioManager.playDamageTaken();
            }
            break;
          }

          case 'CHAT_MESSAGE': {
            setChatMessages((prev) => [...prev, data.message]);
            break;
          }

          case 'POWERUP_COLLECTED': {
            if (engineRef.current) {
              engineRef.current.hidePowerup(data.powerupId);
            }
            if (data.collectorName && data.powerupType) {
              const label = data.powerupType.replace('_', ' ').toUpperCase();
              setCrystalToast(`${data.collectorName} COLLECTED A ${label}!`);
              setTimeout(() => setCrystalToast(null), 2500);
            }
            break;
          }

          case 'POWERUP_RESPAWNED': {
            if (engineRef.current) {
              engineRef.current.showPowerup(data.powerupId);
            }
            break;
          }

          case 'DEV_CRYSTAL_SPAWNED': {
            if (engineRef.current && data.powerup) {
              engineRef.current.addDynamicPowerup(data.powerup);
            }
            const typeLabel = data.powerup?.type ? data.powerup.type.replace('_', ' ').toUpperCase() : 'CRYSTAL';
            setCrystalToast(`⚡ ${data.spawnerName || 'DEV'} SPAWNED A ${typeLabel}!`);
            setTimeout(() => setCrystalToast(null), 3000);
            break;
          }

          case 'PLAYER_GOD_MODE_CHANGED': {
            if (data.playerId === engineRef.current?.localPlayerId) {
              setIsGodMode(data.isGodMode);
            }
            const statusMsg = data.isGodMode ? '⚡ DEV GOD MODE ACTIVATED (INVINCIBLE)' : 'DEV GOD MODE DEACTIVATED';
            setCrystalToast(`${data.playerName || 'OPERATIVE'}: ${statusMsg}`);
            setTimeout(() => setCrystalToast(null), 3000);
            break;
          }

          case 'STORM_UPDATED': {
            if (engineRef.current && data.storm) {
              engineRef.current.updateStorm(data.storm);
            }
            if (typeof data.isDisabled === 'boolean') {
              setIsStormDisabled(data.isDisabled);
              setCrystalToast(data.isDisabled ? '⚡ DEV GOD MODE: CYBER STORM DISABLED' : '⚡ DEV GOD MODE: CYBER STORM REACTIVATED');
              setTimeout(() => setCrystalToast(null), 3000);
            }
            break;
          }

          case 'MATCH_ROUND_RESTART': {
            setSelectedMap(data.mapId);
            if (engineRef.current) {
              engineRef.current.loadMap(data.mapId);
            }
            break;
          }
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Listen to Tab Key for Scoreboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Listen to P Key ONLY for Pause Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (e.code === 'KeyP' && inGame && !isInput) {
        e.preventDefault();
        setIsPaused((prev) => {
          const next = !prev;
          if (engineRef.current) {
            engineRef.current.isPaused = next;
          }
          if (next) {
            document.exitPointerLock();
          } else {
            engineRef.current?.container.requestPointerLock();
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inGame]);

  const handleResume = () => {
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.isPaused = false;
      engineRef.current.container.requestPointerLock();
    }
  };

  const handleQuitToLobby = () => {
    setIsPaused(false);
    setInGame(false);
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  };

  // Sync HUD state from Engine Loop
  useEffect(() => {
    if (!inGame || !engineRef.current) return;

    const interval = setInterval(() => {
      if (engineRef.current) {
        setHealth(engineRef.current.health);
        setShield(engineRef.current.shield);
        setCurrentAmmo(engineRef.current.currentAmmo);
        setMaxAmmo(engineRef.current.maxAmmo);
        setIsReloading(engineRef.current.isReloading);
        setRedCrystalTimer(engineRef.current.redCrystalTimer);
        setGreenCrystalTimer(engineRef.current.greenCrystalTimer);
        setIsZoomed(engineRef.current.isZoomed);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [inGame]);

  const handleJoinMatch = () => {
    if (!containerRef.current) return;

    setInGame(true);

    // Initialize 3D Engine
    const engine = new GameEngine({
      container: containerRef.current,
      onPointerLockChange: (locked) => {
        setIsPointerLocked(locked);
      },
      onShootLaser: (shot) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'SHOOT_LASER', shot }));
        }
      },
      onHitPlayer: (hit) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'HIT_PLAYER', hit }));
        }
      },
      onLocalPlayerMove: (pos, rot) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'PLAYER_MOVE', position: pos, rotation: rot }));
        }
      },
      onHitmarker: (isHeadshot) => {
        setIsHeadshotHit(isHeadshot);
        setHitmarkerActive(true);
        setTimeout(() => setHitmarkerActive(false), 120);
      },
      onPowerupCollected: (type, message) => {
        setCrystalToast(message);
        setTimeout(() => {
          setCrystalToast(null);
        }, 3500);
      },
      onServerCollectPowerup: (powerupId) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'COLLECT_POWERUP', powerupId }));
        }
      },
      onToggleGodMode: (god) => {
        setIsGodMode(god);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'TOGGLE_GOD_MODE', isGodMode: god }));
        }
      },
      onSpawnDevCrystal: (type, pos) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'SPAWN_DEV_CRYSTAL', crystalType: type, position: pos }));
        }
      },
      onToggleStorm: () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'TOGGLE_STORM' }));
        }
      },
    });

    engine.loadMap(selectedMap);
    engineRef.current = engine;

    // Send Join Room to server
    const pId = 'p_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: pId,
      name: playerName,
      team: selectedTeam,
      color: selectedTeam === 'red' ? '#ff2a00' : '#00a8ff',
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0, pitch: 0 },
      health: 100,
      shield: 50,
      isDead: false,
      isEliminated: false,
      kills: 0,
      deaths: 0,
      score: 0,
      ping: 20,
      isBot: false,
      weaponType: selectedWeapon,
      armorSkin: 'neon_cyber',
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: 'arena_alpha',
          mapId: selectedMap,
          player: newPlayer,
        })
      );
    }
  };

  const handleSendChat = (text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && localPlayer) {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        senderId: localPlayer.id,
        senderName: localPlayer.name,
        team: localPlayer.team,
        text,
        timestamp: Date.now(),
      };
      socketRef.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', message: msg }));
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioManager.setMuted(nextMuted);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* 3D WEBGL CANVAS CONTAINER */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* LOBBY / MENU MODAL */}
      {!inGame && (
        <LobbyModal
          playerName={playerName}
          setPlayerName={setPlayerName}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          selectedWeapon={selectedWeapon}
          setSelectedWeapon={setSelectedWeapon}
          onJoinMatch={handleJoinMatch}
          onOpenLoadout={() => setShowLoadout(true)}
        />
      )}

      {/* WEAPON LOADOUT MODAL */}
      {showLoadout && (
        <LoadoutModal
          selectedWeapon={selectedWeapon}
          setSelectedWeapon={setSelectedWeapon}
          onClose={() => setShowLoadout(false)}
        />
      )}

      {/* ACTIVE HUD OVERLAY */}
      {inGame && localPlayer && (
        <HUD
          localPlayer={localPlayer}
          players={players}
          health={health}
          shield={shield}
          currentAmmo={currentAmmo}
          maxAmmo={maxAmmo}
          isReloading={isReloading}
          aliveCount={aliveCount}
          totalPlayers={totalPlayers}
          kills={kills}
          matchTimer={matchTimer}
          mapName={MAP_CONFIGS[selectedMap]?.name || 'Neon Sector 4B'}
          storm={storm}
          killfeed={killfeed}
          hitmarkerActive={hitmarkerActive}
          isHeadshotHit={isHeadshotHit}
          isPointerLocked={isPointerLocked}
          chatMessages={chatMessages}
          redCrystalTimer={redCrystalTimer}
          greenCrystalTimer={greenCrystalTimer}
          crystalToast={crystalToast}
          isZoomed={isZoomed}
          isGodMode={isGodMode}
          isStormDisabled={isStormDisabled}
          onSpawnDevCrystal={(type) => engineRef.current?.spawnDevCrystal(type)}
          onToggleStorm={() => engineRef.current?.toggleStorm()}
          onSendChat={handleSendChat}
          onReload={() => engineRef.current?.reloadBattery()}
          onOpenScoreboard={() => setShowScoreboard(true)}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      )}

      {/* TAB KEY SCOREBOARD */}
      {showScoreboard && (
        <ScoreboardOverlay
          players={players}
          aliveCount={aliveCount}
          totalPlayers={totalPlayers}
          matchTimer={matchTimer}
          mapName={MAP_CONFIGS[selectedMap]?.name || 'Neon Sector 4B'}
        />
      )}

      {/* PAUSE MODAL (P KEY ONLY) */}
      {inGame && isPaused && (
        <PauseModal
          onResume={handleResume}
          onQuitToLobby={handleQuitToLobby}
        />
      )}

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <GameOverModal
          winnerPlayerName={winnerName}
          isVictory={winnerName === localPlayer?.name}
          localPlayer={localPlayer!}
          players={players}
          onPlayAgain={() => setIsGameOver(false)}
        />
      )}
    </div>
  );
}

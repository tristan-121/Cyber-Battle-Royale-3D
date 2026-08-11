import React, { useState } from 'react';
import { Player, KillfeedEntry, StormZone, ChatMessage } from '../types';
import { WEAPON_CONFIGS } from '../game/WeaponConfigs';
import { Shield, Crosshair as CrosshairIcon, Send, Volume2, VolumeX, Radio } from 'lucide-react';
import { ScopeOverlay } from './ScopeOverlays';

interface HUDProps {
  localPlayer: Player;
  players: Player[];
  health: number;
  shield: number;
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  aliveCount: number;
  totalPlayers: number;
  kills: number;
  matchTimer: number;
  mapName: string;
  storm?: StormZone;
  killfeed: KillfeedEntry[];
  hitmarkerActive: boolean;
  isHeadshotHit: boolean;
  isPointerLocked: boolean;
  chatMessages: ChatMessage[];
  redCrystalTimer?: number;
  greenCrystalTimer?: number;
  crystalToast?: string | null;
  isZoomed?: boolean;
  isGodMode?: boolean;
  isStormDisabled?: boolean;
  onSpawnDevCrystal?: (type: 'red_crystal' | 'blue_crystal' | 'green_crystal') => void;
  onToggleStorm?: () => void;
  onSendChat: (text: string) => void;
  onReload: () => void;
  onOpenScoreboard: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  localPlayer,
  players,
  health,
  shield,
  currentAmmo,
  maxAmmo,
  isReloading,
  aliveCount,
  totalPlayers,
  kills,
  matchTimer,
  mapName,
  storm,
  killfeed,
  hitmarkerActive,
  isHeadshotHit,
  isPointerLocked,
  chatMessages,
  redCrystalTimer = 0,
  greenCrystalTimer = 0,
  crystalToast = null,
  isZoomed = false,
  isGodMode = false,
  isStormDisabled = false,
  onSpawnDevCrystal,
  onToggleStorm,
  onSendChat,
  onReload,
  onToggleMute,
  isMuted,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [showChatBox, setShowChatBox] = useState(false);

  const weaponConfig = WEAPON_CONFIGS[localPlayer.weaponType] || WEAPON_CONFIGS['pulse'];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendChat(chatInput.trim());
      setChatInput('');
      setShowChatBox(false);
    }
  };

  // Calculate Segmented Health Blocks (4 blocks)
  const totalHpBlocks = 4;
  const activeHpBlocks = Math.ceil((Math.max(0, health) / 100) * totalHpBlocks);

  // Calculate Segmented Ammo Bars (6 bars)
  const totalAmmoBars = 6;
  const activeAmmoBars = Math.ceil((currentAmmo / maxAmmo) * totalAmmoBars);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono text-white">
      {/* BACKGROUND SUBTLE TECH GRID LINES OVERLAY */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* TOP HEADER HUD AREA */}
      <div className="relative z-10 flex justify-between p-6 items-start">
        {/* LEFT PANEL: PLAYER CALLSIGN & LIVE EVENT FEED */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 bg-slate-900/80 border-l-4 border-cyan-400 p-3.5 w-64 backdrop-blur-md shadow-lg">
            <div className="h-10 w-10 bg-cyan-400/20 border border-cyan-400 flex items-center justify-center font-bold text-cyan-400">
              01
            </div>
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">OPERATIVE</div>
              <div className="text-base font-bold tracking-tight text-white">{localPlayer.name}</div>
            </div>
          </div>

          {/* LIVE EVENT FEED (KILLFEED) */}
          <div className="flex flex-col gap-1 w-72">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
              <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
              <span>LIVE EVENT FEED</span>
            </div>
            {killfeed.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="text-xs py-1 px-2.5 bg-slate-900/60 border-l-2 border-cyan-400/80 text-slate-200 backdrop-blur-sm"
              >
                {entry.isStormKill ? (
                  <>
                    <span className="text-rose-500 font-bold">{entry.victimName}</span>{' '}
                    <span className="text-slate-400">ELIMINATED BY CYBER STORM</span>
                  </>
                ) : (
                  <>
                    <span className="text-cyan-400 font-bold">{entry.shooterName}</span>{' '}
                    <span className="text-slate-400">ELIMINATED</span>{' '}
                    <span className="text-rose-500 font-bold">{entry.victimName}</span>
                    {entry.isHeadshot && <span className="ml-1 text-[9px] text-amber-400 font-bold">[HEADSHOT]</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER STATS & GOD MODE CONTROLLER */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-8 bg-slate-900/80 border border-slate-800 px-6 py-3 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-black text-cyan-400 tracking-tight">{aliveCount} / {totalPlayers}</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">OPERATORS ALIVE</div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div className="flex flex-col items-center">
              <div className="text-3xl font-black text-rose-500 tracking-tight">{kills}</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">ELIMINATIONS</div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div className="flex flex-col items-center">
              <div className="text-xl font-bold text-white tracking-tight">{formatTimer(matchTimer)}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">{mapName}</div>
            </div>
          </div>

          {/* DEVELOPER GOD MODE ACTIVE CONTROL PANEL */}
          {isGodMode && (
            <div className="pointer-events-auto flex flex-col items-center gap-1.5 bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border border-amber-500/50 px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md animate-pulse">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
                <span className="text-xs font-black text-amber-400 tracking-widest uppercase">
                  ⚡ DEVELOPER GOD MODE ACTIVE (INVINCIBLE)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => onSpawnDevCrystal?.('red_crystal')}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/80 text-rose-300 hover:text-white px-3 py-1 rounded transition-all active:scale-95 shadow-md flex items-center gap-1"
                >
                  <span>🔴 RED CRYSTAL</span>
                  <span className="text-[9px] bg-rose-500/30 px-1 rounded text-rose-200">[7]</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSpawnDevCrystal?.('blue_crystal')}
                  className="bg-sky-950/80 hover:bg-sky-900 border border-sky-500/80 text-sky-300 hover:text-white px-3 py-1 rounded transition-all active:scale-95 shadow-md flex items-center gap-1"
                >
                  <span>🔵 BLUE CRYSTAL</span>
                  <span className="text-[9px] bg-sky-500/30 px-1 rounded text-sky-200">[8]</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSpawnDevCrystal?.('green_crystal')}
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-300 hover:text-white px-3 py-1 rounded transition-all active:scale-95 shadow-md flex items-center gap-1"
                >
                  <span>🟢 GREEN SPEED BOOST</span>
                  <span className="text-[9px] bg-emerald-500/30 px-1 rounded text-emerald-200">[9]</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleStorm}
                  className={`px-3 py-1 rounded transition-all active:scale-95 shadow-md flex items-center gap-1 border font-bold ${
                    isStormDisabled
                      ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-500 text-amber-300'
                      : 'bg-cyan-950/90 hover:bg-cyan-900 border-cyan-500 text-cyan-300'
                  }`}
                >
                  <span>⚡ STORM: {isStormDisabled ? 'OFF' : 'ON'}</span>
                  <span className="text-[9px] bg-slate-800/80 px-1 rounded text-slate-200">[0]</span>
                </button>
              </div>
              <div className="text-[9px] text-amber-200/90 font-mono tracking-wider">
                ✈️ GOD FLIGHT MODE ACTIVE: WASD FREE FLY | SPACE: ASCEND | CTRL/C: DESCEND | PRESS [P] TO PAUSE
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT RADAR & AUDIO BUTTON */}
        <div className="flex flex-col items-end gap-2">
          <div className="w-44 h-44 border border-slate-700 rounded-full flex items-center justify-center relative bg-slate-900/60 backdrop-blur-md shadow-2xl">
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400/60 animate-pulse" />

            {/* Radar Sweep Lines */}
            <div className="absolute w-[1px] h-[50%] bg-cyan-400/50 bottom-1/2 origin-bottom transform rotate-45" />
            <div className="absolute inset-0 rounded-full border border-slate-800 scale-75 pointer-events-none" />

            {/* Local Center Marker */}
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />

            {/* Enemies Radar Blips */}
            {players.map((p) => {
              if (p.id === localPlayer.id || p.isDead || p.isEliminated) return null;
              const dx = p.position.x - localPlayer.position.x;
              const dz = p.position.z - localPlayer.position.z;
              const scale = 2.0;
              const bx = 88 + dx * scale;
              const by = 88 + dz * scale;

              if (bx < 10 || bx > 166 || by < 10 || by > 166) return null;

              return (
                <div
                  key={p.id}
                  style={{ left: `${bx}px`, top: `${by}px` }}
                  className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] animate-pulse"
                />
              );
            })}

            <div className="absolute bottom-[-10px] bg-slate-900 text-[10px] px-2 py-0.5 border border-slate-700 text-cyan-400 font-bold">
              NEON SECTOR 4B
            </div>
          </div>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto flex items-center gap-2 border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-bold text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ACTIVE'}</span>
          </button>
        </div>
      </div>

      {/* CENTER CROSSHAIR OR WEAPON SCOPE OVERLAY */}
      {isZoomed ? (
        <ScopeOverlay
          weaponType={localPlayer.weaponType}
          hitmarkerActive={hitmarkerActive}
          isHeadshotHit={isHeadshotHit}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-cyan-400/40 rounded-full flex items-center justify-center">
              <div className={`w-1.5 h-1.5 ${hitmarkerActive ? 'bg-rose-500 scale-150' : 'bg-cyan-400'} shadow-[0_0_8px_cyan]`} />
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-2 w-0.5 bg-cyan-400" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-2 w-0.5 bg-cyan-400" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-cyan-400" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-cyan-400" />

            {hitmarkerActive && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-rose-500 font-bold tracking-widest animate-ping">
                {isHeadshotHit ? 'CRITICAL HEADSHOT' : 'TARGET ACQUIRED'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM HUD: HEALTH BLOCKS, WARNING BADGE, & CHARGE STATUS */}
      <div className="mt-auto p-6 flex justify-between items-end relative z-10">
        {/* BOTTOM LEFT: GEOMETRIC SEGMENTED HEALTH & SHIELD */}
        <div className="flex flex-col gap-2 bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{Math.max(0, Math.round(health))}</span>
            <span className="text-sm text-cyan-400 mb-1 font-bold">HP</span>
            {shield > 0 && (
              <span className="text-xs text-sky-400 mb-1 ml-2 font-bold flex items-center gap-1">
                <Shield className="h-3 w-3" /> {Math.round(shield)} SHIELD
              </span>
            )}
          </div>

          {/* SEGMENTED HEALTH BLOCKS */}
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < activeHpBlocks;
              return (
                <div
                  key={idx}
                  className={`h-4 w-12 transition-all ${
                    isFilled
                      ? health > 25
                        ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                        : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">
            ARMOR INTEGRITY: {health > 50 ? 'OPTIMAL' : health > 20 ? 'WARNING' : 'CRITICAL'}
          </div>
        </div>

        {/* BOTTOM CENTER: ACTIVE CRYSTAL BUFFS, LIMB INJURIES & NOTIFICATIONS */}
        <div className="flex flex-col items-center gap-2 mb-4">
          {/* LIMB INJURY WARNING BADGES */}
          {localPlayer.disabledWeapons ? (
            <div className="px-5 py-2 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-black tracking-widest shadow-[0_0_18px_rgba(244,63,94,0.6)] animate-pulse">
              ⛔ BOTH ARMS CRIPPLED: ALL WEAPONS DISABLED!
            </div>
          ) : localPlayer.armHits && localPlayer.armHits > 0 ? (
            <div className="px-5 py-2 bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-black tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.5)] animate-pulse">
              ⚠️ ARM INJURED: RESTRICTED TO HANDGUN (PRESS SHIFT + 2)
            </div>
          ) : null}

          {localPlayer.legHits && localPlayer.legHits >= 2 ? (
            <div className="px-5 py-2 bg-purple-950/90 border border-purple-500 text-purple-300 text-xs font-black tracking-widest shadow-[0_0_18px_rgba(168,85,247,0.5)] animate-pulse">
              🦵 BOTH LEGS CRIPPLED: SPEED DECREASED BY 75%
            </div>
          ) : localPlayer.legHits && localPlayer.legHits === 1 ? (
            <div className="px-5 py-2 bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-black tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.4)]">
              🦵 LEG INJURED: SPEED DECREASED BY 50%
            </div>
          ) : null}

          {crystalToast && (
            <div className="px-5 py-2.5 bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-black tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-bounce">
              {crystalToast}
            </div>
          )}

          <div className="flex gap-2">
            {redCrystalTimer > 0 && (
              <div className="px-3 py-1 bg-red-950/80 border border-red-500/80 text-red-400 text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                RED CRYSTAL (+10% DMG): {Math.ceil(redCrystalTimer)}s
              </div>
            )}
            {greenCrystalTimer > 0 && (
              <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/80 text-emerald-400 text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                GREEN CRYSTAL (+50% SPEED BOOST): {Math.ceil(greenCrystalTimer)}s
              </div>
            )}
          </div>

          {storm?.isShrinking && (
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/50 text-rose-500 text-[10px] font-bold tracking-[0.2em] animate-pulse">
              WARNING: CYBER STORM CLOSING IN
            </div>
          )}
          {localPlayer.isEliminated && (
            <div className="px-6 py-3 bg-rose-500/20 border border-rose-500 text-rose-400 text-sm font-bold tracking-[0.2em] animate-bounce">
              OPERATOR ELIMINATED - SPECTATING
            </div>
          )}
        </div>

        {/* BOTTOM RIGHT: GEOMETRIC CHARGE / AMMO HUD */}
        <div className="flex flex-col items-end gap-2 bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <span className="text-xs text-cyan-400 mb-1 font-bold">CHARGE</span>
            <span className={`text-4xl font-black ${currentAmmo === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {isReloading ? 'RECHARGING' : currentAmmo}
            </span>
            <span className="text-xl text-slate-500">/ {maxAmmo}</span>
          </div>

          {/* SEGMENTED AMMO BARS */}
          <div className="flex gap-1 justify-end">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = idx < activeAmmoBars;
              return (
                <div
                  key={idx}
                  className={`h-1.5 w-6 transition-all ${
                    isFilled ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">
            {weaponConfig.name.toUpperCase()} | PRESS R TO RECHARGE
          </div>
        </div>
      </div>

      {/* CHAT LOG & INPUT OVERLAY */}
      <div className="absolute bottom-28 left-6 flex max-w-xs flex-col gap-2">
        <div className="flex max-h-36 flex-col gap-1 overflow-y-auto bg-slate-950/80 border border-slate-800 p-2 text-xs backdrop-blur-sm">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="leading-relaxed">
              <span className="font-bold text-cyan-400">{msg.senderName}:</span>{' '}
              <span className="text-slate-200">{msg.text}</span>
            </div>
          ))}
        </div>

        {showChatBox ? (
          <form onSubmit={handleChatSubmit} className="pointer-events-auto flex gap-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              autoFocus
              className="w-full border border-cyan-400/50 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowChatBox(true)}
            className="pointer-events-auto self-start border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400 hover:text-cyan-400"
          >
            Press Enter to Chat
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30" />
    </div>
  );
};

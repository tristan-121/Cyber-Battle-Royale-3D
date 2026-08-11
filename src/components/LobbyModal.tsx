import React from 'react';
import { MapId, Team, WeaponType } from '../types';
import { MAP_CONFIGS } from '../game/MapConfigs';
import { WEAPON_CONFIGS } from '../game/WeaponConfigs';
import { Play, Users, Crosshair, Shield, Zap, Radio, Target } from 'lucide-react';

interface LobbyModalProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;
  selectedMap: MapId;
  setSelectedMap: (map: MapId) => void;
  selectedWeapon: WeaponType;
  setSelectedWeapon: (weapon: WeaponType) => void;
  onJoinMatch: () => void;
  onOpenLoadout: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  playerName,
  setPlayerName,
  selectedTeam,
  setSelectedTeam,
  selectedMap,
  setSelectedMap,
  selectedWeapon,
  setSelectedWeapon,
  onJoinMatch,
  onOpenLoadout,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-xl font-mono">
      {/* Background Subtle Tech Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex w-full max-w-4xl flex-col gap-8 border-l-4 border-cyan-400 border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
        {/* HEADER BRANDING */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-bold text-xl">
              01
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider text-white">CYBER BATTLE ROYALE</h1>
              <p className="text-xs font-bold text-cyan-400 tracking-widest">
                SURVIVAL SECTOR 4B | LAST OPERATIVE STANDING
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ARENA GRID ONLINE (12 OPERATORS)</span>
          </div>
        </div>

        {/* MAIN CONFIGURATION GRID */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* LEFT COLUMN: CALLSIGN & DEPLOYMENT PROTOCOL */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                OPERATIVE CALLSIGN
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                placeholder="VALKYRIE_X"
                className="w-full border border-slate-700 bg-slate-950 px-4 py-3.5 text-base font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>

            {/* DEPLOYMENT MODE */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">DEPLOYMENT & TEAM MODE</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTeam('ffa')}
                  className={`flex flex-col items-center justify-center border p-3.5 transition-all ${
                    selectedTeam === 'ffa'
                      ? 'border-cyan-400 bg-cyan-400/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <Target className="h-5 w-5 text-cyan-400" />
                  <span className="mt-1.5 text-[11px] font-black uppercase tracking-wider">SOLO FFA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeam('red')}
                  className={`flex flex-col items-center justify-center border p-3.5 transition-all ${
                    selectedTeam === 'red'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <Users className="h-5 w-5 text-rose-500" />
                  <span className="mt-1.5 text-[11px] font-black uppercase tracking-wider">5v5 RED TEAM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeam('blue')}
                  className={`flex flex-col items-center justify-center border p-3.5 transition-all ${
                    selectedTeam === 'blue'
                      ? 'border-sky-400 bg-sky-400/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <Users className="h-5 w-5 text-sky-400" />
                  <span className="mt-1.5 text-[11px] font-black uppercase tracking-wider">5v5 BLUE TEAM</span>
                </button>
              </div>
            </div>

            {/* PRIMARY WEAPON SPECIFICATION */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">PRIMARY BLASTER</label>
                <button
                  onClick={onOpenLoadout}
                  className="text-xs font-bold text-cyan-400 hover:underline"
                >
                  ARMORY CONFIG
                </button>
              </div>

              <div className="flex items-center justify-between border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400">
                    <Crosshair className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{WEAPON_CONFIGS[selectedWeapon].name}</h4>
                    <p className="text-xs text-slate-400">{WEAPON_CONFIGS[selectedWeapon].description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MAP ARENA SELECTION */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">TARGET ARENA SECTOR</label>
              <div className="flex flex-col gap-2.5">
                {(Object.keys(MAP_CONFIGS) as MapId[]).map((mapId) => {
                  const m = MAP_CONFIGS[mapId];
                  const isSelected = selectedMap === mapId;
                  return (
                    <div
                      key={mapId}
                      onClick={() => setSelectedMap(mapId)}
                      className={`cursor-pointer border p-4 transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{m.name}</h3>
                        <span className="text-[10px] font-bold uppercase text-cyan-400">
                          {m.size.width}x{m.size.length} ARENA GRID
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{m.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONTROLS GUIDE */}
            <div className="border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400 leading-relaxed">
              <span className="font-bold text-cyan-400">COMBAT CONTROLS:</span> Mouse Look | WASD Move | Left Click Fire | Right Click Zoom | R Reload | 1-6 Weapons | <span className="text-amber-300 font-bold">Shift+2 Handgun</span> | <span className="text-emerald-400 font-bold">Hold Shift + G-O-D God Mode</span>
            </div>
          </div>
        </div>

        {/* ENTER BATTLE ROYALE BUTTON */}
        <button
          type="button"
          onClick={onJoinMatch}
          disabled={!playerName.trim()}
          className="flex w-full items-center justify-center gap-3 bg-cyan-400 py-4 text-base font-black uppercase tracking-widest text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_#22d3ee] transition-all disabled:opacity-50"
        >
          <Play className="h-5 w-5 fill-slate-950" />
          <span>ENTER BATTLE ROYALE ARENA</span>
        </button>
      </div>
    </div>
  );
};

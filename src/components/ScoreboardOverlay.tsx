import React from 'react';
import { Player } from '../types';
import { Shield, Radio, Trophy } from 'lucide-react';

interface ScoreboardOverlayProps {
  players: Player[];
  aliveCount: number;
  totalPlayers: number;
  matchTimer: number;
  mapName: string;
}

export const ScoreboardOverlay: React.FC<ScoreboardOverlayProps> = ({
  players,
  aliveCount,
  totalPlayers,
  matchTimer,
  mapName,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.kills - a.kills);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md font-mono text-white">
      {/* Background Subtle Tech Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex w-full max-w-3xl flex-col gap-6 border-l-4 border-cyan-400 border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-bold">
              01
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-white">OPERATIVE TACTICAL LEADERBOARD</h2>
              <p className="text-xs text-cyan-400 font-semibold">{mapName} | {formatTimer(matchTimer)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono font-bold text-xs bg-slate-950 px-4 py-2 border border-slate-800">
            <span className="text-cyan-400">SURVIVORS: {aliveCount} / {totalPlayers}</span>
          </div>
        </div>

        {/* PLAYER TABLE */}
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          <div className="grid grid-cols-12 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="col-span-1">RANK</span>
            <span className="col-span-5">OPERATIVE</span>
            <span className="col-span-2 text-center">ELIMINATIONS</span>
            <span className="col-span-2 text-center">FALLS</span>
            <span className="col-span-2 text-right">STATUS</span>
          </div>

          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`grid grid-cols-12 items-center border p-3 text-xs font-semibold transition-all ${
                p.isEliminated
                  ? 'border-slate-800 bg-slate-950/60 text-slate-500 line-through'
                  : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
              }`}
            >
              <span className="col-span-1 font-bold text-slate-400">#{idx + 1}</span>
              <div className="col-span-5 flex items-center gap-2">
                <span className="font-bold text-white">{p.name}</span>
                {p.isBot && <span className="bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">BOT</span>}
              </div>
              <span className="col-span-2 text-center font-bold text-cyan-400">{p.kills}</span>
              <span className="col-span-2 text-center text-slate-400">{p.deaths}</span>
              <span className="col-span-2 text-right font-bold">
                {p.isEliminated ? (
                  <span className="text-rose-500">ELIMINATED</span>
                ) : (
                  <span className="text-emerald-400">ACTIVE</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

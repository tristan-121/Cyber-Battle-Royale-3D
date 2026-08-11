import React from 'react';
import { Player } from '../types';
import { Trophy, RefreshCw, Skull } from 'lucide-react';

interface GameOverModalProps {
  winnerPlayerName?: string;
  isVictory: boolean;
  localPlayer: Player;
  players: Player[];
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerPlayerName,
  isVictory,
  localPlayer,
  players,
  onPlayAgain,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.kills - a.kills);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-xl font-mono text-white">
      {/* Background Subtle Tech Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex w-full max-w-xl flex-col items-center gap-6 border-l-4 border-cyan-400 border border-slate-800 bg-slate-900/95 p-8 text-center shadow-2xl">
        {/* HEADER BADGE */}
        <div className="flex h-16 w-16 items-center justify-center bg-cyan-400/20 border border-cyan-400 text-cyan-400">
          {isVictory ? <Trophy className="h-8 w-8 text-cyan-400" /> : <Skull className="h-8 w-8 text-rose-500" />}
        </div>

        {/* TITLE & RESULT */}
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-white">
            {isVictory ? 'VICTORY ROYALE' : 'SESSION CONCLUDED'}
          </h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
            {isVictory ? 'LAST OPERATIVE STANDING ON SECTOR 4B' : `VICTOR: ${winnerPlayerName || 'UNKNOWN'}`}
          </p>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid w-full grid-cols-3 gap-3 border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-cyan-400">{localPlayer?.kills || 0}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ELIMINATIONS</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-2xl font-black text-white">{localPlayer?.deaths || 0}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">FALLS</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-rose-500">
              {!localPlayer || localPlayer.deaths === 0
                ? localPlayer?.kills || 0
                : (localPlayer.kills / localPlayer.deaths).toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">K/D RATIO</span>
          </div>
        </div>

        {/* LEADERBOARD TABLE */}
        <div className="w-full flex flex-col gap-1 border border-slate-800 bg-slate-950 p-3 max-h-48 overflow-y-auto">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-800">
            <span>OPERATIVE</span>
            <span>ELIMINATIONS</span>
          </div>
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`flex justify-between text-xs py-1 px-2 ${
                p.id === localPlayer?.id ? 'bg-cyan-400/20 text-cyan-400 font-bold border-l-2 border-cyan-400' : 'text-slate-300'
              }`}
            >
              <span>#{idx + 1} {p.name}</span>
              <span className="font-bold">{p.kills} KILLS</span>
            </div>
          ))}
        </div>

        {/* RESTART BUTTON */}
        <button
          onClick={onPlayAgain}
          className="flex w-full items-center justify-center gap-3 bg-cyan-400 py-4 text-base font-black uppercase tracking-widest text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_#22d3ee] transition-all"
        >
          <RefreshCw className="h-5 w-5" />
          <span>RE-ENTER ARENA MATCH</span>
        </button>
      </div>
    </div>
  );
};

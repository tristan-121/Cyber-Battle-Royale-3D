import React from 'react';
import { Play, LogOut, Zap, Crosshair, Shield, Eye } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onQuitToLobby: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onQuitToLobby }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg border border-cyan-500/40 bg-slate-900/90 p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 relative">
        {/* Glowing Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-rose-500" />

        {/* Title & Status */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <span className="font-mono text-xl font-black">||</span>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-wider uppercase text-white">GAME PAUSED</h2>
              <p className="text-xs text-cyan-400/80 font-mono tracking-widest uppercase">TACTICAL FREEZE ACTIVE</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            PRESS [P] TO UNPAUSE
          </div>
        </div>

        {/* CONTROLS CHEATSHEET */}
        <div className="my-6 space-y-3 font-mono text-xs text-slate-300 bg-slate-950/80 p-4 border border-slate-800">
          <div className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> COMBAT & OPERATOR CONTROLS
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
            <div><span className="text-slate-200 font-bold">WASD:</span> Move / Strafe</div>
            <div><span className="text-slate-200 font-bold">Left Click:</span> Fire Blaster</div>
            <div><span className="text-slate-200 font-bold">Right Click:</span> Scope / Zoom</div>
            <div><span className="text-slate-200 font-bold">R Key:</span> Recharge Battery</div>
            <div><span className="text-slate-200 font-bold">Shift + 2:</span> Emergency Handgun</div>
            <div><span className="text-slate-200 font-bold">Tab:</span> Match Scoreboard</div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-2">
              <Zap className="h-4 w-4" /> DEV GOD MODE & FLIGHT
            </div>
            <div className="pt-1 text-slate-400 leading-relaxed">
              <span className="text-amber-300 font-bold">Hold Shift + G-O-D:</span> Toggle Flying God Mode
              <div className="text-[10px] text-amber-200/80 mt-1">
                • <span className="font-bold text-white">WASD:</span> 3D Free Flight &nbsp;|&nbsp; 
                • <span className="font-bold text-white">SPACE:</span> Ascend &nbsp;|&nbsp; 
                • <span className="font-bold text-white">CTRL / C / E:</span> Descend
              </div>
            </div>
          </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Play className="h-5 w-5 fill-slate-950" /> RESUME GAME (PRESS P)
          </button>

          <button
            type="button"
            onClick={onQuitToLobby}
            className="flex items-center justify-center gap-2 border border-slate-800 bg-slate-950/90 px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:border-rose-500/50 hover:text-rose-400 transition-all"
          >
            <LogOut className="h-4 w-4" /> LEAVE MATCH & RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { WeaponType } from '../types';

interface ScopeOverlayProps {
  weaponType: WeaponType;
  hitmarkerActive: boolean;
  isHeadshotHit: boolean;
}

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({ weaponType, hitmarkerActive, isHeadshotHit }) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center font-mono z-20">
      {/* 1. PULSE RIFLE: TACTICAL HOLOGRAPHIC GRID SCOPE */}
      {weaponType === 'pulse' && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/20 backdrop-blur-[1px]">
          {/* Cyan Scanlines & Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(6,182,212,0.15)_80%,rgba(8,51,68,0.6)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

          {/* Tactical Corner Brackets */}
          <div className="absolute w-[80vw] h-[75vh] max-w-4xl max-h-[600px] border border-cyan-500/30 flex justify-between p-4">
            <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
            <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />
          </div>

          {/* Central Target Reticle & Telemetry */}
          <div className="relative flex items-center justify-center">
            {/* Outer Rotating Diamond Ring */}
            <div className="w-64 h-64 border border-cyan-400/40 rotate-45 flex items-center justify-center animate-[spin_30s_linear_infinite]">
              <div className="w-48 h-48 border border-cyan-400/60" />
            </div>

            {/* Inner Precision Grid Circle */}
            <div className="absolute w-40 h-40 border-2 border-cyan-400/80 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <div className={`w-2 h-2 ${hitmarkerActive ? 'bg-rose-500 scale-150' : 'bg-cyan-400'} shadow-[0_0_10px_#22d3ee]`} />
            </div>

            {/* Crosshair Lines */}
            <div className="absolute w-72 h-[1px] bg-cyan-400/70" />
            <div className="absolute h-72 w-[1px] bg-cyan-400/70" />

            {/* Range & Lock Telemetry Readouts */}
            <div className="absolute top-12 left-20 bg-cyan-950/80 border border-cyan-500/50 px-2 py-1 text-[10px] text-cyan-300 font-bold tracking-widest backdrop-blur-sm">
              DST: 142M | LOCK: AUTO
            </div>
            <div className="absolute bottom-12 right-20 bg-cyan-950/80 border border-cyan-500/50 px-2 py-1 text-[10px] text-cyan-300 font-bold tracking-widest backdrop-blur-sm">
              PULSE BEAM 1.6X | SYS: OK
            </div>
          </div>
        </div>
      )}

      {/* 2. RAILGUN: HIGH-TECH CRIMSON ACCELERATOR RING */}
      {weaponType === 'rail' && (
        <div className="absolute inset-0 flex items-center justify-center bg-rose-950/20 backdrop-blur-[1px]">
          {/* Crimson Radial Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(255,0,85,0.18)_75%,rgba(88,28,135,0.7)_100%)] pointer-events-none" />

          {/* Charging Outer Concentric Crimson Rings */}
          <div className="relative flex items-center justify-center">
            <div className="w-80 h-80 border-2 border-rose-500/60 rounded-full border-dashed animate-[spin_20s_linear_infinite] flex items-center justify-center" />
            <div className="absolute w-60 h-60 border-2 border-pink-500/80 rounded-full border-t-transparent border-b-transparent animate-[spin_10s_linear_infinite_reverse]" />

            {/* Central Precision Target Core */}
            <div className="absolute w-24 h-24 border border-rose-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,0,85,0.6)]">
              <div className={`w-2.5 h-2.5 rounded-full ${hitmarkerActive ? 'bg-amber-400 scale-150' : 'bg-rose-500'} shadow-[0_0_12px_#ff0055]`} />
            </div>

            {/* Velocity Vectors Chevron Arrows */}
            <div className="absolute -top-16 text-rose-300 text-[10px] font-bold tracking-widest bg-rose-950/90 border border-rose-500/80 px-3 py-1 shadow-[0_0_10px_rgba(255,0,85,0.4)]">
              MAGNETIC ACCELERATOR: READY [2.1X]
            </div>
            <div className="absolute -bottom-16 text-pink-300 text-[10px] font-bold tracking-widest bg-rose-950/90 border border-rose-500/80 px-3 py-1">
              OUTPUT: 12.5 GIGAWATTS | CRIMSON RAIL: 0.50 NV
            </div>

            {/* Crosshair Ticks */}
            <div className="absolute w-48 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="absolute h-48 w-[2px] bg-gradient-to-b from-transparent via-rose-500 to-transparent" />
          </div>
        </div>
      )}

      {/* 3. TRI-SCATTER LASER: WIDE-ANGLE TACTICAL SPREAD SCOPE */}
      {weaponType === 'scatter' && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/20 backdrop-blur-[1px]">
          {/* Emerald Green Radial Lens Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(16,185,129,0.18)_80%,rgba(6,78,59,0.65)_100%)] pointer-events-none" />

          <div className="relative flex items-center justify-center">
            {/* Triangular Spread Alignment Reticle */}
            <svg className="w-80 h-80 text-emerald-400/80 animate-pulse" viewBox="0 0 200 200" fill="none">
              <polygon points="100,30 40,150 160,150" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="100" cy="30" r="6" fill="#10b981" />
              <circle cx="40" cy="150" r="6" fill="#10b981" />
              <circle cx="160" cy="150" r="6" fill="#10b981" />
              <circle cx="100" cy="110" r="30" stroke="currentColor" strokeWidth="2" />
            </svg>

            {/* Central Precision Dot */}
            <div className={`absolute w-3 h-3 rounded-full ${hitmarkerActive ? 'bg-rose-500 scale-150' : 'bg-emerald-400'} shadow-[0_0_12px_#10b981]`} />

            {/* Spread Angle Telemetry Readout */}
            <div className="absolute top-6 bg-emerald-950/90 border border-emerald-500/80 px-3 py-1 text-[10px] text-emerald-300 font-bold tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              TRI-BEAM DISPERSION: 12° SPREAD
            </div>
            <div className="absolute bottom-6 bg-emerald-950/90 border border-emerald-500/80 px-3 py-1 text-[10px] text-emerald-300 font-bold tracking-widest">
              WIDE TACTICAL OVERLAY [1.45X]
            </div>
          </div>
        </div>
      )}

      {/* 4. PRECISE BEAM SNIPER: HIGH-MAGNIFICATION SNIPER CROSSHAIR & LENS VIGNETTE */}
      {weaponType === 'sniper' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          {/* Heavy Sniper Scope Circular Cutout Mask */}
          <div className="relative w-[85vh] h-[85vh] max-w-[700px] max-h-[700px] rounded-full border-4 border-red-900/80 shadow-[0_0_100px_rgba(0,0,0,0.95)] overflow-hidden bg-[radial-gradient(circle_at_center,transparent_40%,rgba(153,27,27,0.25)_80%,rgba(0,0,0,0.95)_100%)] flex items-center justify-center">

            {/* Outer Scope Ring Hash Ticks */}
            <div className="absolute inset-2 rounded-full border border-red-500/30 border-dashed animate-[spin_60s_linear_infinite]" />

            {/* Crimson Precision Crosshairs extending across entire scope */}
            <div className="absolute w-full h-[1px] bg-red-500/80 shadow-[0_0_8px_#ef4444]" />
            <div className="absolute h-full w-[1px] bg-red-500/80 shadow-[0_0_8px_#ef4444]" />

            {/* Ballistic Mil-Dots Down Center Vertical Line */}
            <div className="absolute flex flex-col gap-5 items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444]" />
                  <span className="text-[8px] text-red-400/80 font-bold font-mono">-{i * 10}M</span>
                </div>
              ))}
            </div>

            {/* Central Precision Target Red Circle */}
            <div className="absolute w-12 h-12 border border-red-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.6)]">
              <div className={`w-2 h-2 rounded-full ${hitmarkerActive ? 'bg-amber-400 scale-150' : 'bg-red-500'} shadow-[0_0_10px_#ef4444]`} />
            </div>

            {/* Sniper Scope Digital Telemetry */}
            <div className="absolute top-10 left-12 bg-red-950/80 border border-red-600/80 px-2.5 py-1 text-[10px] text-red-300 font-bold tracking-widest backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              MAG: 4.0X | DIST: 320M
            </div>
            <div className="absolute bottom-10 right-12 bg-red-950/80 border border-red-600/80 px-2.5 py-1 text-[10px] text-red-300 font-bold tracking-widest backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              HIGH VOLTAGE BEAM: CHARGED
            </div>
          </div>
        </div>
      )}

      {/* 5. AUTO LASER CANNON: RAPID-FIRE THERMAL TARGETING RETICLE */}
      {weaponType === 'cannon' && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/20 backdrop-blur-[1px]">
          {/* Thermal Amber/Magenta Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(245,158,11,0.15)_75%,rgba(120,53,15,0.7)_100%)] pointer-events-none" />

          {/* Octagonal Frame */}
          <div className="relative flex items-center justify-center">
            <div className="w-72 h-72 border-2 border-amber-500/70 rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <div className="w-56 h-56 border border-amber-400/50" />
            </div>

            {/* Rapid Fire Dynamic Reticle Brackets */}
            <div className="absolute w-36 h-36 border-2 border-amber-400 rounded-lg flex items-center justify-center animate-pulse">
              <div className={`w-2.5 h-2.5 ${hitmarkerActive ? 'bg-rose-500 scale-150' : 'bg-amber-400'} shadow-[0_0_10px_#f59e0b]`} />
            </div>

            {/* Thermal / Heat Diagnostics */}
            <div className="absolute -top-14 bg-amber-950/90 border border-amber-500/80 px-3 py-1 text-[10px] text-amber-300 font-bold tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              AUTO-CANNON THERMAL HUD [1.67X]
            </div>
            <div className="absolute -bottom-14 bg-amber-950/90 border border-amber-500/80 px-3 py-1 text-[10px] text-amber-300 font-bold tracking-widest">
              HEAT: NOMINAL | RATE: 10 RPS
            </div>
          </div>
        </div>
      )}

      {/* 6. VIPER CYBER-SMG: HIGH-SPEED TACTICAL MICRO-DOT REFLEX SCOPE */}
      {weaponType === 'smg' && (
        <div className="absolute inset-0 flex items-center justify-center bg-fuchsia-950/20 backdrop-blur-[1px]">
          {/* Neon Pink/Fuchsia Holographic Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(217,70,239,0.18)_75%,rgba(112,26,117,0.7)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(240,171,252,0.06)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

          {/* Micro-Dot Diamond Frame */}
          <div className="relative flex items-center justify-center">
            {/* Outer Rapid Tracking Circle */}
            <div className="w-64 h-64 border-2 border-fuchsia-400/80 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.5)] border-dashed animate-[spin_15s_linear_infinite]" />

            {/* Precision Micro-Dot Diamond Reticle */}
            <div className="absolute w-28 h-28 border-2 border-pink-400 rotate-45 flex items-center justify-center">
              <div className="w-16 h-16 border border-fuchsia-300/60" />
            </div>

            {/* Central High-RPM Sight Dot */}
            <div className={`absolute w-3 h-3 rounded-full ${hitmarkerActive ? 'bg-amber-400 scale-150' : 'bg-fuchsia-400'} shadow-[0_0_12px_#f0abfc]`} />

            {/* Crosshair Bracket Lines */}
            <div className="absolute w-52 h-[1px] bg-fuchsia-400/80" />
            <div className="absolute h-52 w-[1px] bg-fuchsia-400/80" />

            {/* RPM Cycle Telemetry */}
            <div className="absolute -top-14 bg-fuchsia-950/90 border border-fuchsia-500/80 px-3 py-1 text-[10px] text-fuchsia-300 font-bold tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.3)]">
              VIPER SMG REFLEX [1.55X] | 12.5 RPS CONTINUOUS
            </div>
            <div className="absolute -bottom-14 bg-fuchsia-950/90 border border-fuchsia-500/80 px-3 py-1 text-[10px] text-fuchsia-300 font-bold tracking-widest">
              BATTERY: 100 CELL ULTRA-CAPACITOR
            </div>
          </div>
        </div>
      )}

      {/* Hitmarker Critical Feedback Text */}
      {hitmarkerActive && (
        <div className="absolute bottom-24 text-[11px] text-rose-500 font-black tracking-widest animate-ping bg-rose-950/90 border border-rose-500 px-4 py-1.5 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
          {isHeadshotHit ? 'CRITICAL HEADSHOT HIT!' : 'TARGET HIT!'}
        </div>
      )}
    </div>
  );
};

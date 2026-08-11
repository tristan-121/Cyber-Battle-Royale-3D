import React from 'react';
import { WeaponType } from '../types';
import { WEAPON_CONFIGS } from '../game/WeaponConfigs';
import { Zap, ArrowLeft, Check } from 'lucide-react';

interface LoadoutModalProps {
  selectedWeapon: WeaponType;
  setSelectedWeapon: (weapon: WeaponType) => void;
  onClose: () => void;
}

export const LoadoutModal: React.FC<LoadoutModalProps> = ({
  selectedWeapon,
  setSelectedWeapon,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-xl font-mono text-white">
      {/* Background Subtle Tech Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex w-full max-w-4xl flex-col gap-6 border-l-4 border-cyan-400 border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-white">CYBER ARMORY SPECIFICATIONS</h2>
              <p className="text-xs text-cyan-400 font-bold tracking-widest">
                SELECT PRIMARY ENERGY WEAPON PROTOCOL
              </p>
            </div>
          </div>
        </div>

        {/* BLASTER GRID */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(WEAPON_CONFIGS) as WeaponType[])
            .filter((wKey) => wKey !== 'handgun')
            .map((wKey) => {
              const config = WEAPON_CONFIGS[wKey];
            const isSelected = selectedWeapon === wKey;

            return (
              <div
                key={wKey}
                onClick={() => setSelectedWeapon(wKey)}
                className={`cursor-pointer border p-5 transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-400/15 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ color: config.beamColor }}
                      className="flex h-10 w-10 items-center justify-center bg-slate-900 border border-slate-800"
                    >
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{config.name}</h3>
                      <p className="text-xs text-slate-400">{config.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center bg-cyan-400 text-slate-950 font-bold">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* STATS BARS */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">BEAM DAMAGE</span>
                    <span className="text-cyan-400 font-mono font-bold">{config.damage} HP</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800">
                    <div
                      style={{ width: `${(config.damage / 90) * 100}%` }}
                      className="h-full bg-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">CHARGE CAPACITY</span>
                    <span className="text-cyan-400 font-mono font-bold">{config.batteryCapacity} SHOTS</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800">
                    <div
                      style={{ width: `${(config.batteryCapacity / 100) * 100}%` }}
                      className="h-full bg-sky-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={onClose}
          className="mt-2 w-full bg-cyan-400 py-3.5 text-base font-black uppercase tracking-widest text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_#22d3ee] transition-all"
        >
          CONFIRM WEAPON SPECIFICATION
        </button>
      </div>
    </div>
  );
};

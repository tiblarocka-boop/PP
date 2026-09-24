import React, { useEffect, useState } from 'react';
import { LimiterSettings } from '../types/audio';
import { audioEngine } from '../utils/audioEngine';
import { ShieldCheck, ShieldAlert, Zap, Sliders, Activity } from 'lucide-react';
import { Knob } from './Knob';

interface LimiterViewProps {
  limiter: LimiterSettings;
  onLimiterChange: (settings: Partial<LimiterSettings>) => void;
}

export const LimiterView: React.FC<LimiterViewProps> = ({ limiter, onLimiterChange }) => {
  const [gainReductionDb, setGainReductionDb] = useState(0);

  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      const red = audioEngine.getGainReduction(); // typically negative number in dB, e.g. -4 dB
      setGainReductionDb(red);
      animId = requestAnimationFrame(updateMeter);
    };
    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, []);

  const presets = [
    {
      name: 'Anti-Clip Master',
      desc: 'Clean peak limiting to prevent digital distortion',
      settings: { threshold: -1.5, ratio: 16, attack: 0.003, release: 0.1, knee: 6 },
    },
    {
      name: 'Bass Heavy Protect',
      desc: 'Controls massive 31-100Hz boosts without pumping',
      settings: { threshold: -5.0, ratio: 12, attack: 0.008, release: 0.18, knee: 12 },
    },
    {
      name: 'Punchy EDM Glue',
      desc: 'Tight transients and maximum perceived loudness',
      settings: { threshold: -8.0, ratio: 6, attack: 0.02, release: 0.12, knee: 18 },
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header card with toggle & Gain Reduction meter */}
      <div className="rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {limiter.enabled ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <h3 className="font-audiophile text-xs font-bold tracking-wider text-slate-200">
              POWERAMP COMPRESSOR &amp; LIMITER
            </h3>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onLimiterChange({ enabled: !limiter.enabled })}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              limiter.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                limiter.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {limiter.enabled ? 'ACTIVE' : 'BYPASS'}
          </button>
        </div>

        {/* Real-time Gain Reduction Meter */}
        <div className="mt-4 bg-slate-950/80 rounded-xl p-3 border border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Gain Reduction (GR)
            </span>
            <span className="font-num text-amber-400 font-bold">
              {gainReductionDb.toFixed(1)} dB
            </span>
          </div>

          <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex flex-row-reverse border border-slate-800">
            {/* Meter expands from right to left */}
            <div
              className="h-full bg-gradient-to-l from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75 rounded-full"
              style={{
                width: `${Math.min(100, Math.abs(gainReductionDb) * 5)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-num text-slate-500 mt-1">
            <span>-20 dB</span>
            <span>-10 dB</span>
            <span>-5 dB</span>
            <span>0 dB</span>
          </div>
        </div>

        {/* Knobs row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="flex flex-col items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
            <Knob
              value={limiter.threshold}
              min={-30}
              max={0}
              step={0.5}
              defaultValue={-3}
              label="THRESHOLD"
              unit="dB"
              glowColor="amber"
              onChange={(val) => onLimiterChange({ threshold: val })}
            />
          </div>

          <div className="flex flex-col items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
            <Knob
              value={limiter.ratio}
              min={1}
              max={20}
              step={1}
              defaultValue={12}
              label="RATIO"
              unit=":1"
              glowColor="cyan"
              onChange={(val) => onLimiterChange({ ratio: val })}
            />
          </div>

          <div className="flex flex-col items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
            <Knob
              value={Number((limiter.attack * 1000).toFixed(0))}
              min={1}
              max={100}
              step={1}
              defaultValue={3}
              label="ATTACK"
              unit="ms"
              glowColor="lime"
              onChange={(val) => onLimiterChange({ attack: val / 1000 })}
            />
          </div>

          <div className="flex flex-col items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
            <Knob
              value={Number((limiter.release * 1000).toFixed(0))}
              min={20}
              max={500}
              step={10}
              defaultValue={150}
              label="RELEASE"
              unit="ms"
              glowColor="blue"
              onChange={(val) => onLimiterChange({ release: val / 1000 })}
            />
          </div>
        </div>
      </div>

      {/* Limiter Presets Quick Selection */}
      <div className="rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-4 shadow-xl">
        <h4 className="font-audiophile text-xs font-bold tracking-wider text-slate-300 mb-2">
          LIMITER PROFILES
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => onLimiterChange(p.settings)}
              className="text-left p-3 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { Activity, ShieldCheck, Sparkles, Sliders, Radio } from 'lucide-react';

interface DspStatusBarProps {
  isBypassed: boolean;
  dvcEnabled: boolean;
  limiterActive: boolean;
  activeTab: string;
  onSelectTab: (tab: 'eq' | 'tone' | 'limiter' | 'presets' | 'stream') => void;
}

export const DspStatusBar: React.FC<DspStatusBarProps> = ({
  isBypassed,
  dvcEnabled,
  limiterActive,
  activeTab,
  onSelectTab,
}) => {
  const [leftMeter, setLeftMeter] = useState(0);
  const [rightMeter, setRightMeter] = useState(0);
  const [gainReduction, setGainReduction] = useState(0);

  useEffect(() => {
    let animId: number;
    const freqData = new Uint8Array(64);

    const updateMeters = () => {
      if (!isBypassed) {
        audioEngine.getByteFrequencyData(freqData);
        let maxVal = 0;
        for (let i = 0; i < 32; i++) {
          if (freqData[i] > maxVal) maxVal = freqData[i];
        }

        const level = Math.min(100, Math.round((maxVal / 255) * 110));
        setLeftMeter(level);
        setRightMeter(Math.max(0, Math.min(100, Math.round(level * (0.92 + Math.random() * 0.15)))));

        // Estimate limiter gain reduction if signal is near peak
        if (level > 88) {
          setGainReduction(parseFloat(((level - 88) * 0.25).toFixed(1)));
        } else {
          setGainReduction(0);
        }
      } else {
        setLeftMeter(0);
        setRightMeter(0);
        setGainReduction(0);
      }
      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, [isBypassed]);

  return (
    <div className="w-full bg-[#080b12]/95 backdrop-blur-md border-t border-slate-800/90 px-2.5 py-1.5 flex flex-col gap-1.5 shadow-2xl">
      {/* Top DSP Row: Live Stereo VU Meters & Gain Reduction */}
      <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
        {/* Left / Right Stereo VU meters */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-[9px] font-bold text-slate-400">L</span>
          <div className="flex-1 h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                leftMeter > 90
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : leftMeter > 75
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${leftMeter}%` }}
            />
          </div>

          <span className="text-[9px] font-bold text-slate-400">R</span>
          <div className="flex-1 h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                rightMeter > 90
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : rightMeter > 75
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${rightMeter}%` }}
            />
          </div>
        </div>

        {/* Limiter Gain Reduction readout */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500">GR:</span>
          <span
            className={`font-bold font-num ${
              gainReduction > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            -{gainReduction.toFixed(1)} dB
          </span>
        </div>

        {/* DSP Status Indicator */}
        <div className="hidden xs:flex items-center gap-1.5 text-slate-400 shrink-0">
          <Activity
            className={`w-3 h-3 ${
              !isBypassed ? 'text-cyan-400 animate-pulse' : 'text-slate-600'
            }`}
          />
          <span className="text-[9px] font-semibold">
            {!isBypassed ? (dvcEnabled ? 'DVC 48kHz' : 'DSP 48kHz') : 'BYPASSED'}
          </span>
        </div>
      </div>

      {/* Bottom Sub-Navigation Tabs: 5 Essential Modules */}
      <div className="grid grid-cols-5 gap-1 p-0.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <button
          onClick={() => onSelectTab('eq')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'eq'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span className="truncate">EQ</span>
        </button>

        <button
          onClick={() => onSelectTab('tone')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'tone'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span className="truncate">TONE</span>
        </button>

        <button
          onClick={() => onSelectTab('limiter')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'limiter'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span className="truncate">LIMIT</span>
        </button>

        <button
          onClick={() => onSelectTab('presets')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'presets'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold text-cyan-400">P</span>
          <span className="truncate">PRESETS</span>
        </button>

        <button
          onClick={() => onSelectTab('stream')}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'stream'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3 h-3 text-cyan-400" />
          <span className="truncate">AUDIO</span>
        </button>
      </div>
    </div>
  );
};

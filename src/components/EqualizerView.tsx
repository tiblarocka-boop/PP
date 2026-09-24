import React from 'react';
import { EQBand, EQMode, ToneSettings } from '../types/audio';
import { Knob } from './Knob';
import { RotateCcw, ArrowUpDown, SlidersHorizontal, Sliders } from 'lucide-react';

interface EqualizerViewProps {
  bands: EQBand[];
  mode: EQMode;
  preamp: number;
  tone: ToneSettings;
  onPreampChange: (db: number) => void;
  onToneChange: (settings: Partial<ToneSettings>) => void;
  onBandGainChange: (index: number, gain: number) => void;
  onModeChange: (mode: EQMode) => void;
  onResetBands: () => void;
  onInvertBands: () => void;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  bands,
  mode,
  preamp,
  tone,
  onPreampChange,
  onToneChange,
  onBandGainChange,
  onModeChange,
  onResetBands,
  onInvertBands,
}) => {
  const formatFreq = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full animate-in fade-in duration-200">
      {/* 1. Poweramp Signature Dual Tone Knobs & Preamp Block */}
      <div className="rounded-2xl bg-[#090d16] border border-slate-800/90 p-3 shadow-xl flex items-center justify-between gap-2">
        {/* Left: Bass Knob */}
        <div className="flex flex-col items-center flex-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <Knob
            value={tone.bassGain}
            min={-12}
            max={12}
            step={0.5}
            defaultValue={0}
            label="BASS"
            unit="dB"
            size={60}
            glowColor="cyan"
            onChange={(val) => onToneChange({ bassGain: val })}
          />
          {/* Freq shortcuts */}
          <div className="flex items-center gap-1 mt-1.5">
            {[60, 100, 150].map((f) => (
              <button
                key={f}
                onClick={() => onToneChange({ bassFreq: f })}
                className={`px-1.5 py-0.5 rounded text-[8px] font-num transition-colors ${
                  tone.bassFreq === f
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}Hz
              </button>
            ))}
          </div>
        </div>

        {/* Center: Preamp Vertical Slider */}
        <div className="flex flex-col items-center justify-between min-w-[62px] sm:min-w-[70px] bg-slate-950/80 rounded-xl p-2 border border-slate-800/80 h-32">
          <span className="text-[9px] font-audiophile font-bold tracking-wider text-amber-400">
            PREAMP
          </span>

          <div className="relative flex items-center justify-center h-20 my-0.5">
            <div className="absolute w-full h-[1px] bg-amber-500/30 left-0 right-0 pointer-events-none" />
            <input
              type="range"
              min={-15}
              max={15}
              step={0.5}
              value={preamp}
              onChange={(e) => onPreampChange(parseFloat(e.target.value))}
              onDoubleClick={() => onPreampChange(0)}
              className="fader-vertical h-20"
              style={{ accentColor: '#f59e0b' }}
              title="Preamp Volume (Double click for 0dB)"
            />
          </div>

          <span className="text-[10px] font-num font-bold text-amber-300">
            {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)}
            <span className="text-[8px] text-slate-500">dB</span>
          </span>
        </div>

        {/* Right: Treble Knob */}
        <div className="flex flex-col items-center flex-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          <Knob
            value={tone.trebleGain}
            min={-12}
            max={12}
            step={0.5}
            defaultValue={0}
            label="TREBLE"
            unit="dB"
            size={60}
            glowColor="lime"
            onChange={(val) => onToneChange({ trebleGain: val })}
          />
          {/* Freq shortcuts */}
          <div className="flex items-center gap-1 mt-1.5">
            {[8000, 10000, 14000].map((f) => (
              <button
                key={f}
                onClick={() => onToneChange({ trebleFreq: f })}
                className={`px-1.5 py-0.5 rounded text-[8px] font-num transition-colors ${
                  tone.trebleFreq === f
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f / 1000}k
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Band Count Selector & Quick Utility Actions */}
      <div className="flex items-center justify-between px-1">
        {/* Band Count Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => onModeChange('10')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              mode === '10'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            10 BANDS
          </button>
          <button
            onClick={() => onModeChange('16')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              mode === '16'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            16 BANDS
          </button>
          <button
            onClick={() => onModeChange('32')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              mode === '32'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            32 BANDS
          </button>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onInvertBands}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
            title="Invert current EQ curve"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Invert</span>
          </button>

          <button
            onClick={onResetBands}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
            title="Reset all bands to 0 dB"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Flat</span>
          </button>
        </div>
      </div>

      {/* 3. High-Precision Poweramp Equalizer Faders Deck */}
      <div className="relative rounded-2xl bg-[#080b12] border border-slate-800/90 p-3 shadow-2xl">
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {bands.map((band, idx) => (
            <div
              key={band.id}
              className="flex flex-col items-center justify-between min-w-[46px] sm:min-w-[50px] bg-slate-950/70 rounded-xl p-2 border border-slate-800/50 hover:border-cyan-500/40 transition-colors shrink-0 group"
            >
              {/* Frequency Label */}
              <span className="text-[10px] font-num font-bold text-slate-200">
                {formatFreq(band.frequency)}
              </span>

              {/* Gain Readout */}
              <span
                className={`text-[10px] font-num font-extrabold my-1 ${
                  band.gain > 0
                    ? 'text-cyan-400'
                    : band.gain < 0
                    ? 'text-rose-400'
                    : 'text-slate-500'
                }`}
              >
                {band.gain > 0 ? `+${band.gain.toFixed(1)}` : band.gain.toFixed(1)}
              </span>

              {/* Vertical Fader Slider with Calibrated Scale */}
              <div className="relative flex items-center justify-center h-48 my-1">
                {/* Center 0 dB guide line */}
                <div className="absolute w-full h-[1px] bg-cyan-500/30 left-0 right-0 pointer-events-none" />

                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={band.gain}
                  onChange={(e) => onBandGainChange(idx, parseFloat(e.target.value))}
                  onDoubleClick={() => onBandGainChange(idx, 0)}
                  className="fader-vertical h-44"
                  title={`${formatFreq(band.frequency)} Hz: ${band.gain} dB (Double tap for 0dB)`}
                />
              </div>

              {/* Double-tap to zero button */}
              <button
                onClick={() => onBandGainChange(idx, 0)}
                className="text-[9px] font-num text-slate-500 group-hover:text-cyan-400 px-1 py-0.5 rounded transition-colors"
                title="Reset this band to 0dB"
              >
                0dB
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

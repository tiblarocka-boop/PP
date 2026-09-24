import React from 'react';
import { EQBand, EQMode } from '../types/audio';
import { RotateCcw, Sliders, ArrowUpDown } from 'lucide-react';

interface EqualizerViewProps {
  bands: EQBand[];
  mode: EQMode;
  preamp: number;
  onPreampChange: (db: number) => void;
  onBandGainChange: (index: number, gain: number) => void;
  onModeChange: (mode: EQMode) => void;
  onResetBands: () => void;
  onInvertBands: () => void;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  bands,
  mode,
  preamp,
  onPreampChange,
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
    <div className="flex flex-col gap-3 w-full">
      {/* Equalizer Header / Mode Selector */}
      <div className="flex items-center justify-between px-1">
        {/* Band Count Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => onModeChange('10')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === '10'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            10 BANDS
          </button>
          <button
            onClick={() => onModeChange('16')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === '16'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            16 BANDS
          </button>
          <button
            onClick={() => onModeChange('32')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            title="Invert current EQ curve"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Invert</span>
          </button>

          <button
            onClick={onResetBands}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
            title="Reset all bands to flat (0 dB)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Flat</span>
          </button>
        </div>
      </div>

      {/* Main Bank of Sliders (Preamp + EQ Bands) */}
      <div className="relative rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-3 shadow-xl">
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {/* Preamp Column */}
          <div className="flex flex-col items-center justify-between min-w-[52px] sm:min-w-[60px] bg-slate-950/60 rounded-xl p-2 border border-slate-800/60 shrink-0">
            <span className="text-[10px] font-audiophile font-bold tracking-wider text-amber-400 uppercase">
              PREAMP
            </span>

            {/* Preamp dB readout */}
            <span className="text-[11px] font-num font-bold text-amber-300 my-1">
              {preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)}
              <span className="text-[9px] text-slate-500 font-normal">dB</span>
            </span>

            {/* Preamp Vertical Slider */}
            <div className="relative flex items-center justify-center h-44 my-1">
              {/* Center 0dB mark */}
              <div className="absolute w-full h-[1px] bg-amber-500/30 left-0 right-0 pointer-events-none" />

              <input
                type="range"
                min={-15}
                max={15}
                step={0.5}
                value={preamp}
                onChange={(e) => onPreampChange(parseFloat(e.target.value))}
                onDoubleClick={() => onPreampChange(0)}
                className="fader-vertical h-40"
                style={{
                  accentColor: '#f59e0b',
                }}
              />
            </div>

            <button
              onClick={() => onPreampChange(0)}
              className="text-[9px] text-slate-400 hover:text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
            >
              0 dB
            </button>
          </div>

          {/* Divider */}
          <div className="w-[1px] bg-slate-800/60 my-2 shrink-0" />

          {/* Frequency Bands Faders */}
          <div className="flex items-stretch gap-2.5 flex-1 overflow-x-auto min-w-0">
            {bands.map((band, idx) => (
              <div
                key={band.id}
                className="flex flex-col items-center justify-between min-w-[44px] sm:min-w-[48px] bg-slate-950/40 rounded-xl p-2 border border-slate-800/40 hover:border-cyan-500/30 transition-colors shrink-0 group"
              >
                {/* Frequency Label */}
                <span className="text-[10px] font-num font-semibold text-slate-300">
                  {formatFreq(band.frequency)}
                </span>

                {/* Gain Readout */}
                <span
                  className={`text-[10px] font-num font-bold my-1 ${
                    band.gain > 0
                      ? 'text-cyan-400'
                      : band.gain < 0
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {band.gain > 0 ? `+${band.gain.toFixed(1)}` : band.gain.toFixed(1)}
                </span>

                {/* Vertical Fader Slider */}
                <div className="relative flex items-center justify-center h-44 my-1">
                  {/* Center zero line */}
                  <div className="absolute w-full h-[1px] bg-cyan-500/20 left-0 right-0 pointer-events-none" />

                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={0.5}
                    value={band.gain}
                    onChange={(e) => onBandGainChange(idx, parseFloat(e.target.value))}
                    onDoubleClick={() => onBandGainChange(idx, 0)}
                    className="fader-vertical h-40"
                    title={`${formatFreq(band.frequency)} Hz: ${band.gain} dB (Double click for 0dB)`}
                  />
                </div>

                {/* Reset single band button */}
                <button
                  onClick={() => onBandGainChange(idx, 0)}
                  className="text-[9px] text-slate-500 group-hover:text-cyan-400 px-1 py-0.5 rounded transition-colors"
                >
                  0
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

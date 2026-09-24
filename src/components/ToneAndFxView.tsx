import React from 'react';
import { ToneSettings, SpatialSettings } from '../types/audio';
import { Knob } from './Knob';
import { Disc3, Volume2, Sparkles, SlidersHorizontal, Gauge } from 'lucide-react';

interface ToneAndFxViewProps {
  tone: ToneSettings;
  spatial: SpatialSettings;
  onToneChange: (settings: Partial<ToneSettings>) => void;
  onSpatialChange: (settings: Partial<SpatialSettings>) => void;
}

export const ToneAndFxView: React.FC<ToneAndFxViewProps> = ({
  tone,
  spatial,
  onToneChange,
  onSpatialChange,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Poweramp Signature Dual Tone Controls (Bass & Treble) */}
      <div className="rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-audiophile text-xs font-bold tracking-wider text-slate-200">
              TONE CONTROLS
            </h3>
          </div>
          <button
            onClick={() => onToneChange({ bassGain: 0, trebleGain: 0 })}
            className="text-[10px] font-semibold text-slate-400 hover:text-cyan-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            Reset Tone
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Bass Knob */}
          <div className="flex flex-col items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Knob
              value={tone.bassGain}
              min={-12}
              max={12}
              step={0.5}
              defaultValue={0}
              label="BASS"
              unit="dB"
              glowColor="cyan"
              onChange={(val) => onToneChange({ bassGain: val })}
            />

            {/* Corner Frequency Selector */}
            <div className="mt-3 flex items-center gap-1">
              <span className="text-[9px] text-slate-500 font-num">Freq:</span>
              {[60, 100, 150].map((f) => (
                <button
                  key={f}
                  onClick={() => onToneChange({ bassFreq: f })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-num transition-colors ${
                    tone.bassFreq === f
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}Hz
                </button>
              ))}
            </div>
          </div>

          {/* Treble Knob */}
          <div className="flex flex-col items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Knob
              value={tone.trebleGain}
              min={-12}
              max={12}
              step={0.5}
              defaultValue={0}
              label="TREBLE"
              unit="dB"
              glowColor="lime"
              onChange={(val) => onToneChange({ trebleGain: val })}
            />

            {/* Corner Frequency Selector */}
            <div className="mt-3 flex items-center gap-1">
              <span className="text-[9px] text-slate-500 font-num">Freq:</span>
              {[8000, 10000, 14000].map((f) => (
                <button
                  key={f}
                  onClick={() => onToneChange({ trebleFreq: f })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-num transition-colors ${
                    tone.trebleFreq === f
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f / 1000}k
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stereo Spatializer & Ambience */}
      <div className="rounded-2xl bg-[#0b0f19] border border-slate-800/80 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-audiophile text-xs font-bold tracking-wider text-slate-200">
              SPATIAL &amp; AMBIENCE
            </h3>
          </div>
          <button
            onClick={() => onSpatialChange({ stereoWidth: 1.0, reverbMix: 0.0, tempo: 1.0 })}
            className="text-[10px] font-semibold text-slate-400 hover:text-emerald-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            Reset FX
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Stereo Width Knob */}
          <div className="flex flex-col items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Knob
              value={Number((spatial.stereoWidth * 100).toFixed(0))}
              min={0}
              max={200}
              step={5}
              defaultValue={100}
              label="STEREO WIDTH"
              unit="%"
              glowColor="blue"
              onChange={(val) => onSpatialChange({ stereoWidth: val / 100 })}
            />
            <span className="text-[9px] text-slate-500 mt-2">
              {spatial.stereoWidth === 0
                ? 'Mono'
                : spatial.stereoWidth === 1
                ? 'Standard Stereo'
                : 'Wide Surround'}
            </span>
          </div>

          {/* Reverb Ambience Knob */}
          <div className="flex flex-col items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Knob
              value={Number((spatial.reverbMix * 100).toFixed(0))}
              min={0}
              max={100}
              step={2}
              defaultValue={0}
              label="AMBIENCE"
              unit="%"
              glowColor="amber"
              onChange={(val) => onSpatialChange({ reverbMix: val / 100 })}
            />
            <span className="text-[9px] text-slate-500 mt-2">
              {spatial.reverbMix === 0 ? 'Dry / Studio' : `${Math.round(spatial.reverbMix * 100)}% Room`}
            </span>
          </div>
        </div>

        {/* Speed / Tempo slider */}
        <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Tempo &amp; Speed
            </span>
            <span className="font-num text-cyan-300 font-semibold">
              {spatial.tempo.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={spatial.tempo}
            onChange={(e) => onSpatialChange({ tempo: parseFloat(e.target.value) })}
            className="fader-horizontal w-full"
          />
          <div className="flex justify-between text-[9px] font-num text-slate-500">
            <span>0.5x Slow</span>
            <button
              onClick={() => onSpatialChange({ tempo: 1.0 })}
              className="hover:text-cyan-400 underline decoration-dotted"
            >
              1.0x Normal
            </button>
            <span>1.5x Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
};

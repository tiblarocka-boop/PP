import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EQBand, VisualizerMode } from '../types/audio';
import { audioEngine } from '../utils/audioEngine';
import { getHarmanTargetDb } from '../utils/harmanCurve';
import { Eye, EyeOff, Activity, BarChart2, Target } from 'lucide-react';

interface FrequencyGraphProps {
  bands: EQBand[];
  isBypassed: boolean;
  visualizerMode: VisualizerMode;
  onBandGainChange: (index: number, gain: number) => void;
  onToggleVisualizerMode: () => void;
}

export const FrequencyGraph: React.FC<FrequencyGraphProps> = ({
  bands,
  isBypassed,
  visualizerMode,
  onBandGainChange,
  onToggleVisualizerMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBandIndex, setActiveBandIndex] = useState<number | null>(null);
  const [harmanTargetMode, setHarmanTargetMode] = useState<'off' | 'over-ear' | 'in-ear'>('over-ear');
  const animationFrameId = useRef<number | null>(null);

  // Peak levels for VU meter
  const [peakL, setPeakL] = useState(0);
  const [peakR, setPeakR] = useState(0);
  const [isClipping, setIsClipping] = useState(false);

  // Frequency range
  const minFreq = 20;
  const maxFreq = 20000;
  const minDb = -15;
  const maxDb = 15;

  const freqToX = useCallback((freq: number, width: number) => {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logF = Math.log10(Math.max(minFreq, Math.min(maxFreq, freq)));
    return ((logF - logMin) / (logMax - logMin)) * width;
  }, []);

  const dbToY = useCallback((db: number, height: number) => {
    const normalized = (db - minDb) / (maxDb - minDb);
    // 0 is top in canvas, so invert
    return height - normalized * height;
  }, []);

  const yToDb = useCallback((y: number, height: number) => {
    const normalized = (height - y) / height;
    const db = minDb + normalized * (maxDb - minDb);
    return Math.max(minDb, Math.min(maxDb, db));
  }, []);

  // Main Render loop (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer arrays for spectrum
    const freqData = new Uint8Array(1024);
    const timeData = new Uint8Array(1024);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Grid lines
      ctx.lineWidth = 1;

      // dB horizontal grid lines
      const dbTicks = [-12, -6, 0, 6, 12];
      dbTicks.forEach((db) => {
        const y = dbToY(db, height);
        ctx.strokeStyle = db === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash(db === 0 ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Frequency vertical grid lines
      const fTicks = [50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000];
      fTicks.forEach((f) => {
        const x = freqToX(f, width);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });

      // 2. Real-time Analyser Spectrum / Visualizer
      if (visualizerMode !== 'minimal') {
        audioEngine.getByteFrequencyData(freqData);
        audioEngine.getByteTimeDomainData(timeData);

        // Calculate peak level
        let maxVal = 0;
        for (let i = 0; i < 64; i++) {
          if (freqData[i] > maxVal) maxVal = freqData[i];
        }
        const normPeak = maxVal / 255;
        setPeakL((prev) => Math.max(normPeak, prev * 0.9));
        setPeakR((prev) => Math.max(normPeak * 0.96, prev * 0.9));
        setIsClipping(normPeak > 0.97);

        if (visualizerMode === 'spectrum') {
          // Poweramp Glowing Spectrum Bars
          const barCount = 48;
          const barWidth = width / barCount - 1.5;

          for (let i = 0; i < barCount; i++) {
            // Map bar index to log frequency
            const dataIndex = Math.floor(Math.pow(i / barCount, 2.2) * (freqData.length * 0.45));
            const val = freqData[dataIndex] || 0;
            const barH = (val / 255) * (height * 0.85);
            const x = i * (barWidth + 1.5);
            const y = height - barH;

            // Gradient from dark cyan to bright cyan/lime
            const grad = ctx.createLinearGradient(0, height, 0, y);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
            grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
            grad.addColorStop(1, 'rgba(0, 245, 155, 0.7)');

            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barH);

            // Peak cap dot
            if (barH > 4) {
              ctx.fillStyle = '#00f59b';
              ctx.fillRect(x, y - 2, barWidth, 1.5);
            }
          }
        } else if (visualizerMode === 'wave') {
          // Oscilloscope Waveform overlay
          ctx.beginPath();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
          const sliceWidth = width / timeData.length;
          let wx = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const wy = (v * height) / 2;
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
            wx += sliceWidth;
          }
          ctx.stroke();
        }
      }

      // 3. Composite EQ Response Curve
      const curveData = audioEngine.getCompositeFrequencyResponse(160);
      const { freqs, dbs } = curveData;

      // Draw Fill Under Curve
      ctx.beginPath();
      const firstX = freqToX(freqs[0], width);
      const firstY = dbToY(dbs[0], height);
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < freqs.length; i++) {
        const x = freqToX(freqs[i], width);
        const y = dbToY(dbs[i], height);
        ctx.lineTo(x, y);
      }

      const zeroY = dbToY(0, height);
      ctx.lineTo(width, zeroY);
      ctx.lineTo(0, zeroY);
      ctx.closePath();

      const curveGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isBypassed) {
        curveGrad.addColorStop(0, 'rgba(148, 163, 184, 0.05)');
        curveGrad.addColorStop(1, 'rgba(148, 163, 184, 0.01)');
      } else {
        curveGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
        curveGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
        curveGrad.addColorStop(1, 'rgba(0, 245, 155, 0.02)');
      }
      ctx.fillStyle = curveGrad;
      ctx.fill();

      // Draw Main Curve Stroke
      ctx.beginPath();
      ctx.moveTo(firstX, firstY);
      for (let i = 1; i < freqs.length; i++) {
        const x = freqToX(freqs[i], width);
        const y = dbToY(dbs[i], height);
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isBypassed ? '#64748b' : '#38bdf8';
      ctx.shadowColor = isBypassed ? 'transparent' : 'rgba(56, 189, 248, 0.8)';
      ctx.shadowBlur = isBypassed ? 0 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // 3b. Harman Target Reference Curve (Intermittent / Dashed lines)
      if (harmanTargetMode !== 'off') {
        ctx.save();
        ctx.setLineDash([5, 4]); // Intermittent dashed lines
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        for (let i = 0; i < freqs.length; i++) {
          const f = freqs[i];
          const targetDb = getHarmanTargetDb(f, harmanTargetMode);
          const x = freqToX(f, width);
          const y = dbToY(targetDb, height);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 4. Interactive Band Nodes (dots on curve)
      bands.forEach((b, i) => {
        const bx = freqToX(b.frequency, width);
        const by = dbToY(b.gain, height);
        const isHovered = activeBandIndex === i;

        // Outer glow circle
        ctx.beginPath();
        ctx.arc(bx, by, isHovered ? 7 : 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? '#00f59b' : '#00e5ff';
        ctx.shadowColor = isHovered ? 'rgba(0, 245, 155, 0.9)' : 'rgba(0, 229, 255, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner white core
        ctx.beginPath();
        ctx.arc(bx, by, isHovered ? 3.5 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [bands, isBypassed, visualizerMode, activeBandIndex, harmanTargetMode, dbToY, freqToX]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer drag on graph to adjust nearest band gain
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest band by X
    let closestIndex = 0;
    let minDistance = Infinity;

    bands.forEach((b, i) => {
      const bx = freqToX(b.frequency, canvas.width);
      const dist = Math.abs(x - bx);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    });

    if (minDistance < 35) {
      setActiveBandIndex(closestIndex);
      const newDb = yToDb(y, canvas.height);
      onBandGainChange(closestIndex, Number(newDb.toFixed(1)));
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeBandIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newDb = yToDb(y, canvas.height);
    onBandGainChange(activeBandIndex, Number(newDb.toFixed(1)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeBandIndex !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveBandIndex(null);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-2xl overflow-hidden p-3">
      {/* Top overlay toolbar: Frequency labels & visualizer toggles */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-num px-1 mb-1">
        <div className="flex items-center gap-3">
          <span className="font-audiophile font-bold tracking-wider text-cyan-400">RESPONSE</span>
          <span className="text-slate-500 hidden sm:inline">20 Hz – 20 kHz</span>
        </div>

        {/* Toolbar Buttons: Harman Target & Visualizer Mode */}
        <div className="flex items-center gap-1.5">
          {/* Harman Target Intermittent Curve Toggle */}
          <button
            onClick={() =>
              setHarmanTargetMode((prev) =>
                prev === 'off' ? 'over-ear' : prev === 'over-ear' ? 'in-ear' : 'off'
              )
            }
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
              harmanTargetMode !== 'off'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Harman Target Reference Curve (Intermittent Dashed Lines)"
          >
            <Target className="w-3 h-3 text-amber-400" />
            <span>
              {harmanTargetMode === 'over-ear'
                ? 'Harman OE'
                : harmanTargetMode === 'in-ear'
                ? 'Harman IE'
                : 'Target'}
            </span>
          </button>

          {/* Visualizer Mode Toggle */}
          <button
            onClick={onToggleVisualizerMode}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 transition-colors"
            title="Toggle Visualizer Mode"
          >
            {visualizerMode === 'spectrum' ? (
              <>
                <BarChart2 className="w-3 h-3 text-cyan-400" />
                <span>Spectrum</span>
              </>
            ) : visualizerMode === 'wave' ? (
              <>
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Wave</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-slate-400" />
                <span>Minimal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Screen */}
      <div ref={containerRef} className="relative w-full h-36 sm:h-44 touch-none select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-crosshair rounded-lg bg-[#070a12]"
        />

        {/* Harman Target Intermittent Line Legend (top left) */}
        {harmanTargetMode !== 'off' && (
          <div className="absolute top-1.5 left-8 pointer-events-none flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-[9px] font-mono text-amber-300 shadow-sm backdrop-blur-xs">
            <span className="font-bold tracking-tighter">-- - --</span>
            <span>Harman {harmanTargetMode === 'over-ear' ? 'Over-Ear' : 'In-Ear'}</span>
          </div>
        )}

        {/* dB Scale Legend (Left side) */}
        <div className="absolute left-1.5 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none text-[8px] font-num text-slate-500">
          <span>+15</span>
          <span>+6</span>
          <span className="text-cyan-400/80 font-bold">0</span>
          <span>-6</span>
          <span>-15</span>
        </div>

        {/* Real-time VU Peak LED Bar (Right side) */}
        <div className="absolute right-1.5 top-2 bottom-2 w-2.5 flex gap-0.5 items-end pointer-events-none">
          {/* Channel L */}
          <div className="w-1 h-full bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className={`w-full transition-all duration-75 rounded-xs ${
                isClipping ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500'
              }`}
              style={{ height: `${Math.min(100, peakL * 100)}%` }}
            />
          </div>
          {/* Channel R */}
          <div className="w-1 h-full bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className={`w-full transition-all duration-75 rounded-xs ${
                isClipping ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500'
              }`}
              style={{ height: `${Math.min(100, peakR * 100)}%` }}
            />
          </div>
        </div>

        {/* Active drag tooltip */}
        {activeBandIndex !== null && bands[activeBandIndex] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none bg-slate-900/90 border border-cyan-500/50 rounded px-2 py-0.5 text-[11px] font-num text-cyan-300 shadow-lg">
            {bands[activeBandIndex].frequency >= 1000
              ? `${(bands[activeBandIndex].frequency / 1000).toFixed(1)}k`
              : bands[activeBandIndex].frequency}
            Hz: {bands[activeBandIndex].gain > 0 ? `+${bands[activeBandIndex].gain}` : bands[activeBandIndex].gain} dB
          </div>
        )}
      </div>

      {/* Frequency Labels axis */}
      <div className="flex justify-between px-2 pt-1 text-[9px] font-num text-slate-500">
        <span>31</span>
        <span>62</span>
        <span>125</span>
        <span>250</span>
        <span>500</span>
        <span>1k</span>
        <span>2k</span>
        <span>4k</span>
        <span>8k</span>
        <span>16k</span>
      </div>
    </div>
  );
};

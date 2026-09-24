import React, { useRef, useState, useEffect, useCallback } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  label: string;
  unit?: string;
  size?: number; // size in px, e.g. 64 or 80
  glowColor?: 'cyan' | 'lime' | 'amber' | 'blue';
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step = 0.5,
  defaultValue = 0,
  label,
  unit = 'dB',
  size = 68,
  glowColor = 'cyan',
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  // Map value to angle (-135deg to +135deg => 270 deg range)
  const normalized = (value - min) / (max - min);
  const angle = -135 + normalized * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY; // upward drag increases
      const sensitivity = 0.5; // pixel per step
      const range = max - min;
      const change = (deltaY / 120) * range * sensitivity;
      let next = startValRef.current + change;

      // Snap to step
      if (step) {
        next = Math.round(next / step) * step;
      }
      next = Math.max(min, Math.min(max, next));
      onChange(Number(next.toFixed(1)));
    },
    [isDragging, min, max, step, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  // Colors
  const accentColors = {
    cyan: {
      arc: '#00e5ff',
      glow: 'rgba(0, 229, 255, 0.45)',
      ring: 'border-cyan-500/40',
      text: 'text-cyan-400',
    },
    lime: {
      arc: '#00f59b',
      glow: 'rgba(0, 245, 155, 0.45)',
      ring: 'border-emerald-500/40',
      text: 'text-emerald-400',
    },
    amber: {
      arc: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      ring: 'border-amber-500/40',
      text: 'text-amber-400',
    },
    blue: {
      arc: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.45)',
      ring: 'border-sky-500/40',
      text: 'text-sky-400',
    },
  }[glowColor];

  // SVG circular arc parameters
  const strokeWidth = 3;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 degrees total
  const arcLength = (270 / 360) * circumference;
  const strokeDashoffset = arcLength * (1 - normalized);

  const formattedVal = value > 0 && unit === 'dB' ? `+${value.toFixed(1)}` : value.toFixed(1);

  return (
    <div className="flex flex-col items-center select-none group">
      {/* Knob Dial Container */}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="relative cursor-ns-resize touch-none flex items-center justify-center p-1 active:scale-95 transition-transform"
        style={{ width: size, height: size }}
        title={`${label}: ${formattedVal}${unit} (Drag up/down, Double tap to reset)`}
      >
        {/* Background track SVG */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-[225deg]"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1b2333"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accentColors.arc}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: isDragging ? `drop-shadow(0 0 6px ${accentColors.glow})` : undefined,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease',
            }}
          />
        </svg>

        {/* Center Metallic Dial with Notch */}
        <div
          className={`relative rounded-full border border-slate-700/80 shadow-lg shadow-black/80 flex items-center justify-center transition-shadow ${
            isDragging ? 'shadow-cyan-500/20' : ''
          }`}
          style={{
            width: size - 18,
            height: size - 18,
            background: 'radial-gradient(circle at 35% 35%, #2a354c 0%, #131926 70%, #0a0e17 100%)',
          }}
        >
          {/* Concentric brushed rings */}
          <div className="absolute inset-1 rounded-full border border-slate-700/40 pointer-events-none" />

          {/* Indicator Needle */}
          <div
            className="absolute w-full h-full flex items-start justify-center pointer-events-none"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease',
            }}
          >
            <div
              className="w-1 rounded-full mt-1.5 shadow-sm"
              style={{
                height: (size - 18) * 0.28,
                backgroundColor: accentColors.arc,
                boxShadow: `0 0 8px ${accentColors.glow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Label and Value */}
      <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mt-1">
        {label}
      </span>
      <span className={`text-[12px] font-num font-bold tracking-tight ${accentColors.text}`}>
        {formattedVal} <span className="text-[9px] text-slate-500 font-normal">{unit}</span>
      </span>
    </div>
  );
};

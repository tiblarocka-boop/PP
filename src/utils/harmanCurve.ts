// Harman Target Reference Curves (Acoustics & Psychoacoustics Standard)
// Based on Sean Olive & Todd Welti's Harman Target research (Over-Ear 2018 & In-Ear 2019)

export interface TargetCurvePoint {
  freq: number;
  db: number;
}

// Harman Over-Ear 2018 Target Curve Reference Points
export const HARMAN_OVER_EAR_TARGET: TargetCurvePoint[] = [
  { freq: 20, db: 5.5 },
  { freq: 30, db: 5.8 },
  { freq: 40, db: 5.6 },
  { freq: 50, db: 5.2 },
  { freq: 63, db: 4.5 },
  { freq: 80, db: 3.5 },
  { freq: 100, db: 2.5 },
  { freq: 125, db: 1.5 },
  { freq: 160, db: 0.8 },
  { freq: 200, db: 0.2 },
  { freq: 250, db: -0.1 },
  { freq: 500, db: 0.0 },
  { freq: 800, db: 0.5 },
  { freq: 1000, db: 1.0 },
  { freq: 1500, db: 3.2 },
  { freq: 2000, db: 6.5 },
  { freq: 2500, db: 8.5 },
  { freq: 3000, db: 9.0 }, // Ear canal resonance / pinna gain peak
  { freq: 3500, db: 7.8 },
  { freq: 4000, db: 5.5 },
  { freq: 5000, db: 3.0 },
  { freq: 6000, db: 1.0 },
  { freq: 7000, db: 0.5 },
  { freq: 8000, db: 1.5 }, // Second resonance
  { freq: 10000, db: -0.5 },
  { freq: 12500, db: -2.0 },
  { freq: 16000, db: -4.5 },
  { freq: 20000, db: -7.0 },
];

// Harman In-Ear (IEM) 2019 Target Curve Reference Points (Slightly higher sub-bass shelf +8dB)
export const HARMAN_IN_EAR_TARGET: TargetCurvePoint[] = [
  { freq: 20, db: 8.2 },
  { freq: 30, db: 8.0 },
  { freq: 40, db: 7.5 },
  { freq: 50, db: 6.8 },
  { freq: 63, db: 5.8 },
  { freq: 80, db: 4.5 },
  { freq: 100, db: 3.2 },
  { freq: 125, db: 1.8 },
  { freq: 160, db: 0.8 },
  { freq: 200, db: 0.2 },
  { freq: 250, db: -0.1 },
  { freq: 500, db: 0.0 },
  { freq: 800, db: 0.6 },
  { freq: 1000, db: 1.2 },
  { freq: 1500, db: 4.0 },
  { freq: 2000, db: 7.5 },
  { freq: 2500, db: 10.0 },
  { freq: 3000, db: 11.0 },
  { freq: 3500, db: 9.0 },
  { freq: 4000, db: 6.5 },
  { freq: 5000, db: 3.5 },
  { freq: 6000, db: 1.5 },
  { freq: 8000, db: 2.0 },
  { freq: 10000, db: -0.5 },
  { freq: 12500, db: -2.5 },
  { freq: 16000, db: -5.0 },
  { freq: 20000, db: -8.0 },
];

/**
 * Calculates the exact Harman target response in dB at any given frequency (Hz)
 * Uses logarithmic frequency interpolation
 */
export function getHarmanTargetDb(
  freq: number,
  targetType: 'over-ear' | 'in-ear' = 'over-ear'
): number {
  const points = targetType === 'in-ear' ? HARMAN_IN_EAR_TARGET : HARMAN_OVER_EAR_TARGET;

  if (freq <= points[0].freq) return points[0].db;
  if (freq >= points[points.length - 1].freq) return points[points.length - 1].db;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (freq >= p0.freq && freq <= p1.freq) {
      const log0 = Math.log10(p0.freq);
      const log1 = Math.log10(p1.freq);
      const logF = Math.log10(freq);
      const t = (logF - log0) / (log1 - log0);
      return p0.db + t * (p1.db - p0.db);
    }
  }

  return 0;
}

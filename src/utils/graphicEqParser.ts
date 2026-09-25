// Parser and Exporter for .txt Graph Equaliser files (Equalizer APO, Peace EQ, AutoEq, Wavelet)
import { EQPreset, EQBand, EQMode } from '../types/audio';
import { STANDARD_FREQUENCIES_10, STANDARD_FREQUENCIES_16, STANDARD_FREQUENCIES_32 } from './presets';

export interface FrequencyGainPoint {
  freq: number;
  gain: number;
}

// Log-linear interpolation to evaluate gain at any target frequency
export function interpolateGainAtFreq(points: FrequencyGainPoint[], targetFreq: number): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].gain;

  // Sort by frequency
  const sorted = [...points].sort((a, b) => a.freq - b.freq);

  if (targetFreq <= sorted[0].freq) return sorted[0].gain;
  if (targetFreq >= sorted[sorted.length - 1].freq) return sorted[sorted.length - 1].gain;

  // Find surrounding points
  let idx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].freq <= targetFreq && sorted[i + 1].freq >= targetFreq) {
      idx = i;
      break;
    }
  }

  const p0 = sorted[idx];
  const p1 = sorted[idx + 1];

  // Interpolate in log-frequency space (matches human hearing octave scaling)
  const log0 = Math.log10(p0.freq);
  const log1 = Math.log10(p1.freq);
  const logT = Math.log10(targetFreq);

  const t = (logT - log0) / (log1 - log0);
  return p0.gain + t * (p1.gain - p0.gain);
}

/**
 * Parses any .txt equalizer file:
 * 1. GraphicEQ format: "GraphicEQ: 20 0; 25 1.5; 31.5 2.0; ..."
 * 2. Preamp line: "Preamp: -4.5 dB"
 * 3. Line-by-line: "20 0.5\n25 1.0\n..."
 * 4. Equalizer APO Parametric filters: "Filter 1: ON PK Fc 32 Hz Gain 2.5 dB Q 1.41"
 */
export function parseGraphicEqText(rawText: string, fileName = 'Imported Preset'): EQPreset {
  const lines = rawText.split(/\r?\n/);
  let preamp = 0;
  const points: FrequencyGainPoint[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for Preamp
    const preampMatch = trimmed.match(/Preamp:\s*([+-]?\d+(?:\.\d+)?)\s*(?:dB)?/i);
    if (preampMatch) {
      preamp = parseFloat(preampMatch[1]);
      continue;
    }

    // Check for GraphicEQ: 20 0; 25 0; ...
    if (trimmed.startsWith('GraphicEQ:')) {
      const dataPart = trimmed.substring('GraphicEQ:'.length).trim();
      const tokens = dataPart.split(';');
      for (const token of tokens) {
        const item = token.trim();
        if (!item) continue;
        const pair = item.split(/\s+/);
        if (pair.length >= 2) {
          const f = parseFloat(pair[0]);
          const g = parseFloat(pair[1]);
          if (!isNaN(f) && !isNaN(g)) {
            points.push({ freq: f, gain: g });
          }
        }
      }
      continue;
    }

    // Check for Parametric Filter: Filter 1: ON PK Fc 32 Hz Gain 2.5 dB Q 1.41
    const filterMatch = trimmed.match(/Fc\s+(\d+(?:\.\d+)?)\s*Hz\s+Gain\s+([+-]?\d+(?:\.\d+)?)\s*dB/i);
    if (filterMatch) {
      const f = parseFloat(filterMatch[1]);
      const g = parseFloat(filterMatch[2]);
      if (!isNaN(f) && !isNaN(g)) {
        points.push({ freq: f, gain: g });
      }
      continue;
    }

    // Check for simple two-column "freq gain" or "freq, gain"
    const colMatch = trimmed.split(/[\s,;\t]+/);
    if (colMatch.length >= 2) {
      const f = parseFloat(colMatch[0]);
      const g = parseFloat(colMatch[1]);
      if (!isNaN(f) && !isNaN(g) && f >= 10 && f <= 30000) {
        points.push({ freq: f, gain: g });
      }
    }
  }

  if (points.length === 0) {
    throw new Error('No valid equalizer frequency/gain points found in .txt file');
  }

  // Interpolate to 10-band standard frequencies
  const bands10 = STANDARD_FREQUENCIES_10.map((f) =>
    parseFloat(interpolateGainAtFreq(points, f).toFixed(1))
  );

  // Interpolate to 16-band standard frequencies
  const bands16 = STANDARD_FREQUENCIES_16.map((f) =>
    parseFloat(interpolateGainAtFreq(points, f).toFixed(1))
  );

  // Interpolate to 32-band standard frequencies
  const bands32 = STANDARD_FREQUENCIES_32.map((f) =>
    parseFloat(interpolateGainAtFreq(points, f).toFixed(1))
  );

  // Derive tone settings from low & high bounds
  const bassGain = parseFloat((interpolateGainAtFreq(points, 63) * 0.7).toFixed(1));
  const trebleGain = parseFloat((interpolateGainAtFreq(points, 10000) * 0.7).toFixed(1));

  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return {
    id: `txt_${Date.now()}`,
    name: cleanName,
    category: 'Custom',
    author: 'Imported .txt',
    preamp: Math.max(-15, Math.min(15, preamp)),
    bands10,
    bands16,
    bands32,
    bassGain: Math.max(-12, Math.min(12, bassGain)),
    trebleGain: Math.max(-12, Math.min(12, trebleGain)),
  };
}

/**
 * Exports current bands as standard GraphicEQ .txt file
 * Compatible with Equalizer APO, Peace EQ, AutoEq, Poweramp, and Wavelet
 */
export function exportGraphicEqText(
  presetName: string,
  preamp: number,
  bands: EQBand[]
): string {
  const lines: string[] = [];
  lines.push(`# Fatyliser Equalizer APO / Peace / Wavelet Export`);
  lines.push(`# Preset: ${presetName}`);
  lines.push(`# Date: ${new Date().toISOString().split('T')[0]}`);
  lines.push(`Preamp: ${preamp >= 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB`);

  const points = bands
    .map((b) => `${b.frequency} ${b.gain >= 0 ? `+${b.gain.toFixed(1)}` : b.gain.toFixed(1)}`)
    .join('; ');

  lines.push(`GraphicEQ: ${points}`);
  return lines.join('\n');
}

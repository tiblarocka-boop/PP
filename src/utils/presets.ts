import { EQPreset } from '../types/audio';

export const STANDARD_FREQUENCIES_10 = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const STANDARD_FREQUENCIES_16 = [
  25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 14000, 20000
];

export const STANDARD_FREQUENCIES_32 = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 18000, 20000
];

export const DEFAULT_PRESETS: EQPreset[] = [
  {
    id: 'flat',
    name: 'Flat (Reference)',
    category: 'Standard',
    author: 'pp48',
    preamp: 0,
    bands10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassGain: 0,
    trebleGain: 0,
  },
  {
    id: 'pp48_audiophile',
    name: 'pp48 Audiophile Master',
    category: 'pp48 Special',
    author: 'pp48',
    preamp: -1.5,
    bands10: [6.5, 5.0, 3.5, 1.0, -1.0, 0.5, 2.0, 3.5, 5.5, 6.0],
    bassGain: 4.5,
    trebleGain: 3.5,
  },
  {
    id: 'pp48_deep_sub',
    name: 'pp48 Sub-Bass Impact',
    category: 'pp48 Special',
    author: 'pp48',
    preamp: -3.0,
    bands10: [9.5, 8.0, 5.5, 2.0, 0.0, -1.5, -0.5, 1.0, 2.5, 3.0],
    bassGain: 7.0,
    trebleGain: 1.0,
  },
  {
    id: 'poweramp_bass_boost',
    name: 'Poweramp Bass Booster',
    category: 'Bass',
    author: 'Poweramp',
    preamp: -2.5,
    bands10: [8.0, 7.0, 6.0, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    bassGain: 6.0,
    trebleGain: 0.0,
  },
  {
    id: 'poweramp_rock',
    name: 'Rock / Metal',
    category: 'Genre',
    author: 'Poweramp',
    preamp: -1.0,
    bands10: [5.0, 3.5, -1.5, -2.5, -1.0, 1.5, 4.0, 5.5, 6.0, 6.5],
    bassGain: 3.0,
    trebleGain: 4.0,
  },
  {
    id: 'poweramp_techno',
    name: 'Techno & EDM',
    category: 'Genre',
    author: 'Poweramp',
    preamp: -2.0,
    bands10: [7.0, 5.5, 2.0, 0.0, -2.0, 0.0, 3.0, 5.0, 6.0, 7.0],
    bassGain: 5.0,
    trebleGain: 4.5,
  },
  {
    id: 'poweramp_hiphop',
    name: 'Hip-Hop & Trap',
    category: 'Genre',
    author: 'Poweramp',
    preamp: -2.5,
    bands10: [8.5, 7.0, 3.0, 0.5, -1.5, 0.0, 2.0, 3.5, 4.5, 5.0],
    bassGain: 6.5,
    trebleGain: 2.5,
  },
  {
    id: 'poweramp_vocal',
    name: 'Vocal Clarity',
    category: 'Standard',
    author: 'Poweramp',
    preamp: -0.5,
    bands10: [-2.0, -2.0, -1.0, 1.0, 3.5, 4.5, 4.0, 2.5, 1.0, -0.5],
    bassGain: -1.5,
    trebleGain: 2.0,
  },
  {
    id: 'poweramp_club',
    name: 'Club & Dancefloor',
    category: 'Genre',
    author: 'Poweramp',
    preamp: -1.5,
    bands10: [3.5, 4.5, 3.0, 0.0, 2.0, 3.5, 3.5, 2.0, 0.5, 0.0],
    bassGain: 4.0,
    trebleGain: 2.0,
  },
  {
    id: 'poweramp_acoustic',
    name: 'Acoustic & Classical',
    category: 'Standard',
    author: 'Poweramp',
    preamp: 0,
    bands10: [4.0, 3.0, 2.0, 1.0, 2.0, 2.5, 3.0, 3.5, 4.0, 4.0],
    bassGain: 2.0,
    trebleGain: 3.0,
  },
  {
    id: 'poweramp_car',
    name: 'Car Audio Loudness',
    category: 'Standard',
    author: 'pp48',
    preamp: -2.0,
    bands10: [7.0, 6.0, 3.0, -1.0, -2.0, 0.0, 2.5, 4.5, 6.5, 7.5],
    bassGain: 5.5,
    trebleGain: 5.0,
  },
];

const STORAGE_KEY_CUSTOM_PRESETS = 'fatyliser_custom_presets_v1';

export function getStoredCustomPresets(): EQPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredCustomPresets(presets: EQPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage', e);
  }
}

export interface EQBand {
  id: string;
  frequency: number;
  gain: number; // -15 to +15 dB
  q: number; // Q factor (e.g. 1.41)
  type: BiquadFilterType;
}

export type EQMode = '10' | '16' | '32';

export interface ToneSettings {
  bassGain: number; // -12 to +12 dB
  bassFreq: number; // 60 - 200 Hz
  trebleGain: number; // -12 to +12 dB
  trebleFreq: number; // 6000 - 16000 Hz
}

export interface LimiterSettings {
  enabled: boolean;
  threshold: number; // -30 to 0 dB
  knee: number; // 0 to 40 dB
  ratio: number; // 1 to 20
  attack: number; // 0.001 to 0.1 s
  release: number; // 0.05 to 0.5 s
}

export interface SpatialSettings {
  stereoWidth: number; // 0 (mono) to 2 (extra wide), 1 is normal
  reverbMix: number; // 0 to 1
  tempo: number; // 0.5 to 1.5
  pitch: number; // -1200 to +1200 cents
}

export interface EQPreset {
  id: string;
  name: string;
  category: 'Standard' | 'Bass' | 'Genre' | 'pp48 Special' | 'Custom' | 'Headphones (AutoEq)';
  author?: string;
  headphoneModel?: string;
  source?: string;
  notes?: string;
  preamp: number; // -15 to +15 dB
  bands10: number[]; // 10 gains
  bands16?: number[];
  bands32?: number[];
  bassGain?: number;
  trebleGain?: number;
}

export type VisualizerMode = 'spectrum' | 'wave' | 'octave' | 'minimal';

export interface BuiltinTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  type: 'synth_bass' | 'electro_groove' | 'audiophile_test' | 'lofi_ambient' | 'sub_rumble' | 'pink_noise';
}

export type ThemeAccent = 'cyan' | 'green' | 'amber' | 'blue' | 'purple';

export interface AppSettings {
  themeAccent: ThemeAccent;
  dvcEnabled: boolean;
  autoGainCompensation: boolean;
  hapticFeedback: boolean;
  keepScreenAwake: boolean;
  sampleRate: number; // 48000, 96000, 192000
  bufferMode: 'low' | 'balanced' | 'safe';
  advancedTrackingEnabled: boolean;
  knownPlayers: string[];
}


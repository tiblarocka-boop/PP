import React, { useState, useEffect, useCallback } from 'react';
import {
  EQBand,
  EQMode,
  ToneSettings,
  LimiterSettings,
  SpatialSettings,
  EQPreset,
  VisualizerMode,
  AppSettings,
} from './types/audio';
import { audioEngine } from './utils/audioEngine';
import {
  DEFAULT_PRESETS,
  getStoredCustomPresets,
  saveStoredCustomPresets,
  STANDARD_FREQUENCIES_10,
} from './utils/presets';
import { Header } from './components/Header';
import { FrequencyGraph } from './components/FrequencyGraph';
import { EqualizerView } from './components/EqualizerView';
import { ToneAndFxView } from './components/ToneAndFxView';
import { LimiterView } from './components/LimiterView';
import { PresetsView } from './components/PresetsView';
import { PlayerBar } from './components/PlayerBar';
import { AboutModal } from './components/AboutModal';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sliders, SlidersHorizontal, ShieldCheck, Bookmark } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'fatyliser_app_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  themeAccent: 'cyan',
  dvcEnabled: true,
  autoGainCompensation: true,
  hapticFeedback: true,
  keepScreenAwake: true,
  sampleRate: 48000,
  bufferMode: 'low',
  advancedTrackingEnabled: true,
  knownPlayers: ['Spotify', 'YouTube', 'YouTube Music', 'Musicolet', 'Poweramp', 'VLC'],
};

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'eq' | 'tone' | 'limiter' | 'presets'>('eq');

  // Equalizer state
  const [mode, setMode] = useState<EQMode>('10');
  const [bands, setBands] = useState<EQBand[]>(() => audioEngine.createDefaultBands('10'));
  const [preamp, setPreamp] = useState<number>(0);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectrum');

  // Tone & Spatial FX state
  const [tone, setTone] = useState<ToneSettings>({
    bassGain: 0,
    bassFreq: 100,
    trebleGain: 0,
    trebleFreq: 10000,
  });

  const [spatial, setSpatial] = useState<SpatialSettings>({
    stereoWidth: 1.0,
    reverbMix: 0.0,
    tempo: 1.0,
    pitch: 0,
  });

  // Limiter state
  const [limiter, setLimiter] = useState<LimiterSettings>({
    enabled: true,
    threshold: -3,
    knee: 12,
    ratio: 12,
    attack: 0.003,
    release: 0.15,
  });

  // Presets state
  const [currentPresetId, setCurrentPresetId] = useState<string>('flat');
  const [allPresets, setAllPresets] = useState<EQPreset[]>(() => [
    ...DEFAULT_PRESETS,
    ...getStoredCustomPresets(),
  ]);

  // App Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // System audio capture state
  const [isSystemCaptureActive, setIsSystemCaptureActive] = useState<boolean>(false);

  // Modals
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize engine on first user interaction
  const handleUserAudioStart = useCallback(() => {
    audioEngine.initContext();
  }, []);

  // Save settings on update
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Manage WakeLock based on setting
  useEffect(() => {
    if (settings.keepScreenAwake) {
      audioEngine.requestWakeLock();
    } else {
      audioEngine.releaseWakeLock();
    }
    return () => {
      audioEngine.releaseWakeLock();
    };
  }, [settings.keepScreenAwake]);

  // Check system audio capture status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSystemCaptureActive(audioEngine.getCurrentSourceType() === 'system');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Preamp change with optional auto-gain compensation
  const handlePreampChange = (db: number) => {
    setPreamp(db);
    audioEngine.setPreamp(db);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(5);
    }
  };

  // Band gain change
  const handleBandGainChange = (index: number, gain: number) => {
    setBands((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], gain };
      }

      // Auto-gain compensation calculation
      if (settings.autoGainCompensation) {
        const maxBoost = Math.max(...next.map((b) => b.gain), 0);
        if (maxBoost > 6) {
          const compOffset = -((maxBoost - 6) * 0.4);
          audioEngine.setPreamp(preamp + compOffset);
        } else {
          audioEngine.setPreamp(preamp);
        }
      }

      return next;
    });
    audioEngine.setBandGain(index, gain);

    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(4);
    }
  };

  // Mode change (10, 16, 32 bands)
  const handleModeChange = (newMode: EQMode) => {
    setMode(newMode);
    const newBands = audioEngine.createDefaultBands(newMode);
    if (newMode === '10') {
      newBands.forEach((b, i) => {
        b.gain = bands[i] ? bands[i].gain : 0;
      });
    }
    setBands(newBands);
    audioEngine.rebuildEQFilters(newBands);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(8);
    }
  };

  // Reset bands to flat
  const handleResetBands = () => {
    const next = bands.map((b) => ({ ...b, gain: 0 }));
    setBands(next);
    audioEngine.setAllBands(next);
    setCurrentPresetId('flat');
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(10);
    }
  };

  // Invert current bands
  const handleInvertBands = () => {
    const next = bands.map((b) => ({ ...b, gain: -b.gain }));
    setBands(next);
    audioEngine.setAllBands(next);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(8);
    }
  };

  // Tone update
  const handleToneChange = (newTone: Partial<ToneSettings>) => {
    const updated = { ...tone, ...newTone };
    setTone(updated);
    audioEngine.setTone(newTone);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(4);
    }
  };

  // Spatial update
  const handleSpatialChange = (newSpatial: Partial<SpatialSettings>) => {
    const updated = { ...spatial, ...newSpatial };
    setSpatial(updated);
    audioEngine.setSpatial(newSpatial);
  };

  // Limiter update
  const handleLimiterChange = (newLimiter: Partial<LimiterSettings>) => {
    const updated = { ...limiter, ...newLimiter };
    setLimiter(updated);
    audioEngine.setLimiter(newLimiter);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(6);
    }
  };

  // Bypass toggle
  const handleToggleBypass = () => {
    const next = !isBypassed;
    setIsBypassed(next);
    audioEngine.setBypass(next);
    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(12);
    }
  };

  // Visualizer mode toggle
  const handleToggleVisualizerMode = () => {
    setVisualizerMode((prev) =>
      prev === 'spectrum' ? 'wave' : prev === 'wave' ? 'minimal' : 'spectrum'
    );
  };

  // Toggle System Audio / YouTube / Spotify Capture
  const handleToggleSystemCapture = async () => {
    handleUserAudioStart();
    if (isSystemCaptureActive) {
      audioEngine.stopAllSources();
      setIsSystemCaptureActive(false);
    } else {
      try {
        await audioEngine.enableSystemAudioCapture();
        setIsSystemCaptureActive(true);
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  // Apply Preset
  const handleSelectPreset = (preset: EQPreset) => {
    setCurrentPresetId(preset.id);
    handlePreampChange(preset.preamp);

    if (preset.bassGain !== undefined) {
      handleToneChange({ bassGain: preset.bassGain });
    }
    if (preset.trebleGain !== undefined) {
      handleToneChange({ trebleGain: preset.trebleGain });
    }

    if (mode === '10') {
      const next = bands.map((b, i) => ({
        ...b,
        gain: preset.bands10[i] !== undefined ? preset.bands10[i] : 0,
      }));
      setBands(next);
      audioEngine.setAllBands(next);
    } else {
      const next = bands.map((b) => {
        let nearestIdx = 0;
        let minDist = Infinity;
        STANDARD_FREQUENCIES_10.forEach((f10, idx) => {
          const dist = Math.abs(Math.log10(b.frequency) - Math.log10(f10));
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = idx;
          }
        });
        return {
          ...b,
          gain: preset.bands10[nearestIdx] || 0,
        };
      });
      setBands(next);
      audioEngine.setAllBands(next);
    }

    if (settings.hapticFeedback) {
      audioEngine.triggerHaptic(8);
    }
  };

  // Save Current as Preset
  const handleSaveCurrentAsPreset = (name: string) => {
    const gains10 =
      mode === '10'
        ? bands.map((b) => b.gain)
        : STANDARD_FREQUENCIES_10.map((f) => {
            const match = bands.find((b) => Math.abs(b.frequency - f) < f * 0.2);
            return match ? match.gain : 0;
          });

    const newPreset: EQPreset = {
      id: `custom_${Date.now()}`,
      name,
      category: 'Custom',
      author: 'You',
      preamp,
      bands10: gains10,
      bassGain: tone.bassGain,
      trebleGain: tone.trebleGain,
    };

    const stored = getStoredCustomPresets();
    const updated = [newPreset, ...stored];
    saveStoredCustomPresets(updated);
    setAllPresets([...DEFAULT_PRESETS, ...updated]);
    setCurrentPresetId(newPreset.id);
  };

  // Delete Custom Preset
  const handleDeleteCustomPreset = (id: string) => {
    const stored = getStoredCustomPresets().filter((p) => p.id !== id);
    saveStoredCustomPresets(stored);
    setAllPresets([...DEFAULT_PRESETS, ...stored]);
    if (currentPresetId === id) {
      setCurrentPresetId('flat');
    }
  };

  // Import Presets JSON
  const handleImportPresets = (imported: EQPreset[]) => {
    const stored = getStoredCustomPresets();
    const merged = [...imported.map((p) => ({ ...p, category: 'Custom' as const })), ...stored];
    saveStoredCustomPresets(merged);
    setAllPresets([...DEFAULT_PRESETS, ...merged]);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Offline Alert */}
      <OfflineIndicator />

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 pb-24 md:pb-28">
        {/* Top App Bar */}
        <Header
          isBypassed={isBypassed}
          onToggleBypass={handleToggleBypass}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Real-time Frequency Response & Visualizer Graph */}
        <div className="p-3">
          <FrequencyGraph
            bands={bands}
            isBypassed={isBypassed}
            visualizerMode={visualizerMode}
            onBandGainChange={handleBandGainChange}
            onToggleVisualizerMode={handleToggleVisualizerMode}
          />
        </div>

        {/* Tab Sub-navigation Bar (Poweramp Android Style) */}
        <div className="px-3 pb-2">
          <div className="grid grid-cols-4 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <button
              onClick={() => setActiveTab('eq')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'eq'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>EQ</span>
            </button>

            <button
              onClick={() => setActiveTab('tone')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tone'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>TONE</span>
            </button>

            <button
              onClick={() => setActiveTab('limiter')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'limiter'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>LIMITER</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'presets'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>PRESETS</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <main className="flex-1 px-3">
          {activeTab === 'eq' && (
            <EqualizerView
              bands={bands}
              mode={mode}
              preamp={preamp}
              onPreampChange={handlePreampChange}
              onBandGainChange={handleBandGainChange}
              onModeChange={handleModeChange}
              onResetBands={handleResetBands}
              onInvertBands={handleInvertBands}
            />
          )}

          {activeTab === 'tone' && (
            <ToneAndFxView
              tone={tone}
              spatial={spatial}
              onToneChange={handleToneChange}
              onSpatialChange={handleSpatialChange}
            />
          )}

          {activeTab === 'limiter' && (
            <LimiterView limiter={limiter} onLimiterChange={handleLimiterChange} />
          )}

          {activeTab === 'presets' && (
            <PresetsView
              currentPresetId={currentPresetId}
              allPresets={allPresets}
              onSelectPreset={handleSelectPreset}
              onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
              onImportPresets={handleImportPresets}
            />
          )}
        </main>
      </div>

      {/* Fixed Bottom Audio Player Transport */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-2xl mx-auto">
        <PlayerBar
          onAudioStart={handleUserAudioStart}
          onToggleSystemCapture={handleToggleSystemCapture}
          isSystemCaptureActive={isSystemCaptureActive}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        isSystemCaptureActive={isSystemCaptureActive}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onToggleSystemAudioCapture={handleToggleSystemCapture}
      />

      {/* About & PWA Guide Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

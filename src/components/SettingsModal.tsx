import React, { useState } from 'react';
import { AppSettings, ThemeAccent } from '../types/audio';
import {
  X,
  Settings,
  Radio,
  Sliders,
  Volume2,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Vibrate,
  Eye,
  Zap,
  Music,
  Youtube,
  Tv,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  isSystemCaptureActive: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onToggleSystemAudioCapture: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  isSystemCaptureActive,
  onClose,
  onUpdateSettings,
  onToggleSystemAudioCapture,
}) => {
  const [copiedAdb, setCopiedAdb] = useState(false);
  const [activeSection, setActiveSection] = useState<'routing' | 'audio' | 'ui'>('routing');

  if (!isOpen) return null;

  const adbCommand = 'adb shell pm grant com.pp48.fatyliser android.permission.DUMP';

  const handleCopyAdb = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  const themes: { id: ThemeAccent; name: string; color: string }[] = [
    { id: 'cyan', name: 'Electric Cyan', color: '#00e5ff' },
    { id: 'green', name: 'Poweramp Lime', color: '#00f59b' },
    { id: 'amber', name: 'Warm Amber', color: '#f59e0b' },
    { id: 'blue', name: 'Ice Sky Blue', color: '#38bdf8' },
    { id: 'purple', name: 'Neon Violet', color: '#c084fc' },
  ];

  const streamingApps = [
    { name: 'Spotify', url: 'https://open.spotify.com', icon: Music },
    { name: 'YouTube', url: 'https://m.youtube.com', icon: Youtube },
    { name: 'YouTube Music', url: 'https://music.youtube.com', icon: Tv },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-audiophile text-sm font-bold tracking-wider text-white">
                FATYLISER SETTINGS
              </h2>
              <p className="text-[10px] text-slate-400">Poweramp DSP &amp; Player Tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-950/40 border-b border-slate-800/60 text-xs">
          <button
            onClick={() => setActiveSection('routing')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'routing'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Streaming &amp; Apps
          </button>
          <button
            onClick={() => setActiveSection('audio')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'audio'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audio Engine / DVC
          </button>
          <button
            onClick={() => setActiveSection('ui')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'ui'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Skin &amp; Haptics
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 1. STREAMING & AUDIO ROUTING */}
          {activeSection === 'routing' && (
            <div className="space-y-4">
              {/* Live Streaming Capture Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span className="font-audiophile font-bold text-slate-100 text-xs">
                      SYSTEM &amp; STREAMING AUDIO CAPTURE
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSystemCaptureActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSystemCaptureActive ? 'ROUTING ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Capture and equalize audio in real time from <strong>YouTube</strong>,{' '}
                  <strong>Spotify</strong>, <strong>Chrome</strong>, or other audio player apps
                  running on your device.
                </p>

                <button
                  onClick={onToggleSystemAudioCapture}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isSystemCaptureActive
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isSystemCaptureActive
                      ? 'Disconnect System Audio'
                      : 'Route YouTube / Spotify Audio through Fatyliser'}
                  </span>
                </button>
              </div>

              {/* Quick Launch Buttons for Streaming */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Open Streaming Players
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {streamingApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <a
                        key={app.name}
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors text-center"
                      >
                        <Icon className="w-5 h-5 text-cyan-400" />
                        <span className="text-[10px] font-semibold">{app.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Android Poweramp Advanced Player Tracking / DUMP Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Native APK Player Tracking (DUMP)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When installed as an Android APK, Android limits background audio interception
                  unless granted session tracking. In Poweramp Equalizer, you grant the{' '}
                  <code className="text-amber-300 font-num">DUMP</code> permission via Shizuku or
                  ADB:
                </p>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <code className="text-[10px] font-num text-cyan-300 flex-1 truncate">
                    {adbCommand}
                  </code>
                  <button
                    onClick={handleCopyAdb}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy ADB command"
                  >
                    {copiedAdb ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. AUDIO ENGINE & DVC */}
          {activeSection === 'audio' && (
            <div className="space-y-4">
              {/* Direct Volume Control (DVC) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <div className="font-semibold text-slate-200">
                    Direct Volume Control (DVC)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bypasses phone software volume degradation for up to +6dB extra dynamic headroom.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dvcEnabled}
                  onChange={(e) => onUpdateSettings({ dvcEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Auto-Gain Compensation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <div className="font-semibold text-slate-200">
                    Auto-Gain Preamp Compensation
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatically reduces preamp gain when high positive EQ boosts are applied to prevent digital clipping.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoGainCompensation}
                  onChange={(e) => onUpdateSettings({ autoGainCompensation: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Sample Rate */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200">Audio Sample Rate</div>
                <div className="grid grid-cols-3 gap-2">
                  {[48000, 96000, 192000].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => onUpdateSettings({ sampleRate: rate })}
                      className={`py-1.5 rounded-lg font-num font-semibold text-[11px] transition-colors ${
                        settings.sampleRate === rate
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {rate / 1000} kHz
                    </button>
                  ))}
                </div>
              </div>

              {/* Buffer Mode */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200">DSP Buffer Latency</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low', label: 'Low (10ms)' },
                    { id: 'balanced', label: 'Balanced (25ms)' },
                    { id: 'safe', label: 'Safe (50ms)' },
                  ].map((buf) => (
                    <button
                      key={buf.id}
                      onClick={() => onUpdateSettings({ bufferMode: buf.id as any })}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                        settings.bufferMode === buf.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {buf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. SKIN & HAPTICS */}
          {activeSection === 'ui' && (
            <div className="space-y-4">
              {/* Color Themes */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="font-semibold text-slate-200">Glow Color Theme</div>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ themeAccent: t.id })}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
                        settings.themeAccent === t.id
                          ? 'bg-slate-900 border-cyan-500/60 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}` }}
                      />
                      <span className="text-[11px] font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Haptic Vibration Feedback */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Vibrate className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Haptic Vibration Feedback</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tactile vibration tick when adjusting knobs and equalizer faders on touch devices.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hapticFeedback}
                  onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Keep Screen Awake */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Keep Screen Awake</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prevents screen from turning off while audio visualizer is running.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.keepScreenAwake}
                  onChange={(e) => onUpdateSettings({ keepScreenAwake: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Fatyliser v2.4 by pp48</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

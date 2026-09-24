import React, { useState } from 'react';
import { Power, Settings, HelpCircle, ChevronDown, Download, Bookmark } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  isBypassed: boolean;
  onToggleBypass: () => void;
  currentPresetName: string;
  onOpenPresets: () => void;
  dvcEnabled: boolean;
  limiterActive: boolean;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBypassed,
  onToggleBypass,
  currentPresetName,
  onOpenPresets,
  dvcEnabled,
  limiterActive,
  onOpenAbout,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070a10]/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 shadow-lg shadow-black/40">
      {/* Zone 1: Master Power Switch & Poweramp Equalizer branding */}
      <div className="flex items-center gap-2.5">
        {/* Hardware Rocker / Power Toggle Switch */}
        <button
          onClick={onToggleBypass}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-inner ${
            !isBypassed
              ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500/60 text-cyan-300 shadow-cyan-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
          title={!isBypassed ? 'Equalizer ON (Click to Bypass)' : 'Equalizer BYPASS (Click to Enable)'}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              !isBypassed
                ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-pulse'
                : 'bg-slate-700'
            }`}
          />
          <span className="font-audiophile text-[11px] font-black tracking-wider">
            {!isBypassed ? 'EQUALIZER' : 'BYPASS'}
          </span>
        </button>

        {/* Audiophile Engine Badge */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[9px] font-audiophile font-black text-slate-400 tracking-wider">
            FATYLISER
          </span>
          <span className="text-[8px] text-cyan-400 font-mono -mt-0.5">
            by pp48
          </span>
        </div>
      </div>

      {/* Zone 2: Preset Quick Selector Dropdown Pill */}
      <button
        onClick={onOpenPresets}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-200 transition-all shadow-sm max-w-[140px] sm:max-w-[180px] truncate"
        title="Current Preset (Click to Change or Save)"
      >
        <Bookmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-xs font-bold truncate">{currentPresetName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Zone 3: Hardware LED Status Badges & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* DVC (Direct Volume Control) LED indicator */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black border transition-colors ${
            dvcEnabled && !isBypassed
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-600'
          }`}
          title="Direct Volume Control (DVC) High Headroom Mode"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dvcEnabled && !isBypassed ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-700'
            }`}
          />
          <span>DVC</span>
        </div>

        {/* LIMITER LED indicator */}
        <div
          className={`hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black border transition-colors ${
            limiterActive && !isBypassed
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-600'
          }`}
          title="Anti-Clipping Studio Limiter Active"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              limiterActive && !isBypassed ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
            }`}
          />
          <span>LIMIT</span>
        </div>

        {/* PWA Install Button if available */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
            title="Install Standalone App"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-850 transition-colors"
          title="Audio Engine &amp; DSP Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Help / About */}
        <button
          onClick={onOpenAbout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          title="About Fatyliser by pp48"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 shadow-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-white font-audiophile">Install on iPhone / iPad</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> button in Safari.<br />
              2. Choose <strong>Add to Home Screen</strong>.<br />
              3. Open Fatyliser from your home screen!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-white transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

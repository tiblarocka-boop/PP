import React, { useState } from 'react';
import { Power, Info, Download, HelpCircle, Settings } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  isBypassed: boolean;
  onToggleBypass: () => void;
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBypassed,
  onToggleBypass,
  onOpenAbout,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080b12]/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-2.5 flex items-center justify-between gap-2">
      {/* Zone 1: Wordmark & Creator Credit */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 font-audiophile font-black text-xs shadow-sm shadow-cyan-500/30">
          F
        </div>
        <div className="flex flex-col">
          <span className="font-audiophile text-sm font-black tracking-wider text-white">
            FATYLISER
          </span>
          <span className="text-[9px] text-cyan-400/90 font-medium -mt-0.5">
            by pp48
          </span>
        </div>
      </div>

      {/* Zone 2: Informational / PWA / Settings buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install Trigger */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-sm shadow-cyan-500/20 active:scale-95 transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Install</span>
          </button>
        )}

        {/* iOS Safari PWA Prompt */}
        {!isInstalled && isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Install</span>
          </button>
        )}

        {/* Bypass / Poweramp Master Switch */}
        <button
          onClick={onToggleBypass}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
            !isBypassed
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={isBypassed ? 'Fatyliser Bypassed (Click to Enable)' : 'Fatyliser Active (Click to Bypass)'}
        >
          <Power
            className={`w-3.5 h-3.5 ${
              !isBypassed ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
            }`}
          />
          <span>{!isBypassed ? 'EQ ON' : 'BYPASS'}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Audio Routing &amp; Engine Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Info / About trigger */}
        <button
          onClick={onOpenAbout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="About Fatyliser by pp48 &amp; PWA Installation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5 shadow-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-white font-audiophile">Install on iPhone / iPad</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> button in your Safari bottom bar.<br />
              2. Scroll down and choose <strong>Add to Home Screen</strong>.<br />
              3. Open Fatyliser from your home screen for full standalone audio experience!
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

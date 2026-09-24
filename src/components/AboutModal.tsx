import React from 'react';
import { X, ShieldCheck, Cpu, Smartphone, Github, ExternalLink, Zap } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0c101a] border border-slate-800 p-5 shadow-2xl text-slate-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-black font-bold font-audiophile">
              F
            </div>
            <div>
              <h2 className="font-audiophile text-base font-bold tracking-wider text-white">
                Fatyliser
              </h2>
              <p className="text-[11px] text-cyan-400">Poweramp Equalizer recreation by pp48</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Fatyliser</strong> is an audiophile web recreation of Android's legendary{' '}
            <strong>Poweramp Equalizer</strong>, tailored specifically for mobile and web browsers by{' '}
            <strong>pp48</strong>.
          </p>

          {/* Feature Specs */}
          <div className="space-y-2 rounded-xl bg-slate-950/60 border border-slate-800/60 p-3">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Audio Processing Pipeline</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
              <li>High-precision 10, 16, and 32-band parametric &amp; graphic EQ</li>
              <li>Dual Poweramp rotary tone knobs (Bass &amp; Treble)</li>
              <li>Studio peak limiter with dynamic threshold and knee anti-clipping</li>
              <li>Stereo widener matrix &amp; acoustic reverb ambience</li>
              <li>Real-time FFT audio visualizer &amp; dual-channel VU peak meters</li>
              <li>Bypass mode for instant instantaneous A/B comparison</li>
            </ul>
          </div>

          {/* Vercel & GitHub Mobile Installation Guide */}
          <div className="space-y-2 rounded-xl bg-slate-950/60 border border-slate-800/60 p-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Smartphone className="w-4 h-4" />
              <span>How to Install on Mobile (GitHub / Vercel PWA)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              You do not need a PC! You can install Fatyliser directly onto your smartphone home screen:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
              <li>Deploy this repository to <strong>Vercel</strong> or open the preview link.</li>
              <li>
                Tap the <strong>&quot;Install Fatyliser&quot;</strong> button in the app header (or tap{' '}
                <em>Share &rarr; Add to Home Screen</em> in Safari / Chrome).
              </li>
              <li>
                Fatyliser runs completely offline with full standalone full-screen capabilities!
              </li>
            </ol>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 text-center">
            Engineered with high fidelity by pp48 &bull; 2026
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

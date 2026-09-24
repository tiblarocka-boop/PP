import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { Play, Pause, Square, Upload, Mic, MicOff, Volume2, RotateCcw, Music2, Disc, Radio } from 'lucide-react';

interface PlayerBarProps {
  onAudioStart: () => void;
  onToggleSystemCapture?: () => void;
  isSystemCaptureActive?: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  onAudioStart,
  onToggleSystemCapture,
  isSystemCaptureActive = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('pp48 Sub-Bass Groove (Demo)');
  const [sourceType, setSourceType] = useState<'synth' | 'file' | 'mic' | 'system' | 'none'>('synth');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoTracks = [
    { id: 'synth_bass', name: 'pp48 Sub-Bass Groove', desc: '808 kick + deep acid bassline' },
    { id: 'sub_rumble', name: 'Low Frequency Rumble 30Hz', desc: 'Subwoofer & 31-62Hz benchmark' },
    { id: 'electro_groove', name: 'Electro Hi-Energy 128BPM', desc: 'Full spectrum highs, mids & transient kick' },
  ];

  // Poll time for file audio
  useEffect(() => {
    const timer = setInterval(() => {
      const audioEl = audioEngine.getAudioElement();
      if (audioEl && sourceType === 'file') {
        setCurrentTime(audioEl.currentTime);
        setDuration(audioEl.duration || 0);
        setIsPlaying(!audioEl.paused);
      } else {
        setIsPlaying(audioEngine.getIsPlaying());
      }
    }, 250);

    return () => clearInterval(timer);
  }, [sourceType]);

  const handleTogglePlay = async () => {
    onAudioStart();
    await audioEngine.initContext();

    if (isPlaying) {
      audioEngine.stopAllSources();
      setIsPlaying(false);
    } else {
      if (sourceType === 'synth' || sourceType === 'none') {
        await audioEngine.playSyntheticTrack('synth_bass');
        setSourceType('synth');
        setTrackName('pp48 Sub-Bass Groove (Demo)');
        setIsPlaying(true);
      } else if (sourceType === 'file') {
        const audioEl = audioEngine.getAudioElement();
        if (audioEl) {
          await audioEl.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const handleSelectDemoTrack = async (id: string, name: string) => {
    onAudioStart();
    await audioEngine.playSyntheticTrack(id);
    setSourceType('synth');
    setTrackName(`${name} (Demo)`);
    setIsPlaying(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAudioStart();
    try {
      await audioEngine.playFile(file);
      setSourceType('file');
      setTrackName(file.name.replace(/\.[^/.]+$/, ''));
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
    }
    e.target.value = '';
  };

  const handleToggleMic = async () => {
    onAudioStart();
    if (sourceType === 'mic') {
      audioEngine.stopAllSources();
      setSourceType('none');
      setIsPlaying(false);
      setTrackName('Audio Inactive');
    } else {
      try {
        await audioEngine.enableMicrophone();
        setSourceType('mic');
        setTrackName('Live Microphone / Line-In');
        setIsPlaying(true);
      } catch (err) {
        alert('Could not access microphone: ' + (err as Error).message);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const audioEl = audioEngine.getAudioElement();
    if (audioEl && sourceType === 'file') {
      audioEl.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    audioEngine.setMasterVolume(v);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-[#090d16] border-t border-slate-800/80 px-3 py-2.5 flex flex-col gap-2">
      {/* File progress bar if playing file */}
      {sourceType === 'file' && duration > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-num text-slate-500">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="fader-horizontal flex-1 h-1.5"
          />
          <span className="text-[10px] font-num text-slate-500">{formatTime(duration)}</span>
        </div>
      )}

      {/* Main Transport Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Track Info & Source Indicator */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isPlaying
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {sourceType === 'mic' ? (
              <Mic className="w-4 h-4 animate-pulse" />
            ) : isPlaying ? (
              <Disc className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Music2 className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 truncate">{trackName}</span>
              {isPlaying && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 truncate">
              <span>{sourceType.toUpperCase()} MODE</span>
              <span aria-hidden="true">·</span>
              <span>48 kHz 24-bit Hi-Res</span>
            </div>
          </div>
        </div>

        {/* Primary Transport Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Play / Pause button */}
          <button
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
            title={isPlaying ? 'Pause' : 'Play Audio'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Load Phone Audio File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Load audio file from your device"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Microphone Passthrough */}
          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl border transition-colors ${
              sourceType === 'mic'
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Live Microphone / Aux Input"
          >
            {sourceType === 'mic' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* System Audio / YouTube / Spotify Capture button */}
          {onToggleSystemCapture && (
            <button
              onClick={onToggleSystemCapture}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSystemCaptureActive
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-300'
              }`}
              title="Capture System Audio / YouTube / Spotify"
            >
              <Radio className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Demo Sound Selection Pill Tray */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
          Tests:
        </span>
        {demoTracks.map((dt) => (
          <button
            key={dt.id}
            onClick={() => handleSelectDemoTrack(dt.id, dt.name)}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
          >
            {dt.name}
          </button>
        ))}
      </div>
    </div>
  );
};

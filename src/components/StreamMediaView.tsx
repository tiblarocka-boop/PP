import React, { useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import {
  Radio,
  Youtube,
  Music,
  Play,
  Pause,
  Upload,
  Link,
  Volume2,
  Disc,
  Headphones,
  Sparkles,
  ListMusic,
  ExternalLink,
} from 'lucide-react';

interface StreamMediaViewProps {
  onAudioStart: () => void;
  onSetTrackName: (name: string) => void;
}

interface StreamStation {
  id: string;
  name: string;
  genre: string;
  url: string;
  bitrate: string;
  color: string;
}

const CURATED_STATIONS: StreamStation[] = [
  {
    id: 'lofi',
    name: 'Lofi Chill Beats',
    genre: 'Lo-Fi / Hip-Hop',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    bitrate: '320 kbps',
    color: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/40',
  },
  {
    id: 'synthwave',
    name: 'Nightride FM Synthwave',
    genre: 'Retrowave / Electro',
    url: 'https://stream.nightride.fm/nightride.m4a',
    bitrate: 'Hi-Res AAC',
    color: 'from-purple-500/20 to-pink-500/10 text-purple-300 border-purple-500/40',
  },
  {
    id: 'bass_edm',
    name: 'Bass Drive & EDM',
    genre: 'Sub-Bass / Drum & Bass',
    url: 'https://bassdrive.radioca.st/stream',
    bitrate: '192 kbps',
    color: 'from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'deep_house',
    name: 'Deep House Lounge',
    genre: 'Electronic / House',
    url: 'https://stream.zeno.fm/f0b40u82018uv',
    bitrate: '256 kbps',
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'rock_hits',
    name: 'Classic Rock Anthems',
    genre: 'Rock / Alternative',
    url: 'https://stream.zeno.fm/0r0xa792kwzuv',
    bitrate: '192 kbps',
    color: 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-500/40',
  },
  {
    id: 'acoustic_jazz',
    name: 'Audiophile Acoustic & Jazz',
    genre: 'Acoustic / Jazz',
    url: 'https://stream.zeno.fm/7cvs8y9522quv',
    bitrate: 'Hi-Fi 320k',
    color: 'from-sky-500/20 to-indigo-500/10 text-sky-300 border-sky-500/40',
  },
];

export const StreamMediaView: React.FC<StreamMediaViewProps> = ({
  onAudioStart,
  onSetTrackName,
}) => {
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [embeddedVideoId, setEmbeddedVideoId] = useState<string | null>(null);
  const [embeddedSpotifyUri, setEmbeddedSpotifyUri] = useState<string | null>(null);

  // Play Curated Live Stream through Equalizer
  const handlePlayStation = async (station: StreamStation) => {
    onAudioStart();
    setIsLoading(true);
    try {
      if (activeStationId === station.id && audioEngine.getIsPlaying()) {
        audioEngine.stopAllSources();
        setActiveStationId(null);
        onSetTrackName('Stream Paused');
      } else {
        await audioEngine.playStream(station.url);
        setActiveStationId(station.id);
        onSetTrackName(`${station.name} (${station.genre})`);
      }
    } catch (err) {
      alert('Could not start stream. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Play Custom Audio Stream Link
  const handlePlayCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    onAudioStart();
    setIsLoading(true);
    try {
      // Check if it's a Spotify link
      if (customUrl.includes('spotify.com')) {
        const match = customUrl.match(/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
          setEmbeddedSpotifyUri(`https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`);
          onSetTrackName('Spotify Web Player Embedded');
          setIsLoading(false);
          return;
        }
      }

      // Check if it's a YouTube link
      if (customUrl.includes('youtube.com') || customUrl.includes('youtu.be')) {
        let videoId = '';
        if (customUrl.includes('youtu.be/')) {
          videoId = customUrl.split('youtu.be/')[1].split('?')[0];
        } else {
          const params = new URLSearchParams(new URL(customUrl).search);
          videoId = params.get('v') || '';
        }
        if (videoId) {
          setEmbeddedVideoId(videoId);
          onSetTrackName('YouTube Video Player Embedded');
          setIsLoading(false);
          return;
        }
      }

      // Standard direct audio stream / MP3 URL
      await audioEngine.playStream(customUrl.trim());
      setActiveStationId('custom');
      onSetTrackName('Custom Live Stream');
    } catch (err) {
      alert('Could not play stream URL: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick load YouTube video by ID or search
  const handleLoadYouTube = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeQuery.trim()) return;

    let id = youtubeQuery.trim();
    if (id.includes('youtu.be/')) {
      id = id.split('youtu.be/')[1].split('?')[0];
    } else if (id.includes('v=')) {
      id = id.split('v=')[1].split('&')[0];
    }

    setEmbeddedVideoId(id);
    onSetTrackName(`YouTube Audio: ${id}`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Zero Heavy Lifting Guarantee */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-audiophile text-xs font-black tracking-wider text-white">
              INTEGRATED STREAM &amp; MEDIA
            </h3>
            <p className="text-[10px] text-slate-400">
              Zero setup required • All music passes directly through 32-band EQ
            </p>
          </div>
        </div>
      </div>

      {/* Embedded YouTube Player if active */}
      {embeddedVideoId && (
        <div className="rounded-2xl overflow-hidden border border-red-500/40 bg-slate-950 shadow-2xl space-y-2 p-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
              <Youtube className="w-4 h-4" />
              <span>Embedded YouTube Player</span>
            </div>
            <button
              onClick={() => setEmbeddedVideoId(null)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${embeddedVideoId}?autoplay=1&enablejsapi=1`}
              title="YouTube Player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-[10px] text-slate-400 px-2 pb-1">
            Audio plays through your phone speakers/headphones while Fatyliser's EQ &amp; Limiter shape your sound!
          </p>
        </div>
      )}

      {/* Embedded Spotify Player if active */}
      {embeddedSpotifyUri && (
        <div className="rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-2xl p-2 space-y-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Music className="w-4 h-4" />
              <span>Spotify Player</span>
            </div>
            <button
              onClick={() => setEmbeddedSpotifyUri(null)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="w-full h-24 rounded-xl overflow-hidden bg-black">
            <iframe
              src={embeddedSpotifyUri}
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0"
            />
          </div>
        </div>
      )}

      {/* 1. Quick YouTube & Spotify Link Input */}
      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <Link className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200">
            Paste YouTube, Spotify, or Audio Stream Link
          </span>
        </div>
        <form onSubmit={handlePlayCustomUrl} className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste YouTube video, Spotify track, or MP3 stream URL..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-num"
          />
          <button
            type="submit"
            disabled={isLoading || !customUrl.trim()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Load</span>
          </button>
        </form>
      </div>

      {/* 2. Curated 24/7 Hi-Fi Live Stations (Directly through EQ & Limiter) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-audiophile font-bold tracking-wider text-slate-300">
            24/7 LIVE HI-FI EQUALIZER STREAMS
          </span>
          <span className="text-[10px] text-cyan-400 font-medium">100% Equalized</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CURATED_STATIONS.map((station) => {
            const isPlayingThis = activeStationId === station.id && audioEngine.getIsPlaying();
            return (
              <button
                key={station.id}
                onClick={() => handlePlayStation(station)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between bg-gradient-to-br ${
                  station.color
                } ${
                  isPlayingThis
                    ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'hover:brightness-110'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-xs text-white truncate">{station.name}</div>
                  <div className="text-[10px] text-slate-400">{station.genre}</div>
                  <div className="text-[9px] font-num text-slate-500 mt-0.5">{station.bitrate}</div>
                </div>

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isPlayingThis
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                      : 'bg-slate-900/80 text-white border-slate-700/60'
                  }`}
                >
                  {isPlayingThis ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../utils/audioEngine';
import {
  RadioStation,
  TOP_GENRES,
  TOP_COUNTRIES,
  CURATED_FEATURED_STATIONS,
  fetchRadioStations,
  getFavoriteStations,
  saveFavoriteStation,
} from '../utils/radioBrowserApi';
import {
  Radio,
  Search,
  Star,
  Play,
  Pause,
  Loader2,
  Globe,
  Sparkles,
  Link,
  Volume2,
  Music,
  Youtube,
  RefreshCw,
} from 'lucide-react';

interface StreamMediaViewProps {
  onAudioStart: () => void;
  onSetTrackName: (name: string) => void;
}

export const StreamMediaView: React.FC<StreamMediaViewProps> = ({
  onAudioStart,
  onSetTrackName,
}) => {
  // Navigation & Filter state
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFavoritesView, setIsFavoritesView] = useState<boolean>(false);

  // Stations & Loading state
  const [stations, setStations] = useState<RadioStation[]>(CURATED_FEATURED_STATIONS);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<RadioStation[]>(() => getFavoriteStations());

  // Active playing station state synced from audio engine
  const [activeStationUuid, setActiveStationUuid] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // Custom Stream URL input
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [embeddedVideoId, setEmbeddedVideoId] = useState<string | null>(null);
  const [embeddedSpotifyUri, setEmbeddedSpotifyUri] = useState<string | null>(null);

  // Subscribe to Audio Engine Playback updates
  useEffect(() => {
    const unsubscribe = audioEngine.subscribePlayback((state) => {
      setActiveStationUuid(state.stationId);
      setIsPlaying(state.isPlaying);
      setIsBuffering(state.isBuffering);
      if (state.stationId) {
        onSetTrackName(state.trackTitle);
      }
    });
    return unsubscribe;
  }, [onSetTrackName]);

  // Load stations when genre, country, or search changes
  const loadStations = useCallback(async () => {
    if (isFavoritesView) {
      setStations(getFavoriteStations());
      return;
    }

    setIsLoadingStations(true);
    try {
      const results = await fetchRadioStations({
        tag: selectedTag,
        countryCode: selectedCountry,
        searchQuery,
        limit: 36,
      });
      setStations(results.length > 0 ? results : CURATED_FEATURED_STATIONS);
    } catch {
      setStations(CURATED_FEATURED_STATIONS);
    } finally {
      setIsLoadingStations(false);
    }
  }, [selectedTag, selectedCountry, searchQuery, isFavoritesView]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadStations();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [loadStations]);

  // Play / Pause station
  const handleToggleStation = async (station: RadioStation) => {
    onAudioStart();
    const streamUrl = station.url_resolved || station.url;

    if (activeStationUuid === station.stationuuid && isPlaying) {
      audioEngine.stopAllSources();
      onSetTrackName('Stream Paused');
    } else {
      try {
        const countryLabel = station.country ? `[${station.country}] ` : '';
        const title = `${countryLabel}${station.name}`;
        await audioEngine.playStream(streamUrl, title, station.stationuuid);
        onSetTrackName(title);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('Playback notice:', err);
        }
      }
    }
  };

  // Toggle favorite station
  const handleToggleFavorite = (station: RadioStation, e: React.MouseEvent) => {
    e.stopPropagation();
    saveFavoriteStation(station);
    const updated = getFavoriteStations();
    setFavorites(updated);
    if (isFavoritesView) {
      setStations(updated);
    }
  };

  const isStationFavorited = (station: RadioStation) => {
    return favorites.some((f) => f.stationuuid === station.stationuuid);
  };

  // Handle Custom Stream URL / YouTube / Spotify
  const handlePlayCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    onAudioStart();
    try {
      if (customUrl.includes('spotify.com')) {
        const match = customUrl.match(/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
          setEmbeddedSpotifyUri(`https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`);
          onSetTrackName('Spotify Web Player Embedded');
          return;
        }
      }

      if (customUrl.includes('youtube.com') || customUrl.includes('youtu.be')) {
        let videoId = '';
        if (customUrl.includes('youtu.be/')) {
          videoId = customUrl.split('youtu.be/')[1].split('?')[0];
        } else {
          const match = customUrl.match(/v=([^&]+)/);
          if (match) videoId = match[1];
        }

        if (videoId) {
          setEmbeddedVideoId(videoId);
          onSetTrackName(`YouTube Audio: ${videoId}`);
          return;
        }
      }

      await audioEngine.playStream(customUrl.trim(), 'Custom Live Stream', 'custom');
      onSetTrackName('Custom Live Audio Stream');
    } catch {
      alert('Could not connect to this stream link. Please verify URL is a direct MP3/AAC audio stream.');
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Top Search & Filter Bar */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-audiophile text-xs font-black tracking-wider text-white">
              RADIO GARDEN &amp; WORLD EXPLORER
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            40,000+ STATIONS
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsFavoritesView(false);
            }}
            placeholder="Search stations, cities, artists, or frequencies..."
            className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick View Switches: All vs Favorites vs Custom */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setIsFavoritesView(false);
                setSelectedTag('');
                setSelectedCountry('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                !isFavoritesView
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Explore All
            </button>

            <button
              onClick={() => setIsFavoritesView(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                isFavoritesView
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Star className="w-3 h-3 fill-current text-amber-400" />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Link className="w-3 h-3" />
            <span>{showCustomInput ? 'Hide URL' : 'Paste Link'}</span>
          </button>
        </div>
      </div>

      {/* Custom Stream URL / YouTube / Spotify Drawer */}
      {showCustomInput && (
        <form
          onSubmit={handlePlayCustomUrl}
          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex gap-2 animate-in fade-in"
        >
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste direct audio stream URL, YouTube link, or Spotify URI..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0"
          >
            Load
          </button>
        </form>
      )}

      {/* Embedded YouTube / Spotify Players */}
      {embeddedVideoId && (
        <div className="rounded-xl overflow-hidden border border-red-500/40 bg-slate-950 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <Youtube className="w-4 h-4" /> YouTube Player
            </span>
            <button
              onClick={() => setEmbeddedVideoId(null)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${embeddedVideoId}?autoplay=1`}
            title="YouTube Video"
            className="w-full aspect-video rounded-lg border-0"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {embeddedSpotifyUri && (
        <div className="rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Music className="w-4 h-4" /> Spotify Player
            </span>
            <button
              onClick={() => setEmbeddedSpotifyUri(null)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <iframe
            src={embeddedSpotifyUri}
            width="100%"
            height="80"
            className="border-0 rounded-lg"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen"
          />
        </div>
      )}

      {!isFavoritesView && (
        <>
          {/* Genre Category Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Select Genre
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TOP_GENRES.map((g) => {
                const isSelected = selectedTag === g.tag;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedTag(g.tag);
                      setIsFavoritesView(false);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country Category Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Select Country
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TOP_COUNTRIES.map((c) => {
                const isSelected = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => {
                      setSelectedCountry(c.code);
                      setIsFavoritesView(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Stations Grid Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-[11px] font-audiophile font-bold tracking-wider text-slate-300">
          {isFavoritesView
            ? 'FAVORITE STATIONS'
            : selectedTag
            ? `${selectedTag.toUpperCase()} STATIONS`
            : selectedCountry !== 'ALL'
            ? `${selectedCountry} STATIONS`
            : 'TOP GLOBAL STATIONS'}
        </span>
        <button
          onClick={loadStations}
          disabled={isLoadingStations}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          title="Refresh Station List"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingStations ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoadingStations && (
        <div className="flex items-center justify-center p-8 gap-2 text-xs text-slate-400 font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Connecting to World Radio Database...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingStations && stations.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
          <Radio className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            {isFavoritesView
              ? 'No favorite stations saved yet. Tap the star icon on any station to save it here!'
              : 'No stations found for this filter. Try selecting another genre or country.'}
          </p>
        </div>
      )}

      {/* Station Grid */}
      {!isLoadingStations && stations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stations.map((station) => {
            const isThisPlaying = activeStationUuid === station.stationuuid && isPlaying;
            const isThisBuffering = activeStationUuid === station.stationuuid && isBuffering;
            const isFav = isStationFavorited(station);

            return (
              <div
                key={station.stationuuid}
                onClick={() => handleToggleStation(station)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isThisPlaying
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Station Logo / Favicon */}
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and fallback to icon
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Radio className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>

                  {/* Station Info */}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{station.name}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                      <span>{station.country || 'Global'}</span>
                      {station.codec && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[9px] font-num text-cyan-400">
                            {station.codec} {station.bitrate ? `${station.bitrate}k` : ''}
                          </span>
                        </>
                      )}
                    </div>

                    {station.tags && (
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">
                        {station.tags.split(',').slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Favorite Star & Play/Pause */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleToggleFavorite(station, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                      }`}
                    />
                  </button>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isThisPlaying
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm shadow-cyan-400/50'
                        : 'bg-slate-900/90 text-white border-slate-700/80 hover:border-cyan-500/50'
                    }`}
                  >
                    {isThisBuffering ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

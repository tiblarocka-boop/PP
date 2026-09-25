// Radio Garden & Radio-Browser Worldwide Database Client
// Connects to global free community mirrors with automatic failover and CORS streaming

export interface RadioStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state?: string;
  language?: string;
  votes: number;
  codec: string;
  bitrate: number;
}

export interface GenreCategory {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
}

export interface CountryCategory {
  code: string;
  name: string;
  flag: string;
}

export const TOP_GENRES: GenreCategory[] = [
  { id: 'all', name: 'All Genres', tag: '', icon: '✨', color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300' },
  { id: 'electronic', name: 'Electronic / EDM', tag: 'electronic', icon: '⚡', color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-300' },
  { id: 'rock', name: 'Rock & Classic', tag: 'rock', icon: '🎸', color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-300' },
  { id: 'bass', name: 'Drum & Bass / 808', tag: 'drum and bass', icon: '🔊', color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/40 text-cyan-300' },
  { id: 'lofi', name: 'Lo-Fi & Chill', tag: 'lofi', icon: '☕', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300' },
  { id: 'ambient', name: 'Ambient & Drone (Sub-Bass)', tag: 'ambient', icon: '🌌', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300' },
  { id: 'synthwave', name: 'Synthwave & 80s', tag: 'synthwave', icon: '🌆', color: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/40 text-fuchsia-300' },
  { id: 'hiphop', name: 'Hip-Hop & Urban', tag: 'hip hop', icon: '🎤', color: 'from-orange-500/20 to-amber-500/10 border-orange-500/40 text-orange-300' },
  { id: 'pop', name: 'Pop & Top 40', tag: 'pop', icon: '🌟', color: 'from-pink-500/20 to-rose-500/10 border-pink-500/40 text-pink-300' },
  { id: 'jazz', name: 'Jazz & Blues', tag: 'jazz', icon: '🎷', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300' },
  { id: 'classical', name: 'Classical & Acoustic', tag: 'classical', icon: '🎻', color: 'from-amber-600/20 to-yellow-600/10 border-amber-600/40 text-amber-200' },
  { id: 'metal', name: 'Metal & Heavy', tag: 'metal', icon: '🔥', color: 'from-red-600/20 to-rose-600/10 border-red-600/40 text-red-300' },
  { id: 'reggae', name: 'Reggae & Dub', tag: 'reggae', icon: '🌴', color: 'from-lime-500/20 to-green-500/10 border-lime-500/40 text-lime-300' },
  { id: 'talk', name: 'News & Talk', tag: 'news', icon: '📻', color: 'from-slate-500/20 to-slate-700/10 border-slate-500/40 text-slate-300' },
];

export const TOP_COUNTRIES: CountryCategory[] = [
  { code: 'ALL', name: 'Worldwide', flag: '🌐' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
];

// Fallback verified 24/7 stations if device is offline or API fails
export const CURATED_FEATURED_STATIONS: RadioStation[] = [
  {
    stationuuid: 'somafm-groovesalad',
    changeuuid: '1',
    name: 'SomaFM Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    url_resolved: 'https://ice1.somafm.com/groovesalad-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/groovesalad120.png',
    tags: 'ambient,chill,downtempo,electronic',
    country: 'United States',
    countrycode: 'US',
    votes: 9999,
    codec: 'MP3',
    bitrate: 128,
  },
  {
    stationuuid: 'bassdrive-live',
    changeuuid: '2',
    name: 'BassDrive Worldwide D&B',
    url: 'https://bassdrive.radioca.st/stream',
    url_resolved: 'https://bassdrive.radioca.st/stream',
    homepage: 'https://bassdrive.com',
    favicon: '',
    tags: 'drum and bass,electronic,bass',
    country: 'United States',
    countrycode: 'US',
    votes: 9500,
    codec: 'MP3',
    bitrate: 192,
  },
  {
    stationuuid: 'nightride-synthwave',
    changeuuid: '3',
    name: 'Nightride FM Synthwave',
    url: 'https://stream.nightride.fm/nightride.m4a',
    url_resolved: 'https://stream.nightride.fm/nightride.m4a',
    homepage: 'https://nightride.fm',
    favicon: 'https://nightride.fm/img/logo.png',
    tags: 'synthwave,retro,electro,80s',
    country: 'United States',
    countrycode: 'US',
    votes: 8900,
    codec: 'AAC',
    bitrate: 256,
  },
  {
    stationuuid: 'somafm-dronezone',
    changeuuid: '4',
    name: 'Drone Zone Audiophile (Sub-Bass)',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    url_resolved: 'https://ice1.somafm.com/dronezone-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/dronezone120.jpg',
    tags: 'ambient,drone,sub-bass,space',
    country: 'United States',
    countrycode: 'US',
    votes: 8400,
    codec: 'MP3',
    bitrate: 128,
  },
  {
    stationuuid: 'somafm-defcon',
    changeuuid: '5',
    name: 'DEF CON Cyber Radio',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    url_resolved: 'https://ice1.somafm.com/defcon-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/defcon120.png',
    tags: 'electronic,hacker,industrial',
    country: 'United States',
    countrycode: 'US',
    votes: 7800,
    codec: 'MP3',
    bitrate: 128,
  },
  {
    stationuuid: 'somafm-lush',
    changeuuid: '6',
    name: 'Lush Sensual Chillout',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    url_resolved: 'https://ice1.somafm.com/lush-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/lush120.jpg',
    tags: 'vocal,chillout,triphop',
    country: 'United States',
    countrycode: 'US',
    votes: 7200,
    codec: 'MP3',
    bitrate: 128,
  },
  {
    stationuuid: 'somafm-secretagent',
    changeuuid: '7',
    name: 'Secret Agent 007 Lounge',
    url: 'https://ice1.somafm.com/secretagent-128-mp3',
    url_resolved: 'https://ice1.somafm.com/secretagent-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/secretagent120.jpg',
    tags: 'spy,lounge,surf,classic',
    country: 'United States',
    countrycode: 'US',
    votes: 6900,
    codec: 'MP3',
    bitrate: 128,
  },
  {
    stationuuid: 'somafm-suburbsofgoa',
    changeuuid: '8',
    name: 'Suburbs of Goa Asian Beats',
    url: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    url_resolved: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/suburbsofgoa120.jpg',
    tags: 'world,beats,desi,chill',
    country: 'United States',
    countrycode: 'US',
    votes: 6500,
    codec: 'MP3',
    bitrate: 128,
  },
];

// Radio-Browser global API mirrors
const API_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];

let activeMirrorIndex = 0;

function getApiUrl(): string {
  return API_MIRRORS[activeMirrorIndex % API_MIRRORS.length];
}

function rotateMirror(): void {
  activeMirrorIndex = (activeMirrorIndex + 1) % API_MIRRORS.length;
}

// In-memory request cache
const requestCache = new Map<string, { timestamp: number; data: RadioStation[] }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function fetchRadioStations(params: {
  tag?: string;
  countryCode?: string;
  searchQuery?: string;
  limit?: number;
}): Promise<RadioStation[]> {
  const { tag, countryCode, searchQuery, limit = 30 } = params;

  const cacheKey = `${tag || ''}_${countryCode || ''}_${searchQuery || ''}_${limit}`;
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const queryParams = new URLSearchParams();
  queryParams.set('limit', String(limit));
  queryParams.set('hidebroken', 'true');
  queryParams.set('order', 'votes');
  queryParams.set('reverse', 'true');

  if (tag && tag.trim()) {
    queryParams.set('tag', tag.trim());
  }

  if (countryCode && countryCode !== 'ALL') {
    queryParams.set('countrycode', countryCode);
  }

  if (searchQuery && searchQuery.trim()) {
    queryParams.set('name', searchQuery.trim());
  }

  // Try mirrors with failover
  for (let attempt = 0; attempt < API_MIRRORS.length; attempt++) {
    const baseUrl = getApiUrl();
    const endpoint = `${baseUrl}/json/stations/search?${queryParams.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FatyliserEqualizer/2.0 (Audio DSP App)',
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        rotateMirror();
        continue;
      }

      const data: RadioStation[] = await res.json();
      if (Array.isArray(data)) {
        // Filter out stations with empty or broken audio URLs
        const valid = data.filter((s) => s.url_resolved || s.url);
        requestCache.set(cacheKey, { timestamp: Date.now(), data: valid });
        return valid;
      }
    } catch {
      rotateMirror();
    }
  }

  // Fallback to curated if offline or all mirrors timed out
  return CURATED_FEATURED_STATIONS.filter((s) => {
    if (tag && !s.tags.toLowerCase().includes(tag.toLowerCase())) return false;
    if (countryCode && countryCode !== 'ALL' && s.countrycode !== countryCode) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
}

// Local Storage for Favorited Stations
const FAVORITES_KEY = 'fatyliser_favorite_radio_stations_v1';

export function getFavoriteStations(): RadioStation[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteStation(station: RadioStation): boolean {
  try {
    const current = getFavoriteStations();
    const exists = current.some((s) => s.stationuuid === station.stationuuid);
    let next: RadioStation[];
    if (exists) {
      next = current.filter((s) => s.stationuuid !== station.stationuuid);
    } else {
      next = [station, ...current];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return !exists; // true if added, false if removed
  } catch {
    return false;
  }
}

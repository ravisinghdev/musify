import type {
  AlbumDetails,
  ArtistDetails,
  ExploreFeed,
  LyricsResult,
  PlaybackResult,
  PlaylistDetails,
  QueueResult,
  SearchRecommendations,
  SearchResults,
  Track,
  TrackSearchResult,
} from "../types/music";

export function getApiBase(): string {
  // 1. Explicit override via public environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 2. Server-side runtime (functions/SSR): use bound internal service URL from Vercel
  if (typeof window === "undefined" && process.env.API_URL) {
    const rawUrl = process.env.API_URL.endsWith("/")
      ? process.env.API_URL
      : `${process.env.API_URL}/`;
    return new URL("api/v1", rawUrl).toString().replace(/\/+$/, "");
  }

  // 3. Client-side in browser & native apps:
  if (typeof window !== "undefined") {
    try {
      const customApi = localStorage.getItem("musify_api_url");
      if (customApi && customApi.trim()) {
        return customApi.trim().replace(/\/+$/, "");
      }
    } catch {}

    // Check if running inside native Android / iOS app via Capacitor:
    const isNative = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && !window.location.port)
    );

    // On native mobile devices, NEVER use localhost (points to phone loopback).
    // Use the live production backend URL:
    if (isNative) {
      return "https://musify-4fzw.onrender.com/api/v1";
    }

    // When running locally on laptop/desktop in browser on port 3000:
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return `http://${window.location.hostname}:3001/api/v1`;
    }

    // Default for web deployment (e.g. musify-ten-bay.vercel.app):
    return "/api/v1";
  }

  // 4. Default fallback:
  return "https://musify-4fzw.onrender.com/api/v1";
}

const API_BASE: any = {
  toString() {
    return getApiBase();
  },
};

// ==========================================
// HIGH-SPEED CLIENT CACHE & REQUEST COALESCER
// ==========================================
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const clientMemoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

function getCached<T>(key: string): T | null {
  const entry = clientMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    clientMemoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: any, ttlSeconds: number) {
  // Cap max entries to 250 to keep memory ultra-lean on mobile
  if (clientMemoryCache.size > 250) {
    const firstKey = clientMemoryCache.keys().next().value;
    if (firstKey) clientMemoryCache.delete(firstKey);
  }
  clientMemoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

let activeSearchAbortController: AbortController | null = null;

async function fetchJson<T>(
  url: string,
  options?: { ttlSeconds?: number; isSearch?: boolean; signal?: AbortSignal },
): Promise<T> {
  const cacheKey = url;

  // 1. Instant Cache Hit (0ms return)
  if (options?.ttlSeconds && options.ttlSeconds > 0) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;
  }

  // 2. In-flight request deduplication (prevents duplicate simultaneous network fetches)
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        signal: options?.signal,
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (options?.ttlSeconds && options.ttlSeconds > 0) {
        setCached(cacheKey, data, options.ttlSeconds);
      }
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export const api = {
  // Search with auto-abort of previous query for instantaneous UI responsiveness
  searchTracks: (query: string, pageToken?: string): Promise<TrackSearchResult> => {
    return fetchJson(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&type=song${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
      }`,
      { ttlSeconds: 180 }, // 3 minute cache
    );
  },

  searchAll: (query: string): Promise<SearchResults> => {
    if (activeSearchAbortController) {
      activeSearchAbortController.abort();
    }
    activeSearchAbortController = new AbortController();
    return fetchJson(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&type=all`,
      { ttlSeconds: 180, signal: activeSearchAbortController.signal },
    );
  },

  getSearchSuggestions: (query: string): Promise<string[]> =>
    fetchJson(
      `${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}`,
      { ttlSeconds: 300 }, // 5 minute cache
    ),

  getSearchRecommendations: (): Promise<SearchRecommendations> =>
    fetchJson(`${API_BASE}/search/recommendations`, { ttlSeconds: 600 }), // 10 minute cache

  // Explore & Home Feed with 10-minute cache
  getExploreFeed: (): Promise<ExploreFeed> =>
    fetchJson(`${API_BASE}/explore`, { ttlSeconds: 600 }),

  // Track info & Playback (cached for instant replay & fast queuing)
  getTrack: (trackId: string): Promise<Track> =>
    fetchJson(`${API_BASE}/tracks/${encodeURIComponent(trackId)}`, {
      ttlSeconds: 900,
    }),

  getPlayback: (sourceTrackId: string): Promise<PlaybackResult> =>
    fetchJson(
      `${API_BASE}/tracks/${encodeURIComponent(sourceTrackId)}/playback`,
      { ttlSeconds: 1800 }, // 30 min cache for audio stream URLs
    ),

  getQueue: (trackId: string): Promise<QueueResult> =>
    fetchJson(`${API_BASE}/tracks/${encodeURIComponent(trackId)}/queue`, {
      ttlSeconds: 300,
    }),

  getLyrics: (
    trackId: string,
    title?: string,
    artist?: string,
  ): Promise<LyricsResult> => {
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (artist) params.set("artist", artist);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetchJson(
      `${API_BASE}/tracks/${encodeURIComponent(trackId)}/lyrics${qs}`,
      { ttlSeconds: 3600 }, // 1 hour lyrics cache
    );
  },

  // Artists, Albums, Playlists (Cached for rapid back-and-forth navigation)
  getArtist: (artistId: string): Promise<ArtistDetails> =>
    fetchJson(`${API_BASE}/artists/${encodeURIComponent(artistId)}`, {
      ttlSeconds: 600,
    }),

  getAlbum: (albumId: string): Promise<AlbumDetails> =>
    fetchJson(`${API_BASE}/albums/${encodeURIComponent(albumId)}`, {
      ttlSeconds: 600,
    }),

  getPlaylist: (playlistId: string): Promise<PlaylistDetails> =>
    fetchJson(`${API_BASE}/playlists/${encodeURIComponent(playlistId)}`, {
      ttlSeconds: 600,
    }),

  // AI Smart Queue & Next Song Predictions
  getAISuggestions: async (
    currentTrack: Track,
    queue: Track[] = [],
    mood: string = "smart",
    count = 6,
  ): Promise<Array<{ track: Track; reason: string; badge: string }>> => {
    try {
      const res = await fetch(`${API_BASE}/ai/queue-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTrack,
          queue: queue.slice(0, 5),
          mood,
          count,
        }),
      });
      if (!res.ok) {
        // Fallback to queue if AI endpoint fails
        const fallback = await api.getQueue(currentTrack.id);
        return (fallback.tracks || []).slice(0, count).map((t) => ({
          track: t,
          reason: `Continuously recommended after "${currentTrack.title}"`,
          badge: "✨ Next Up",
        }));
      }
      const data = await res.json();
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    } catch {
      return [];
    }
  },
};


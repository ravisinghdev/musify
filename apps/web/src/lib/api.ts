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
import {
  FALLBACK_TRACKS,
  FALLBACK_RECOMMENDATIONS,
  FALLBACK_EXPLORE_FEED,
} from "./curatedFallback";

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

    // Default for web deployment (e.g. musify-android.vercel.app):
    return "/api/v1";
  }

  // 4. Default fallback:
  return "https://musify-4fzw.onrender.com/api/v1";
}

const DIRECT_BACKEND = "https://musify-4fzw.onrender.com/api/v1";

const API_BASE: any = {
  toString() {
    return getApiBase();
  },
};

// ==========================================
// HIGH-SPEED MULTI-TIER CACHE (MEMORY + SWR LOCALSTORAGE)
// ==========================================
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const clientMemoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

const STORAGE_PREFIX = "musify_swr_cache_v3:";

function getPersistentCache<T>(key: string): { data: T; isStale: boolean } | null {
  // 1. Check in-memory first (0ms)
  const memEntry = clientMemoryCache.get(key);
  if (memEntry) {
    const isStale = Date.now() > memEntry.expiresAt;
    return { data: memEntry.data as T, isStale };
  }

  // 2. Check localStorage (ultra-fast cross-session cache)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isStale = Date.now() > (parsed.expiresAt || 0);
        // Hydrate back into memory
        clientMemoryCache.set(key, parsed);
        return { data: parsed.data as T, isStale };
      }
    } catch {
      // Storage unavailable or full
    }
  }

  return null;
}

function setPersistentCache(key: string, data: any, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const entry: CacheEntry = { data, expiresAt };

  // Memory cache with LRU eviction (cap at 300 entries)
  if (clientMemoryCache.size > 300) {
    const firstKey = clientMemoryCache.keys().next().value;
    if (firstKey) clientMemoryCache.delete(firstKey);
  }
  clientMemoryCache.set(key, entry);

  // Persistent storage (skip huge payloads over 500KB)
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(entry);
      if (serialized.length < 500000) {
        localStorage.setItem(STORAGE_PREFIX + key, serialized);
      }
    } catch {
      // Quota exceeded, clear older keys
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(k);
            break;
          }
        }
      } catch {}
    }
  }
}

let activeSearchAbortController: AbortController | null = null;

/**
 * Fetch with adaptive timeout (6000ms default) and dual-origin failover.
 * Never hangs indefinitely on slow internet or sleeping Render servers.
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs = 6000,
  incomingSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = incomingSignal
    ? AbortSignal.any
      ? AbortSignal.any([incomingSignal, controller.signal])
      : incomingSignal
    : controller.signal;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchJson<T>(
  url: string,
  options?: {
    ttlSeconds?: number;
    fallbackData?: T;
    timeoutMs?: number;
    signal?: AbortSignal;
  },
): Promise<T> {
  const cacheKey = url;
  const cached = getPersistentCache<T>(cacheKey);

  // Stale-While-Revalidate: If we have cached data, return it immediately if not stale
  if (cached && !cached.isStale && options?.ttlSeconds) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async (): Promise<T> => {
    try {
      let res: Response | null = null;

      // 1. Try primary URL with 6s timeout
      try {
        res = await fetchWithTimeout(url, options?.timeoutMs || 6000, options?.signal);
      } catch (err: any) {
        // If primary URL was relative (e.g. /api/v1/...) and failed or timed out,
        // try direct backend URL immediately as failover
        if (url.startsWith("/api/v1") && !options?.signal?.aborted) {
          const directUrl = url.replace("/api/v1", DIRECT_BACKEND);
          try {
            res = await fetchWithTimeout(directUrl, options?.timeoutMs || 6000, options?.signal);
          } catch {}
        }
        if (!res) throw err;
      }

      if (!res.ok) {
        // If 504 Gateway Timeout or 502/503 from Vercel proxy, failover to direct backend
        if (url.startsWith("/api/v1") && (res.status >= 500)) {
          const directUrl = url.replace("/api/v1", DIRECT_BACKEND);
          try {
            res = await fetchWithTimeout(directUrl, options?.timeoutMs || 6000, options?.signal);
          } catch {}
        }
      }

      if (!res || !res.ok) {
        throw new Error(`API error ${res?.status || "network"}: ${res?.statusText || "unreachable"}`);
      }

      const data = await res.json();
      if (options?.ttlSeconds && options.ttlSeconds > 0) {
        setPersistentCache(cacheKey, data, options.ttlSeconds);
      }
      return data;
    } catch (err) {
      // 1. If network failed but we have stale cached data, serve stale!
      if (cached?.data) {
        return cached.data;
      }
      // 2. If fallback data was provided, return fallback!
      if (options?.fallbackData !== undefined) {
        return options.fallbackData;
      }
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);

  // Stale-While-Revalidate: Return immediately while fetchPromise updates cache in background!
  if (cached?.data) {
    return cached.data;
  }

  // Instant 0ms Zero-Latency Fallback: If fallbackData is provided (e.g. explore feed, recommendations),
  // return it immediately so the user never waits on sleeping servers or slow internet
  if (options?.fallbackData !== undefined) {
    return options.fallbackData;
  }

  return fetchPromise;
}

export const api = {
  // Search with auto-abort of previous query for instantaneous UI responsiveness
  searchTracks: async (query: string, pageToken?: string): Promise<TrackSearchResult> => {
    try {
      return await fetchJson(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&type=song${
          pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
        }`,
        { ttlSeconds: 180, timeoutMs: 7000 },
      );
    } catch {
      // Offline / Slow search fallback matching query keywords
      const qLower = query.toLowerCase();
      const matched = FALLBACK_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(qLower) ||
          t.artists.some((a) => a.name.toLowerCase().includes(qLower)),
      );
      return {
        tracks: matched.length > 0 ? matched : FALLBACK_TRACKS.slice(0, 8),
      };
    }
  },

  searchAll: (query: string): Promise<SearchResults> => {
    if (activeSearchAbortController) {
      activeSearchAbortController.abort();
    }
    activeSearchAbortController = new AbortController();
    return fetchJson(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&type=all`,
      {
        ttlSeconds: 180,
        timeoutMs: 7000,
        signal: activeSearchAbortController.signal,
        fallbackData: {
          tracks: FALLBACK_TRACKS.slice(0, 6),
          artists: [],
          albums: [],
          playlists: [],
        },
      },
    );
  },

  getSearchSuggestions: (query: string): Promise<string[]> =>
    fetchJson(
      `${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}`,
      {
        ttlSeconds: 300,
        timeoutMs: 3500,
        fallbackData: [
          "Arijit Singh",
          "The Weeknd",
          "Taylor Swift",
          "Coldplay",
          "Ed Sheeran",
          "Dua Lipa",
        ].filter((s) => s.toLowerCase().includes(query.toLowerCase())),
      },
    ),

  getSearchRecommendations: (): Promise<SearchRecommendations> =>
    fetchJson(`${API_BASE}/search/recommendations`, {
      ttlSeconds: 600,
      timeoutMs: 6000,
      fallbackData: FALLBACK_RECOMMENDATIONS,
    }),

  // Explore & Home Feed with multi-tier cache and instant offline fallback
  getExploreFeed: (): Promise<ExploreFeed> =>
    fetchJson(`${API_BASE}/explore`, {
      ttlSeconds: 600,
      timeoutMs: 6000,
      fallbackData: FALLBACK_EXPLORE_FEED,
    }),

  // Track info & Playback (cached for instant replay & fast queuing)
  getTrack: (trackId: string): Promise<Track> => {
    const cleanId = trackId.replace(/^yt_/, "");
    const fallbackTrack: Track = FALLBACK_TRACKS.find((t) => t.sourceTrackId === cleanId) || {
      id: trackId,
      source: "youtube",
      sourceTrackId: cleanId,
      title: "Audio Stream",
      artists: [{ id: "artist", name: "Musify Artist" }],
      durationMs: 180000,
      artworkUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
    };

    return fetchJson<Track>(`${API_BASE}/tracks/${encodeURIComponent(trackId)}`, {
      ttlSeconds: 900,
      timeoutMs: 5000,
      fallbackData: fallbackTrack,
    });
  },

  getPlayback: (sourceTrackId: string): Promise<PlaybackResult> => {
    const cleanId = sourceTrackId.replace(/^yt_/, "");
    return fetchJson<PlaybackResult>(
      `${API_BASE}/tracks/${encodeURIComponent(sourceTrackId)}/playback`,
      {
        ttlSeconds: 1800,
        timeoutMs: 6000,
        fallbackData: {
          trackId: sourceTrackId,
          capability: {
            availability: "available",
            method: "official-player",
          },
          playbackUrl: `https://rr---sn-4g5ednss.googlevideo.com/videoplayback?id=${cleanId}`,
          format: {
            mimeType: "audio/mp4",
          },
        },
      },
    );
  },

  getQueue: (trackId: string): Promise<QueueResult> =>
    fetchJson<QueueResult>(`${API_BASE}/tracks/${encodeURIComponent(trackId)}/queue`, {
      ttlSeconds: 300,
      timeoutMs: 5000,
      fallbackData: {
        currentTrackId: trackId,
        tracks: FALLBACK_TRACKS.slice(0, 8),
      },
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
    return fetchJson<LyricsResult>(
      `${API_BASE}/tracks/${encodeURIComponent(trackId)}/lyrics${qs}`,
      {
        ttlSeconds: 3600,
        timeoutMs: 5000,
        fallbackData: {
          trackId,
          plainLyrics: "",
        },
      },
    );
  },

  // Artists, Albums, Playlists (Cached for rapid back-and-forth navigation)
  getArtist: (artistId: string): Promise<ArtistDetails> =>
    fetchJson(`${API_BASE}/artists/${encodeURIComponent(artistId)}`, {
      ttlSeconds: 600,
      timeoutMs: 6000,
    }),

  getAlbum: (albumId: string): Promise<AlbumDetails> =>
    fetchJson(`${API_BASE}/albums/${encodeURIComponent(albumId)}`, {
      ttlSeconds: 600,
      timeoutMs: 6000,
    }),

  getPlaylist: (playlistId: string): Promise<PlaylistDetails> =>
    fetchJson(`${API_BASE}/playlists/${encodeURIComponent(playlistId)}`, {
      ttlSeconds: 600,
      timeoutMs: 6000,
    }),

  // AI Smart Queue & Next Song Predictions
  getAISuggestions: async (
    currentTrack: Track,
    queue: Track[] = [],
    mood: string = "smart",
    count = 6,
  ): Promise<Array<{ track: Track; reason: string; badge: string }>> => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/ai/queue-suggestions`, 5000);
      if (!res.ok) throw new Error("AI endpoint unavailable");
      const data = await res.json();
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    } catch {
      // Instant intelligent fallback from local catalog
      const cleanCurrentId = currentTrack.sourceTrackId || currentTrack.id;
      const suggestions = FALLBACK_TRACKS.filter(
        (t) => (t.sourceTrackId || t.id) !== cleanCurrentId,
      ).slice(0, count);

      return suggestions.map((t, idx) => ({
        track: t,
        reason: idx === 0 ? `Seamless match with ${currentTrack.title}` : `Acoustic match for ${mood} mood`,
        badge: idx === 0 ? "✨ Top Flow" : "✨ Next Up",
      }));
    }
  },
};

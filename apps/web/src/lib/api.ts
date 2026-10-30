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

  // 3. Client-side in browser:
  if (typeof window !== "undefined") {
    // When running under Vercel (or reverse proxy) where /api is rewritten to the api service:
    // Relative URL "/api/v1" automatically hits the same host and routes to the api service.
    if (window.location.port !== "3000") {
      return "/api/v1";
    }
    // Standalone local development fallback where API runs on port 3001
    return `http://${window.location.hostname}:3001/api/v1`;
  }

  // 4. Default server fallback for local development
  return "http://localhost:3001/api/v1";
}

const API_BASE: any = {
  toString() {
    return getApiBase();
  },
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Search
  searchTracks: (query: string, pageToken?: string): Promise<TrackSearchResult> =>
    fetchJson(
      `${API_BASE}/search?q=${encodeURIComponent(query)}&type=song${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
      }`,
    ),

  searchAll: (query: string): Promise<SearchResults> =>
    fetchJson(`${API_BASE}/search?q=${encodeURIComponent(query)}&type=all`),

  getSearchSuggestions: (query: string): Promise<string[]> =>
    fetchJson(
      `${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}`,
    ),

  getSearchRecommendations: (): Promise<SearchRecommendations> =>
    fetchJson(`${API_BASE}/search/recommendations`),

  // Explore & Home Feed
  getExploreFeed: (): Promise<ExploreFeed> =>
    fetchJson(`${API_BASE}/explore`),

  // Track info & Playback
  getTrack: (trackId: string): Promise<Track> =>
    fetchJson(`${API_BASE}/tracks/${encodeURIComponent(trackId)}`),

  getPlayback: (sourceTrackId: string): Promise<PlaybackResult> =>
    fetchJson(
      `${API_BASE}/tracks/${encodeURIComponent(sourceTrackId)}/playback`,
    ),

  getQueue: (trackId: string): Promise<QueueResult> =>
    fetchJson(`${API_BASE}/tracks/${encodeURIComponent(trackId)}/queue`),

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
    );
  },

  // Artists, Albums, Playlists
  getArtist: (artistId: string): Promise<ArtistDetails> =>
    fetchJson(`${API_BASE}/artists/${encodeURIComponent(artistId)}`),

  getAlbum: (albumId: string): Promise<AlbumDetails> =>
    fetchJson(`${API_BASE}/albums/${encodeURIComponent(albumId)}`),

  getPlaylist: (playlistId: string): Promise<PlaylistDetails> =>
    fetchJson(`${API_BASE}/playlists/${encodeURIComponent(playlistId)}`),

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


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
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:3001/api/v1`;
  }
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
};


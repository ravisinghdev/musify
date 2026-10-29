export type MusicSourceId = string;

export interface Artist {
  id: string;
  name: string;
  artworkUrl?: string;
  subscribers?: string;
  description?: string;
}

export interface Album {
  id: string;
  title: string;
  artworkUrl?: string;
  artists: Artist[];
  year?: string | number;
  tracksCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  artworkUrl?: string;
  author?: string;
  tracksCount?: number;
  description?: string;
}

export interface Track {
  id: string;
  title: string;
  artists: Artist[];
  album?: Album;
  durationMs?: number;
  artworkUrl?: string;
  source: MusicSourceId;
  sourceTrackId: string;
}

export interface TrackSearchResult {
  tracks: Track[];
  nextPageToken?: string;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface SearchCategory {
  id: string;
  name: string;
  query: string;
  color: string;
}

export interface SearchRecommendations {
  trendingQueries: string[];
  categories: SearchCategory[];
  recommendedTracks: Track[];
  featuredPlaylists?: Playlist[];
}

export interface ArtistDetails {
  artist: Artist;
  topSongs: Track[];
  albums: Album[];
  singles: Album[];
  relatedArtists?: Artist[];
}

export interface AlbumDetails {
  album: Album;
  tracks: Track[];
}

export interface PlaylistDetails {
  playlist: Playlist;
  tracks: Track[];
}

export interface LyricsResult {
  trackId: string;
  plainLyrics?: string;
  syncLyrics?: string;
  source?: string;
}

export interface QueueResult {
  currentTrackId: string;
  tracks: Track[];
}

export interface ExploreSection {
  title: string;
  items: Array<{
    type: "track" | "album" | "playlist";
    data: Track | Album | Playlist;
  }>;
}

export interface ExploreFeed {
  sections: ExploreSection[];
}

export interface PlaybackCapability {
  availability: "available" | "unavailable" | "unknown";
  method?: "official-player" | "authorized-stream";
  reason?: string;
}

export interface PlaybackResult {
  trackId: string;
  capability: PlaybackCapability;
  playbackUrl?: string;
  expiresAt?: string;
  format?: {
    mimeType?: string;
    bitrate?: number;
    audioQuality?: string;
    sampleRate?: number;
  };
}


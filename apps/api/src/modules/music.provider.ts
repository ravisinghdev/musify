import type {
  AlbumDetails,
  ArtistDetails,
  ExploreFeed,
  LyricsResult,
  PlaybackRequest,
  PlaybackResult,
  PlaylistDetails,
  QueueResult,
  SearchRecommendations,
  SearchResults,
  Track,
  TrackSearchResult,
} from "./music.types";

export interface MusicDiscoveryProvider {
  readonly sourceId: string;

  searchTracks(query: string, pageToken?: string): Promise<TrackSearchResult>;
  searchAll?(query: string): Promise<SearchResults>;
  getSearchSuggestions?(query: string): Promise<string[]>;
  getSearchRecommendations?(): Promise<SearchRecommendations>;
  getExploreFeed?(): Promise<ExploreFeed>;
  getTrack?(trackId: string): Promise<Track | null>;
  getArtist?(artistId: string): Promise<ArtistDetails | null>;
  getAlbum?(albumId: string): Promise<AlbumDetails | null>;
  getPlaylist?(playlistId: string): Promise<PlaylistDetails | null>;
  getQueue?(trackId: string): Promise<QueueResult>;
  getLyrics?(trackId: string): Promise<LyricsResult | null>;
}

export interface MusicPlaybackProvider {
  readonly sourceId: string;

  getPlayback(request: PlaybackRequest): Promise<PlaybackResult>;
  getPlaybackBySourceId?(sourceTrackId: string): Promise<PlaybackResult>;
}

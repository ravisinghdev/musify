import Innertube, { Platform, UniversalCache } from "youtubei.js";
import type {
  MusicDiscoveryProvider,
  MusicPlaybackProvider,
} from "./music.provider";
import type {
  Album,
  AlbumDetails,
  Artist,
  ArtistDetails,
  ExploreFeed,
  ExploreSection,
  LyricsResult,
  PlaybackRequest,
  PlaybackResult,
  Playlist,
  PlaylistDetails,
  QueueResult,
  SearchCategory,
  SearchRecommendations,
  SearchResults,
  Track,
  TrackSearchResult,
} from "./music.types";

function extractText(val: any, fallback = ""): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val.text === "string") return val.text;
  if (typeof val.toString === "function") {
    const s = val.toString();
    if (s && s !== "[object Object]") return s;
  }
  return fallback;
}

function extractThumbnail(item: any): string | undefined {
  if (!item) return undefined;
  let url: string | undefined;

  const candidateArrays = [
    item.thumbnails,
    item.thumbnail?.thumbnails,
    item.thumbnail?.contents,
    item.thumbnail,
    item.header?.thumbnail?.contents,
    item.header?.thumbnail?.thumbnails,
    item.cover?.thumbnails,
    item.cover?.contents,
    item.musicResponsiveListItemFlexColumnRenderer?.thumbnail?.thumbnails,
  ];

  for (const arr of candidateArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      let best = arr[arr.length - 1];
      for (const t of arr) {
        if (t?.url && (t.width || 0) > (best?.width || 0)) {
          best = t;
        }
      }
      if (best?.url) {
        url = best.url;
        break;
      }
    }
  }

  if (!url && typeof item.thumbnail?.url === "string") {
    url = item.thumbnail.url;
  }
  if (
    !url &&
    typeof item.url === "string" &&
    (item.url.includes("ytimg.com") || item.url.includes("googleusercontent.com"))
  ) {
    url = item.url;
  }

  if (!url) return undefined;

  // Upgrade protocol-relative URLs
  if (url.startsWith("//")) {
    url = "https:" + url;
  }

  // Upgrade Google User Content thumbnails to ultra crisp 800x800
  if (url.includes("googleusercontent.com") || url.includes("ggpht.com")) {
    url = url.replace(/=w\d+-h\d+.*$/, "=w800-h800-l90-rj");
  } else if (
    url.includes("i.ytimg.com/vi/") ||
    url.includes("img.youtube.com/vi/")
  ) {
    url = url.replace(/\/default\.jpg$/, "/hqdefault.jpg");
  }

  return url;
}

function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s*-\s*(lyrical|audio|video|official).*$/i, "")
    .replace(/feat\..*$/i, "")
    .replace(/ft\..*$/i, "")
    .replace(/\|.*$/g, "")
    .replace(/official\s*(music\s*)?(video|audio|lyric|lyrics)?/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function isCleanMusicTrack(t: Track): boolean {
  if (!t || !t.title) return false;
  const text =
    `${t.title} ${t.artists.map((a) => a.name).join(" ")}`.toLowerCase();

  // Filter out long compilation albums or mix sets posing as single songs
  const compilationPatterns = [
    "1 hour",
    "10 hour",
    "full album",
    "all songs non stop",
    "nonstop mix",
    "top 100 songs",
  ];
  return !compilationPatterns.some((w) => text.includes(w));
}

export class YouTubeMusicProvider
  implements MusicDiscoveryProvider, MusicPlaybackProvider
{
  readonly sourceId = "youtube";
  private ytPromise: Promise<Innertube>;

  constructor() {
    Platform.shim.eval = async (data, env) => {
      const code = `${data.output}\nreturn { ...env }`;
      return new Function("env", code)(env);
    };

    this.ytPromise = Innertube.create({
      lang: "en",
      cache: new UniversalCache(true),
    });
  }

  private mapSongToTrack(item: any): Track {
    const title = extractText(item.title, "Unknown Title");
    let artists: Artist[] = (item.artists ?? []).map((artist: any) => ({
      id: artist.channel_id ?? artist.name ?? "",
      name: extractText(artist.name, "Unknown Artist"),
    }));

    if (
      artists.length === 0 ||
      artists.every((a) => !a.name || a.name === "Unknown Artist")
    ) {
      const authorText =
        extractText(item.author?.name || item.author) ||
        extractText(item.short_byline?.title) ||
        extractText(item.subtitle);
      if (authorText && authorText !== "Unknown Artist") {
        const primary = authorText.split("•")[0].trim();
        artists = [{ id: "", name: primary || authorText }];
      }
    }

    if (artists.length === 0) {
      artists = [{ id: "", name: "Musify Artist" }];
    }

    const album: Album | undefined = item.album
      ? {
          id: item.album.id ?? "",
          title: extractText(item.album.name, "Unknown Album"),
          artists: [],
        }
      : undefined;

    const durationMs = item.duration?.seconds
      ? item.duration.seconds * 1000
      : undefined;

    let artworkUrl = extractThumbnail(item);

    // Strictly prioritize valid 11-character YouTube video IDs
    const rawId =
      item.video_id ??
      item.id ??
      item.endpoint?.payload?.videoId ??
      "";
    const cleanVideoId = String(rawId).replace(/^yt_/, "").trim();

    const videoIdCandidate =
      (item.video_id && item.video_id.length === 11 ? item.video_id : null) ??
      (item.id && item.id.length === 11 ? item.id : null) ??
      (item.endpoint?.payload?.videoId &&
      item.endpoint.payload.videoId.length === 11
        ? item.endpoint.payload.videoId
        : null) ??
      cleanVideoId;

    if (!artworkUrl && cleanVideoId) {
      artworkUrl = `https://i.ytimg.com/vi/${cleanVideoId}/hqdefault.jpg`;
    }

    return {
      id: `yt_${videoIdCandidate}`,
      title,
      artists,
      album,
      durationMs,
      artworkUrl,
      source: this.sourceId,
      sourceTrackId: videoIdCandidate,
    };
  }

  async searchTracks(
    query: string,
    _pageToken?: string,
  ): Promise<TrackSearchResult> {
    if (!query.trim()) {
      return { tracks: [] };
    }

    const yt = await this.ytPromise;
    const cleanQuery = query.trim();

    try {
      // 1. Primary search for songs on YouTube Music
      const search = await yt.music.search(cleanQuery, { type: "song" });
      let songItems: any[] = [...(search.songs?.contents ?? [])];

      // 2. If fewer than 6 songs found, supplement with videos
      if (songItems.length < 6) {
        try {
          const videoSearch = await yt.music.search(cleanQuery, {
            type: "video",
          });
          const videoItems = videoSearch.videos?.contents ?? [];
          const seen = new Set(songItems.map((s: any) => s.id || s.video_id));
          for (const item of (videoItems as any[])) {
            const vid = item.id || item.video_id;
            if (vid && !seen.has(vid)) {
              seen.add(vid);
              songItems.push(item);
            }
          }
        } catch {}
      }

      // 3. Fallback to general YouTube search if 0 songs (handles live, unreleased, OSTs)
      if (songItems.length === 0) {
        try {
          const generalYt = await yt.search(cleanQuery);
          for (const vid of ((generalYt.videos ?? []) as any[]).slice(0, 20)) {
            songItems.push({
              id: vid.id,
              video_id: vid.id,
              title: vid.title,
              author: vid.author,
              artists: vid.author
                ? [{ id: vid.author.id, name: vid.author.name }]
                : [],
              thumbnails: vid.thumbnails,
              duration: { seconds: vid.duration?.seconds ?? 0 },
            });
          }
        } catch {}
      }

      const seenNorm = new Set<string>();
      const seenIds = new Set<string>();
      const tracks: Track[] = [];

      for (const item of songItems) {
        if (!item?.id && !item?.video_id) continue;
        const mapped = this.mapSongToTrack(item);
        if (!mapped.sourceTrackId || !mapped.title) continue;

        const norm = normalizeTitle(mapped.title);
        if (norm && seenNorm.has(norm)) continue;
        if (seenIds.has(mapped.sourceTrackId)) continue;

        if (norm) seenNorm.add(norm);
        seenIds.add(mapped.sourceTrackId);
        tracks.push(mapped);
      }

      return { tracks };
    } catch (err) {
      console.error("searchTracks error:", err);
      try {
        const generalYt = await yt.search(cleanQuery);
        const tracks: Track[] = (generalYt.videos ?? [])
          .slice(0, 20)
          .map((vid: any) => ({
            id: `yt_${vid.id}`,
            title: extractText(vid.title, "Unknown Title"),
            artists: [
              {
                id: vid.author?.id ?? "",
                name: extractText(vid.author?.name, "YouTube Artist"),
              },
            ],
            durationMs: (vid.duration?.seconds ?? 0) * 1000,
            artworkUrl:
              extractThumbnail(vid) ||
              `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`,
            source: this.sourceId,
            sourceTrackId: vid.id,
          }));
        return { tracks };
      } catch {
        return { tracks: [] };
      }
    }
  }

  async searchArtists(query: string): Promise<Artist[]> {
    if (!query.trim()) return [];
    const yt = await this.ytPromise;
    const res = await yt.music.search(query, { type: "artist" });
    const items = res.artists?.contents ?? [];

    return items
      .filter((item: any) => Boolean(item?.id))
      .map((item: any) => ({
        id: item.id,
        name: extractText(item.name, "Unknown Artist"),
        artworkUrl: extractThumbnail(item),
        subscribers: extractText(item.subscribers),
      }));
  }

  async searchAlbums(query: string): Promise<Album[]> {
    if (!query.trim()) return [];
    const yt = await this.ytPromise;
    const res = await yt.music.search(query, { type: "album" });
    const items = res.albums?.contents ?? [];

    return items
      .filter((item: any) => Boolean(item?.id))
      .map((item: any) => ({
        id: item.id,
        title: extractText(item.title, "Unknown Album"),
        artworkUrl: extractThumbnail(item),
        artists: (item.artists ?? []).map((a: any) => ({
          id: a.channel_id ?? "",
          name: extractText(a.name, "Unknown Artist"),
        })),
        year: item.year,
      }));
  }

  async searchPlaylists(query: string): Promise<Playlist[]> {
    if (!query.trim()) return [];
    const yt = await this.ytPromise;
    const res = await yt.music.search(query, { type: "playlist" });
    const items = res.playlists?.contents ?? [];

    return items
      .filter((item: any) => Boolean(item?.id))
      .map((item: any) => ({
        id: item.id,
        title: extractText(item.title, "Unknown Playlist"),
        artworkUrl: extractThumbnail(item),
        author: extractText(item.author),
        tracksCount: item.item_count ? Number(item.item_count) : undefined,
      }));
  }

  async searchAll(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }

    const [tracksResult, artists, albums, playlists] = await Promise.allSettled(
      [
        this.searchTracks(query),
        this.searchArtists(query),
        this.searchAlbums(query),
        this.searchPlaylists(query),
      ],
    );

    return {
      tracks:
        tracksResult.status === "fulfilled" ? tracksResult.value.tracks : [],
      artists: artists.status === "fulfilled" ? artists.value : [],
      albums: albums.status === "fulfilled" ? albums.value : [],
      playlists: playlists.status === "fulfilled" ? playlists.value : [],
    };
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    const yt = await this.ytPromise;
    try {
      const suggestionsSections = await yt.music.getSearchSuggestions(query);
      const suggestions: string[] = [];

      for (const section of suggestionsSections) {
        for (const item of (section as any).contents ?? []) {
          const text = extractText(item.suggestion ?? item.title);
          if (text && !suggestions.includes(text)) {
            suggestions.push(text);
          }
        }
      }

      return suggestions;
    } catch {
      return [];
    }
  }

  private cachedRecommendations?: {
    data: SearchRecommendations;
    timestamp: number;
  };

  async getSearchRecommendations(): Promise<SearchRecommendations> {
    const now = Date.now();
    if (
      this.cachedRecommendations &&
      now - this.cachedRecommendations.timestamp < 10 * 60 * 1000
    ) {
      return this.cachedRecommendations.data;
    }

    const trendingQueries = [
      "The Weeknd",
      "Taylor Swift",
      "Billie Eilish",
      "Bruno Mars",
      "Lady Gaga",
      "Post Malone",
      "Sabrina Carpenter",
      "Kendrick Lamar",
      "Dua Lipa",
      "Coldplay",
    ];

    const categories: SearchCategory[] = [
      { id: "pop", name: "Pop", query: "Pop Hits Billboard", color: "#ec4899" },
      {
        id: "hiphop",
        name: "Hip-Hop",
        query: "Hip Hop Hits",
        color: "#f97316",
      },
      {
        id: "chill",
        name: "Chill & Lofi",
        query: "Lofi Beats",
        color: "#6366f1",
      },
      {
        id: "rock",
        name: "Rock & Metal",
        query: "Rock Classics",
        color: "#ef4444",
      },
      { id: "rnb", name: "R&B & Soul", query: "R&B Hits", color: "#8b5cf6" },
      {
        id: "electronic",
        name: "Electronic",
        query: "EDM Dance",
        color: "#06b6d4",
      },
      {
        id: "indie",
        name: "Indie & Alternative",
        query: "Indie Alternative",
        color: "#10b981",
      },
      {
        id: "workout",
        name: "Workout",
        query: "Workout Energy",
        color: "#eab308",
      },
      {
        id: "focus",
        name: "Focus & Study",
        query: "Focus Instrumental",
        color: "#3b82f6",
      },
      { id: "party", name: "Party", query: "Party Hits", color: "#a855f7" },
    ];

    let recommendedTracks: Track[] = [];
    try {
      const liveHits = await this.searchTracks("Top Global Hits Billboard Today");
      recommendedTracks = liveHits.tracks.slice(0, 16);
      if (recommendedTracks.length === 0) {
        const fallbackHits = await this.searchTracks("Trending Songs");
        recommendedTracks = fallbackHits.tracks.slice(0, 16);
      }
    } catch {
      // safe fallback
    }

    let featuredPlaylists: Playlist[] = [
      {
        id: "top_hits_today",
        title: "Today's Top Hits",
        author: "Musify Editorial",
        description: "The hottest tracks right now across the globe.",
        artworkUrl: "https://i.ytimg.com/vi/DlFXDl_ROAM/hqdefault.jpg",
        tracksCount: 50,
      },
      {
        id: "chill_lofi_vibes",
        title: "Lo-Fi Beats & Study",
        author: "Musify Chill",
        description: "Soothing ambient beats to relax, focus, and code.",
        artworkUrl: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        tracksCount: 80,
      },
      {
        id: "global_viral_50",
        title: "Viral Hits 2026",
        author: "Musify Charts",
        description: "The songs taking over the internet and streaming.",
        artworkUrl: "https://i.ytimg.com/vi/d5gx74aac6o/hqdefault.jpg",
        tracksCount: 50,
      },
      {
        id: "workout_energy",
        title: "Workout Mix",
        author: "Musify Fitness",
        description: "High-intensity bangers to fuel your gym sessions.",
        artworkUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
        tracksCount: 60,
      },
      {
        id: "romantic_evening",
        title: "Romantic Mix",
        author: "Musify Acoustic",
        description: "Intimate love songs and sweet acoustic melodies.",
        artworkUrl: "https://i.ytimg.com/vi/_deqdZmKzyg/hqdefault.jpg",
        tracksCount: 40,
      },
      {
        id: "deep_focus_flow",
        title: "Focus Mode",
        author: "Musify Ambient",
        description: "Deep binaural and electronic flow state sounds.",
        artworkUrl: "https://i.ytimg.com/vi/opwZ_PJ-F_E/hqdefault.jpg",
        tracksCount: 100,
      },
    ];

    const data: SearchRecommendations = {
      trendingQueries,
      categories,
      recommendedTracks,
      featuredPlaylists,
    };

    this.cachedRecommendations = { data, timestamp: now };
    return data;
  }

  private cachedExploreFeed?: {
    data: ExploreFeed;
    timestamp: number;
  };

  async getExploreFeed(): Promise<ExploreFeed> {
    const now = Date.now();
    if (
      this.cachedExploreFeed &&
      now - this.cachedExploreFeed.timestamp < 15 * 60 * 1000
    ) {
      return this.cachedExploreFeed.data;
    }

    const curatedCategories = [
      { title: "Today's Top Hits Worldwide", query: "Today's Top Hits 2026" },
      { title: "Trending Global Viral", query: "Viral Hits Global" },
      { title: "Chill & Lo-Fi Beats", query: "Lofi Hip Hop Chill Beats" },
      { title: "Pop & Dance Energy", query: "Pop Dance Hits" },
      {
        title: "Late Night Acoustic & Moods",
        query: "Late Night Acoustic Vibes",
      },
    ];

    const sections: ExploreSection[] = [];

    // Fetch rich curated sections with guaranteed 11-char video IDs
    const searchResults = await Promise.allSettled(
      curatedCategories.map(async (cat) => {
        const res = await this.searchTracks(cat.query);
        return {
          title: cat.title,
          items: res.tracks.slice(0, 8).map((t) => ({
            type: "track" as const,
            data: t,
          })),
        };
      }),
    );

    for (const res of searchResults) {
      if (res.status === "fulfilled" && res.value.items.length > 0) {
        sections.push(res.value);
      }
    }

    // Also merge top non-spam home feed sections if available
    try {
      const yt = await this.ytPromise;
      const home = await yt.music.getHomeFeed();
      for (const sec of (home.sections ?? []).slice(0, 3)) {
        const title =
          extractText((sec as any).header?.title) ||
          extractText((sec as any).title) ||
          "Recommended For You";

        // Filter out spam
        const lower = title.toLowerCase();
        if (
          lower.includes("devotional") ||
          lower.includes("bhajan")
        ) {
          continue;
        }

        const items: Array<{
          type: "track" | "album" | "playlist";
          data: Track | Album | Playlist;
        }> = [];

        for (const item of (sec as any).contents ?? []) {
          const videoId =
            (item.video_id && item.video_id.length === 11
              ? item.video_id
              : null) ??
            (item.endpoint?.payload?.videoId &&
            item.endpoint.payload.videoId.length === 11
              ? item.endpoint.payload.videoId
              : null) ??
            (item.id && item.id.length === 11 ? item.id : null);

          if (videoId) {
            const mappedTrack = this.mapSongToTrack(item);
            if (mappedTrack && mappedTrack.sourceTrackId && mappedTrack.title) {
              items.push({
                type: "track",
                data: mappedTrack,
              });
            }
          } else {
            const plId =
              item.endpoint?.payload?.browseId ||
              (item.id && typeof item.id === "string" ? item.id : "");
            if (
              plId &&
              (plId.startsWith("VL") ||
                plId.startsWith("RDCLAK") ||
                plId.startsWith("MPRE"))
            ) {
              items.push({
                type: "playlist",
                data: {
                  id: plId,
                  title: extractText(item.title, "Curated Collection"),
                  artworkUrl: extractThumbnail(item),
                  author: extractText(item.subtitle ?? item.author),
                  description: extractText(item.subtitle),
                },
              });
            }
          }
        }

        if (items.length > 0) {
          sections.push({ title, items });
        }
      }
    } catch {
      // Curated search fallback is already populated
    }

    const data: ExploreFeed = { sections };
    this.cachedExploreFeed = { data, timestamp: now };
    return data;
  }

  async getTrack(trackId: string): Promise<Track | null> {
    const yt = await this.ytPromise;
    const cleanId = trackId.replace(/^yt_/, "");
    try {
      const info = await yt.music.getInfo(cleanId);
      const basic = info.basic_info;
      const artworkUrl =
        extractThumbnail(basic) ||
        `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;

      return {
        id: `yt_${cleanId}`,
        title: extractText(basic.title, "Unknown Title"),
        artists: [
          {
            id: basic.channel_id ?? "",
            name: extractText(basic.author, "Unknown Artist"),
          },
        ],
        durationMs: (basic.duration ?? 0) * 1000,
        artworkUrl,
        source: this.sourceId,
        sourceTrackId: cleanId,
      };
    } catch {
      return null;
    }
  }

  async getPlayback(request: PlaybackRequest): Promise<PlaybackResult> {
    const yt = await this.ytPromise;
    const videoId = request.track.sourceTrackId;

    try {
      let audioFormat: any = null;

      try {
        const info = await yt.music.getInfo(videoId);
        const status = info.playability_status?.status;
        if (status === "OK") {
          audioFormat = info.chooseFormat({
            type: "audio",
            quality: "best",
          });
        }
      } catch {
        // Direct getInfo threw, proceed to fallback
      }

      // If direct format wasn't found or video was restricted, search fallback
      if (!audioFormat) {
        const query = (
          request.track.title
            ? `${request.track.title} ${request.track.artists?.[0]?.name ?? ""}`
            : videoId
        ).trim();

        if (query) {
          try {
            const searchRes = await yt.music.search(query, { type: "song" });
            const contents = (searchRes.contents as any)?.[0]?.contents ?? [];
            for (const item of contents) {
              if (item.id && item.id !== videoId) {
                try {
                  const altInfo = await yt.music.getInfo(item.id);
                  if (altInfo.playability_status?.status === "OK") {
                    const altFmt = altInfo.chooseFormat({
                      type: "audio",
                      quality: "best",
                    });
                    if (altFmt) {
                      audioFormat = altFmt;
                      break;
                    }
                  }
                } catch {
                  continue;
                }
              }
            }
          } catch {
            // search fallback failed
          }
        }
      }

      if (!audioFormat) {
        return {
          trackId: request.track.id,
          capability: {
            availability: "unavailable",
            reason: "No suitable audio format found",
          },
        };
      }

      const playbackUrl = await audioFormat.decipher(yt.session.player);

      return {
        trackId: request.track.id,
        capability: {
          availability: "available",
          method: "authorized-stream",
        },
        playbackUrl,
        format: {
          mimeType: audioFormat.mime_type,
          bitrate: audioFormat.bitrate,
          audioQuality: audioFormat.audio_quality,
          sampleRate: audioFormat.audio_sample_rate,
        },
      };
    } catch (error: any) {
      return {
        trackId: request.track.id,
        capability: {
          availability: "unavailable",
          reason: error?.message ?? "Failed to fetch playback",
        },
      };
    }
  }

  async getPlaybackBySourceId(sourceTrackId: string): Promise<PlaybackResult> {
    const dummyTrack: Track = {
      id: `yt_${sourceTrackId}`,
      title: "",
      artists: [],
      source: this.sourceId,
      sourceTrackId,
    };
    return this.getPlayback({ track: dummyTrack });
  }

  async getQueue(trackId: string): Promise<QueueResult> {
    const yt = await this.ytPromise;
    const cleanId = trackId.replace(/^yt_/, "");
    try {
      const upNext = await yt.music.getUpNext(cleanId);
      const rawItems = upNext.contents ?? [];

      const currentTrackInfo = await this.getTrack(cleanId);
      const currentNorm = currentTrackInfo?.title
        ? normalizeTitle(currentTrackInfo.title)
        : "";

      const seenNorm = new Set<string>();
      if (currentNorm) seenNorm.add(currentNorm);
      const seenIds = new Set<string>([cleanId]);
      const tracks: Track[] = [];

      for (const item of (rawItems as any[])) {
        const vid =
          (item.video_id && item.video_id.length === 11 ? item.video_id : null) ??
          (item.id && item.id.length === 11 ? item.id : null) ??
          (item.endpoint?.payload?.videoId && item.endpoint.payload.videoId.length === 11
            ? item.endpoint.payload.videoId
            : null);

        if (!vid || seenIds.has(vid)) continue;
        const mapped = this.mapSongToTrack(item);
        if (!mapped.title) continue;

        // Skip compilation spam
        if (!isCleanMusicTrack(mapped)) continue;

        // Deduplicate multiple versions of the same song
        const norm = normalizeTitle(mapped.title);
        if (norm && seenNorm.has(norm)) continue;

        if (norm) seenNorm.add(norm);
        seenIds.add(vid);
        tracks.push(mapped);
      }

      // If upNext is empty, dynamically query related tracks by artist
      if (tracks.length === 0 && currentTrackInfo?.artists[0]?.name) {
        const artistRelated = await this.searchTracks(
          currentTrackInfo.artists[0].name,
        );
        for (const t of artistRelated.tracks) {
          if (t.sourceTrackId !== cleanId && !seenIds.has(t.sourceTrackId)) {
            const norm = normalizeTitle(t.title);
            if (!norm || !seenNorm.has(norm)) {
              if (norm) seenNorm.add(norm);
              seenIds.add(t.sourceTrackId);
              tracks.push(t);
            }
          }
        }
      }

      return {
        currentTrackId: trackId,
        tracks,
      };
    } catch {
      return {
        currentTrackId: trackId,
        tracks: [],
      };
    }
  }

  async getLyrics(
    trackId: string,
    titleHint?: string,
    artistHint?: string,
  ): Promise<LyricsResult | null> {
    const cleanId = trackId.replace(/^yt_/, "");
    let title = titleHint;
    let artist = artistHint;

    if (!title) {
      try {
        const info = await this.getTrack(cleanId);
        if (info) {
          title = info.title;
          artist = info.artists[0]?.name;
        }
      } catch {}
    }

    // 1. Query LRCLIB for Time-Synced Lyrics ([mm:ss.xx] timestamps)
    if (title) {
      try {
        const cleanTitle = title
          .replace(/\(.*?\)|\[.*?\]/g, "")
          .replace(/feat\..*$/i, "")
          .replace(/ft\..*$/i, "")
          .replace(/\|.*$/g, "")
          .replace(/-.*$/g, "")
          .trim();
        const cleanArtist = (artist ?? "")
          .replace(/\(.*?\)|\[.*?\]/g, "")
          .split(",")[0]
          .trim();

        // 1a. Try exact track + artist lookup
        const exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
          cleanTitle,
        )}${cleanArtist ? `&artist_name=${encodeURIComponent(cleanArtist)}` : ""}`;

        const exactRes = await fetch(exactUrl, {
          headers: { "User-Agent": "MusifyApp/1.0" },
        });

        if (exactRes.ok) {
          const data: any = await exactRes.json();
          if (data.syncedLyrics) {
            return {
              trackId,
              syncLyrics: data.syncedLyrics,
              plainLyrics: data.plainLyrics || data.syncedLyrics,
              source: "LRCLIB (Synced)",
            };
          }
        }

        // 1b. Fuzzy search query to find exact matching synced lyrics (handles title variations)
        const searchQueries = [
          `${cleanTitle} ${cleanArtist}`.trim(),
          cleanTitle,
        ];

        for (const sq of searchQueries) {
          if (!sq) continue;
          try {
            const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(sq)}`;
            const searchRes = await fetch(searchUrl, {
              headers: { "User-Agent": "MusifyApp/1.0" },
            });
            if (searchRes.ok) {
              const list: any[] = await searchRes.json();
              if (Array.isArray(list) && list.length > 0) {
                // Find first candidate that has synced lyrics
                const matched = list.find((item) => Boolean(item.syncedLyrics)) || list[0];
                if (matched?.syncedLyrics || matched?.plainLyrics) {
                  return {
                    trackId,
                    syncLyrics: matched.syncedLyrics || undefined,
                    plainLyrics: matched.plainLyrics || matched.syncedLyrics || undefined,
                    source: matched.syncedLyrics ? "LRCLIB (Synced)" : "LRCLIB (Plain)",
                  };
                }
              }
            }
          } catch {}
        }
      } catch (err) {
        console.warn("LRCLIB lookup notice:", err);
      }
    }

    // 2. Fallback to YouTube Music lyrics
    try {
      const yt = await this.ytPromise;
      const lyrics = await yt.music.getLyrics(cleanId);
      if (lyrics) {
        const plainLyrics = extractText(
          (lyrics as any).description ?? (lyrics as any).text,
        );
        if (plainLyrics) {
          return {
            trackId,
            plainLyrics,
            source: "YouTube Music",
          };
        }
      }
    } catch {}

    return null;
  }

  async getArtist(artistId: string): Promise<ArtistDetails | null> {
    const yt = await this.ytPromise;
    try {
      const artist = await yt.music.getArtist(artistId);
      const header = artist.header as any;
      const name = extractText(header?.title, "Unknown Artist");
      const description = extractText(header?.description);
      const artworkUrl = extractThumbnail(artist);

      const topSongsSec = artist.sections?.find((s: any) => {
        const title = (
          extractText(s.title) || extractText(s.header?.title)
        ).toLowerCase();
        return title.includes("song");
      });

      const topSongs: Track[] = (topSongsSec?.contents ?? [])
        .filter((item: any) => Boolean(item.id || item.video_id))
        .map((item: any) => this.mapSongToTrack(item));

      const albumsSec = artist.sections?.find((s: any) => {
        const title = (
          extractText(s.title) || extractText(s.header?.title)
        ).toLowerCase();
        return title === "albums";
      });

      const albums: Album[] = (albumsSec?.contents ?? []).map((item: any) => ({
        id: item.id ?? "",
        title: extractText(item.title, "Unknown Album"),
        artworkUrl: extractThumbnail(item),
        artists: [{ id: artistId, name }],
        year: item.year,
      }));

      const singlesSec = artist.sections?.find((s: any) => {
        const title = (
          extractText(s.title) || extractText(s.header?.title)
        ).toLowerCase();
        return title.includes("single");
      });

      const singles: Album[] = (singlesSec?.contents ?? []).map(
        (item: any) => ({
          id: item.id ?? "",
          title: extractText(item.title, "Unknown Single"),
          artworkUrl: extractThumbnail(item),
          artists: [{ id: artistId, name }],
          year: item.year,
        }),
      );

      return {
        artist: {
          id: artistId,
          name,
          artworkUrl,
          description,
        },
        topSongs,
        albums,
        singles,
      };
    } catch {
      return null;
    }
  }

  async getAlbum(albumId: string): Promise<AlbumDetails | null> {
    const yt = await this.ytPromise;
    try {
      const album = await yt.music.getAlbum(albumId);
      const header = album.header as any;
      const title = extractText(header?.title, "Unknown Album");
      const artworkUrl = extractThumbnail(album);

      const tracks: Track[] = (album.contents ?? [])
        .filter((item: any) => Boolean(item.id || item.video_id))
        .map((item: any) => this.mapSongToTrack(item));

      return {
        album: {
          id: albumId,
          title,
          artworkUrl,
          artists: (header?.artists ?? []).map((a: any) => ({
            id: a.channel_id ?? "",
            name: extractText(a.name, "Unknown Artist"),
          })),
          year: header?.year,
          tracksCount: tracks.length,
        },
        tracks,
      };
    } catch {
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<PlaylistDetails | null> {
    const yt = await this.ytPromise;
    try {
      const pl = await yt.music.getPlaylist(playlistId);
      const header = pl.header as any;
      const title = extractText(header?.title, "Unknown Playlist");
      const artworkUrl = extractThumbnail(pl);
      const author = extractText(header?.author?.name ?? header?.author);

      const items = (pl as any).items ?? (pl as any).contents ?? [];
      const tracks: Track[] = items
        .filter((item: any) => Boolean(item.id || item.video_id))
        .map((item: any) => this.mapSongToTrack(item));

      return {
        playlist: {
          id: playlistId,
          title,
          artworkUrl,
          author,
          tracksCount: tracks.length,
        },
        tracks,
      };
    } catch {
      return null;
    }
  }
}

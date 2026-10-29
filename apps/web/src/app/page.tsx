"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { AudioPlayer } from "../components/AudioPlayer";
import { AuthModal } from "../components/AuthModal";
import { CreatePlaylistModal } from "../components/CreatePlaylistModal";
import { FullscreenVisualizer } from "../components/FullscreenVisualizer";
import { HeroBanner } from "../components/HeroBanner";
import { Icon } from "../components/Icons";
import { LyricsModal } from "../components/LyricsModal";
import { MediaCard } from "../components/MediaCard";
import { MediaSection } from "../components/MediaSection";
import { MobileNavDrawer } from "../components/MobileNavDrawer";
import { NowPlayingPanel } from "../components/NowPlayingPanel";
import {
  ActivePlaylistView,
  PlaylistDetailView,
} from "../components/PlaylistDetailView";
import { QueueModal } from "../components/QueueModal";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer, ToastMessage } from "../components/Toast";
import { TopHeader } from "../components/TopHeader";
import { TrackRow } from "../components/TrackRow";
import { YouTubeAudioEngine } from "../components/YouTubeAudioEngine";
import { api } from "../lib/api";
import {
  CustomPlaylist,
  INITIAL_PLAYLISTS,
  SafeUser,
  SEED_TRACKS,
  store,
} from "../lib/store";
import { useArtworkTheme } from "../lib/useArtworkTheme";
import type {
  ExploreFeed,
  Playlist,
  SearchRecommendations,
  Track,
} from "../types/music";

function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 17) return "GOOD AFTERNOON";
  if (hour >= 17 && hour < 22) return "GOOD EVENING";
  return "LATE NIGHT VIBES";
}

const POPULAR_ARTISTS = [
  {
    id: "the-weeknd",
    name: "The Weeknd",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "lady-gaga",
    name: "Lady Gaga",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "bruno-mars",
    name: "Bruno Mars",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "billie-eilish",
    name: "Billie Eilish",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "ed-sheeran",
    name: "Ed Sheeran",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "post-malone",
    name: "Post Malone",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "anuv-jain",
    name: "Anuv Jain",
    role: "Artist",
    avatar:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "the-local-train",
    name: "The Local Train",
    role: "Band",
    avatar:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&auto=format&fit=crop&q=80",
  },
];

const VIBE_STATIONS = [
  {
    id: "vibe-lofi",
    title: "Lo-Fi Beats & Study",
    query: "Lofi Hip Hop Chill Beats",
    subtitle: "Calm beats for flow",
    artwork:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "vibe-workout",
    title: "Workout Energy",
    query: "Workout Energy Gym Bangers",
    subtitle: "Fuel your peak performance",
    artwork:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "vibe-latenight",
    title: "Late Night Drive",
    query: "Late Night Drive Hits",
    subtitle: "Atmospheric synth & chill",
    artwork:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "vibe-deepwork",
    title: "Deep Coding Flow",
    query: "Deep Focus Ambient Instrumental",
    subtitle: "Zero-distraction electronics",
    artwork:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
  },
];

export default function Home() {
  const [active, setActive] = useState<string>("Home");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [greeting, setGreeting] = useState("GOOD EVENING");

  // Dynamic API state
  const [recommendations, setRecommendations] =
    useState<SearchRecommendations | null>(null);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [exploreFeed, setExploreFeed] = useState<ExploreFeed | null>(null);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);

  // Synchronized Audio Player State (Single source of truth)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0); // 100% volume by default
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  // Active Playlist detail view
  const [activePlaylist, setActivePlaylist] =
    useState<ActivePlaylistView | null>(null);

  // Queue state
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  // Database-ready local state
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [customPlaylists, setCustomPlaylists] =
    useState<CustomPlaylist[]>(INITIAL_PLAYLISTS);

  // Right Panel & Lyrics State
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Modals state
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);
  const [playlistToAddTo, setPlaylistToAddTo] = useState<Track | null>(null);

  // Fullscreen Visualizer & Queue Modal
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showFullscreenVisualizer, setShowFullscreenVisualizer] =
    useState(false);

  // Mobile navigation drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback(
    (
      message: string,
      subtext?: string,
      type: "success" | "info" | "heart" = "success",
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, subtext, type }]);
    },
    [],
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const artworkTheme = useArtworkTheme(currentTrack?.artworkUrl);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const favoritesIds = useMemo(
    () => new Set(favorites.map((t) => t.id)),
    [favorites],
  );

  // Stable references for deterministic audio playback & queue state
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const isShuffleRef = useRef(isShuffle);
  const isRepeatRef = useRef(isRepeat);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  // Queue actions with index awareness
  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      queueRef.current = updated;
      return updated;
    });
    setQueueIndex((currentIdx) => {
      if (index < currentIdx) {
        const newIdx = currentIdx - 1;
        queueIndexRef.current = newIdx;
        return newIdx;
      } else if (index === currentIdx) {
        const newIdx = Math.min(currentIdx, queueRef.current.length - 1);
        queueIndexRef.current = newIdx;
        return newIdx;
      }
      return currentIdx;
    });
    showToast("Removed from queue", undefined, "info");
  };

  const handleMoveQueueItem = (from: number, to: number) => {
    setQueue((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      queueRef.current = copy;
      return copy;
    });
  };

  const handleClearQueue = () => {
    const retained = currentTrack ? [currentTrack] : [];
    setQueue(retained);
    queueRef.current = retained;
    setQueueIndex(retained.length > 0 ? 0 : -1);
    queueIndexRef.current = retained.length > 0 ? 0 : -1;
    showToast("Queue cleared", undefined, "info");
  };

  // Android & Mobile Browser Hardware Back Button Handler
  // Closes open overlays gracefully before navigating away
  useEffect(() => {
    const hasOpenModal =
      showFullscreenVisualizer ||
      showQueueModal ||
      showLyrics ||
      showAuthModal ||
      showCreatePlaylistModal ||
      Boolean(playlistToAddTo) ||
      isMobileMenuOpen;

    if (!hasOpenModal) return;

    window.history.pushState({ musifyModal: true }, "");

    const handlePopState = () => {
      if (showFullscreenVisualizer) {
        setShowFullscreenVisualizer(false);
      } else if (showLyrics) {
        setShowLyrics(false);
      } else if (showQueueModal) {
        setShowQueueModal(false);
      } else if (showAuthModal) {
        setShowAuthModal(false);
      } else if (showCreatePlaylistModal) {
        setShowCreatePlaylistModal(false);
      } else if (playlistToAddTo) {
        setPlaylistToAddTo(null);
      } else if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.musifyModal) {
        window.history.back();
      }
    };
  }, [
    showFullscreenVisualizer,
    showQueueModal,
    showLyrics,
    showAuthModal,
    showCreatePlaylistModal,
    playlistToAddTo,
    isMobileMenuOpen,
  ]);

  // Dynamic greeting update
  useEffect(() => {
    setGreeting(getDynamicGreeting());
  }, []);

  // Load database/storage & user on mount
  useEffect(() => {
    store.getMe().then(setAuthUser);
    store.getFavorites().then(setFavorites);
    store.getRecentlyPlayed().then(setRecentlyPlayed);
    store.getPlaylists().then(setCustomPlaylists);
  }, []);

  const handleAuthSuccess = (user: SafeUser) => {
    setAuthUser(user);
    showToast(
      user.isAnonymous ? "Welcome" : `Welcome, ${user.displayName || user.email}!`,
      "Cloud library synchronized",
      "success",
    );
    // Refresh user playlists and favorites
    store.getFavorites().then(setFavorites);
    store.getPlaylists().then(setCustomPlaylists);
    store.getRecentlyPlayed().then(setRecentlyPlayed);
  };

  const handleSignOut = async () => {
    await store.logout();
    const guest = await store.getMe();
    setAuthUser(guest);
    showToast("Signed Out", "Switched to anonymous guest session", "info");
    store.getFavorites().then(setFavorites);
    store.getPlaylists().then(setCustomPlaylists);
    store.getRecentlyPlayed().then(setRecentlyPlayed);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Load dynamic recommendations from API
  useEffect(() => {
    api
      .getSearchRecommendations()
      .then(setRecommendations)
      .catch((err) => console.warn("Failed to load recommendations:", err));
  }, []);

  // Load Explore feed on mount
  useEffect(() => {
    if (!exploreFeed) {
      setIsLoadingExplore(true);
      api
        .getExploreFeed()
        .then(setExploreFeed)
        .catch((err) => console.warn("Failed to load explore feed:", err))
        .finally(() => setIsLoadingExplore(false));
    }
  }, [exploreFeed]);

  // Autocomplete suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    api
      .getSearchSuggestions(query)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [query]);

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }
    let isCancelled = false;
    setIsSearching(true);
    api
      .searchTracks(debouncedQuery)
      .then((res) => {
        if (!isCancelled) setSearchResults(res.tracks);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Search failed:", err);
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsSearching(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Play track handler with dynamic video ID precision resolver
  const handlePlayTrack = useCallback(
    async (track: Track, newQueue?: Track[], targetIndex?: number) => {
      let resolvedTrack = track;

      // Ensure valid 11-character YouTube video ID
      const isValidYtId =
        Boolean(track.sourceTrackId) &&
        track.sourceTrackId.length === 11 &&
        /^[a-zA-Z0-9_-]{11}$/.test(track.sourceTrackId);

      if (!isValidYtId) {
        try {
          const artistQuery = track.artists[0]?.name
            ? ` ${track.artists[0].name}`
            : "";
          const searchRes = await api.searchTracks(
            `${track.title}${artistQuery}`,
          );
          if (
            searchRes.tracks.length > 0 &&
            searchRes.tracks[0].sourceTrackId
          ) {
            resolvedTrack = {
              ...track,
              sourceTrackId: searchRes.tracks[0].sourceTrackId,
              artworkUrl: track.artworkUrl || searchRes.tracks[0].artworkUrl,
              durationMs: track.durationMs || searchRes.tracks[0].durationMs,
            };
          }
        } catch (e) {
          console.warn("Could not resolve video ID for track:", track.title, e);
        }
      }

      setCurrentTrack(resolvedTrack);
      setIsLoadingStream(true);
      setIsPlaying(true);
      setLyrics(null);

      // Persist to recently played history
      store.addRecentlyPlayed(resolvedTrack).then(setRecentlyPlayed);

      // Manage Queue with strict sequential order and deterministic sync
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        queueRef.current = newQueue;

        let resolvedIdx =
          targetIndex !== undefined && targetIndex >= 0 ? targetIndex : -1;
        if (resolvedIdx === -1) {
          resolvedIdx = newQueue.findIndex(
            (t) =>
              t.id === track.id ||
              t.id === resolvedTrack.id ||
              (t.sourceTrackId &&
                (t.sourceTrackId === track.sourceTrackId ||
                  t.sourceTrackId === resolvedTrack.sourceTrackId)),
          );
        }
        const finalIdx = resolvedIdx >= 0 ? resolvedIdx : 0;
        setQueueIndex(finalIdx);
        queueIndexRef.current = finalIdx;
      } else {
        const currentQ = queueRef.current;
        let resolvedIdx =
          targetIndex !== undefined && targetIndex >= 0 ? targetIndex : -1;
        if (resolvedIdx === -1) {
          resolvedIdx = currentQ.findIndex(
            (t) =>
              t.id === track.id ||
              t.id === resolvedTrack.id ||
              (t.sourceTrackId &&
                (t.sourceTrackId === track.sourceTrackId ||
                  t.sourceTrackId === resolvedTrack.sourceTrackId)),
          );
        }
        if (resolvedIdx >= 0) {
          setQueueIndex(resolvedIdx);
          queueIndexRef.current = resolvedIdx;
        } else {
          const updatedQ = [resolvedTrack, ...currentQ.filter((t) => t.id !== resolvedTrack.id)];
          setQueue(updatedQ);
          queueRef.current = updatedQ;
          setQueueIndex(0);
          queueIndexRef.current = 0;
        }
      }

      setIsLoadingStream(false);
    },
    [],
  );

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    setSeekToTime(time);
  }, []);

  // Next track in queue
  const handleNextTrack = useCallback(() => {
    const currentQ = queueRef.current;
    if (!currentQ || currentQ.length === 0) return;

    let nextIndex = queueIndexRef.current + 1;
    if (isShuffleRef.current && currentQ.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * currentQ.length);
      } while (nextIndex === queueIndexRef.current);
    } else if (nextIndex >= currentQ.length) {
      nextIndex = 0; // Loop to top
    }

    const nextTrack = currentQ[nextIndex];
    if (nextTrack) {
      setQueueIndex(nextIndex);
      queueIndexRef.current = nextIndex;
      handlePlayTrack(nextTrack, currentQ, nextIndex);
    }
  }, [handlePlayTrack]);

  // Previous track in queue
  const handlePrevTrack = useCallback(() => {
    const currentQ = queueRef.current;
    if (!currentQ || currentQ.length === 0) return;

    let prevIndex = (queueIndexRef.current - 1 + currentQ.length) % currentQ.length;
    if (isShuffleRef.current && currentQ.length > 1) {
      do {
        prevIndex = Math.floor(Math.random() * currentQ.length);
      } while (prevIndex === queueIndexRef.current);
    }

    const prevTrack = currentQ[prevIndex];
    if (prevTrack) {
      setQueueIndex(prevIndex);
      queueIndexRef.current = prevIndex;
      handlePlayTrack(prevTrack, currentQ, prevIndex);
    }
  }, [handlePlayTrack]);

  // Track finished playing handler (honors single-track repeat or queue progression)
  const handleTrackEnded = useCallback(() => {
    if (isRepeat) {
      handleSeek(0);
      setIsPlaying(true);
      return;
    }
    handleNextTrack();
  }, [isRepeat, handleSeek, handleNextTrack]);

  // Toggle Shuffle with immediate user notification (single toast)
  const handleToggleShuffle = useCallback(() => {
    const next = !isShuffle;
    setIsShuffle(next);
    showToast(
      next ? "Shuffle Mode: ON" : "Shuffle Mode: OFF",
      undefined,
      "info",
    );
  }, [isShuffle, showToast]);

  // Toggle Repeat/Loop with immediate user notification (single toast)
  const handleToggleRepeat = useCallback(() => {
    const next = !isRepeat;
    setIsRepeat(next);
    showToast(
      next ? "Repeat Track: ON" : "Repeat Track: OFF",
      undefined,
      "info",
    );
  }, [isRepeat, showToast]);

  // Global Hotkeys for instant zero-latency playback control
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case "KeyJ":
          handlePrevTrack();
          break;
        case "KeyK":
          handleNextTrack();
          break;
        case "KeyM":
          setIsMuted((prev) => !prev);
          break;
        case "KeyL":
          setShowLyrics((prev) => !prev);
          break;
        case "KeyS":
          setIsShuffle((prev) => !prev);
          break;
        case "KeyR":
          setIsRepeat((prev) => !prev);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => Math.min(1, Math.round((v + 0.05) * 100) / 100));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => Math.max(0, Math.round((v - 0.05) * 100) / 100));
          break;
        case "Slash":
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, handleNextTrack, handlePrevTrack]);

  // Open ANY Playlist view (Custom or Curated) with full tracklist
  const openPlaylist = async (item: {
    id: string;
    title?: string;
    name?: string;
    artwork?: string;
    artworkUrl?: string;
    description?: string;
    author?: string;
    tracks?: Track[];
    playlistId?: string;
  }) => {
    const title = item.title || item.name || "Playlist";
    const artwork = item.artworkUrl || item.artwork;
    const playlistId = item.id || item.playlistId || "top-hits";

    const customMatch = customPlaylists.find(
      (c) => c.id === playlistId || c.name === title,
    );

    if (customMatch) {
      setActivePlaylist({
        id: customMatch.id,
        name: customMatch.name,
        artwork: customMatch.artwork,
        description: customMatch.description,
        tracks: customMatch.tracks,
        isCustom: true,
        isLoading: false,
      });
      setActive("PlaylistDetail");
      return;
    }

    setActivePlaylist({
      id: playlistId,
      name: title,
      artwork: artwork,
      description: item.description,
      author: item.author || "Musify Curators",
      tracks: item.tracks || [],
      isCustom: false,
      isLoading: !item.tracks || item.tracks.length === 0,
    });
    setActive("PlaylistDetail");

    // Fetch dynamic tracks from API if needed
    if (!item.tracks || item.tracks.length === 0) {
      try {
        const details = await api.getPlaylist(playlistId);
        if (details && details.tracks.length > 0) {
          setActivePlaylist((prev) =>
            prev && prev.id === playlistId
              ? {
                  ...prev,
                  tracks: details.tracks,
                  artwork: prev.artwork || details.playlist.artworkUrl,
                  author: details.playlist.author || prev.author,
                  isLoading: false,
                }
              : prev,
          );
        } else {
          const searchRes = await api.searchTracks(title);
          setActivePlaylist((prev) =>
            prev && prev.id === playlistId
              ? { ...prev, tracks: searchRes.tracks, isLoading: false }
              : prev,
          );
        }
      } catch {
        const searchRes = await api
          .searchTracks(title)
          .catch(() => ({ tracks: [] }));
        setActivePlaylist((prev) =>
          prev && prev.id === playlistId
            ? { ...prev, tracks: searchRes.tracks, isLoading: false }
            : prev,
        );
      }
    }
  };

  // Play a playlist directly without opening
  const handlePlayPlaylist = async (item: {
    id: string;
    title?: string;
    name?: string;
    tracks?: Track[];
    playlistId?: string;
  }) => {
    const customMatch = customPlaylists.find(
      (c) => c.id === item.id || c.id === item.playlistId,
    );

    if (customMatch && customMatch.tracks.length > 0) {
      handlePlayTrack(customMatch.tracks[0], customMatch.tracks);
      return;
    }

    try {
      setIsLoadingStream(true);
      const query = item.title || item.name || "Top Hits";
      const search = await api.searchTracks(query);
      if (search.tracks.length > 0) {
        handlePlayTrack(search.tracks[0], search.tracks);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingStream(false);
    }
  };

  // Toggle favorite / like
  const handleToggleLike = useCallback(
    (track?: Track | null) => {
      const target = track || currentTrack;
      if (!target) return;

      store.toggleFavorite(target).then(({ isLiked, favorites: updated }) => {
        setFavorites(updated);
        showToast(
          isLiked ? "Saved to Favorites" : "Removed from Favorites",
          target.title,
          isLiked ? "heart" : "info",
        );
      });
    },
    [currentTrack, showToast],
  );

  // Create Custom Playlist
  const handleCreatePlaylist = async (playlistName: string) => {
    const newPl = await store.createPlaylist(
      playlistName,
      currentTrack || undefined,
    );
    setCustomPlaylists((prev) => [newPl, ...prev]);
    openPlaylist(newPl);
    showToast("Playlist Created", playlistName, "success");
  };

  // Generate AI Playlist using Gemini + Supabase DB
  const handleGenerateAIPlaylist = async (prompt: string, count: number) => {
    try {
      showToast("Musify AI", "Curating playlist & matching audio...", "info");
      const result = await store.generateAIPlaylist(prompt, count);
      const playlists = await store.getPlaylists();
      setCustomPlaylists(playlists);
      const newPl = playlists.find((p) => p.id === result.playlistId) || {
        id: result.playlistId,
        name: result.playlistName,
        description: result.description,
        tracks: result.tracks,
        artwork: result.tracks[0]?.artworkUrl,
      };
      openPlaylist(newPl);
      showToast("✨ AI Playlist Ready!", result.playlistName, "success");
    } catch (err: any) {
      showToast(
        "AI Generation Failed",
        err.message || "Please try another vibe",
        "info",
      );
      throw err;
    }
  };

  // Add track to playlist
  const handleAddTrackToSpecificPlaylist = async (playlistId: string) => {
    if (!playlistToAddTo) return;
    const trackToAdd = playlistToAddTo;
    const updated = await store.addTrackToPlaylist(playlistId, trackToAdd);
    setCustomPlaylists(updated);
    const targetPlaylist = updated.find((p) => p.id === playlistId);
    if (activePlaylist?.id === playlistId) {
      if (targetPlaylist)
        setActivePlaylist((prev) =>
          prev ? { ...prev, tracks: targetPlaylist.tracks } : null,
        );
    }
    setPlaylistToAddTo(null);
    showToast(
      `Added to "${targetPlaylist?.name || "Playlist"}"`,
      trackToAdd.title,
      "success",
    );
  };

  // Remove track from current playlist
  const handleRemoveTrackFromPlaylist = async (track: Track) => {
    if (!activePlaylist?.isCustom) return;
    const updated = await store.removeTrackFromPlaylist(
      activePlaylist.id,
      track.id,
    );
    setCustomPlaylists(updated);
    const match = updated.find((p) => p.id === activePlaylist.id);
    if (match)
      setActivePlaylist((prev) =>
        prev ? { ...prev, tracks: match.tracks } : null,
      );
    showToast("Removed from playlist", track.title, "info");
  };

  // Delete Playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    const updated = await store.deletePlaylist(playlistId);
    setCustomPlaylists(updated);
    setActive("Home");
    setActivePlaylist(null);
    showToast("Playlist Deleted", undefined, "info");
  };

  // Toggle Lyrics
  const handleToggleLyrics = async () => {
    if (!showLyrics && currentTrack) {
      setShowLyrics(true);
      if (!lyrics) {
        setIsLoadingLyrics(true);
        try {
          const res = await api.getLyrics(
            currentTrack.sourceTrackId,
            currentTrack.title,
            currentTrack.artists[0]?.name,
          );
          setLyrics(res.syncLyrics || res.plainLyrics || null);
        } catch {
          setLyrics(null);
        } finally {
          setIsLoadingLyrics(false);
        }
      }
    } else {
      setShowLyrics(!showLyrics);
    }
  };

  // Synchronize lyrics automatically when track changes if lyrics view is open
  useEffect(() => {
    if (showLyrics && currentTrack) {
      setIsLoadingLyrics(true);
      api
        .getLyrics(
          currentTrack.sourceTrackId,
          currentTrack.title,
          currentTrack.artists[0]?.name,
        )
        .then((res) => {
          setLyrics(res.syncLyrics || res.plainLyrics || null);
        })
        .catch(() => setLyrics(null))
        .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack?.id, showLyrics]);

  const handleSelectQuery = (q: string) => {
    setQuery(q);
    setActive("Search");
    setShowSuggestions(false);
  };

  const handleSelectNav = (name: string) => {
    setActive(name);
    if (name !== "Search") setQuery("");
  };

  const isCurrentLiked = Boolean(
    currentTrack && favoritesIds.has(currentTrack.id),
  );

  const quickPicksTracks = useMemo(() => {
    const exploreTracks =
      exploreFeed?.sections?.[0]?.items
        ?.filter((item) => item.type === "track")
        ?.map((item) => item.data as Track) || [];
    const recTracks = recommendations?.recommendedTracks || [];
    const list = [...recentlyPlayed, ...recTracks, ...exploreTracks];
    const seen = new Set<string>();
    const unique: Track[] = [];
    for (const t of list) {
      if (store.isCleanTrack(t) && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
      if (unique.length >= 8) break;
    }
    return unique;
  }, [recentlyPlayed, recommendations, exploreFeed]);

  const trendingTracks = useMemo(() => {
    if (
      recommendations?.recommendedTracks &&
      recommendations.recommendedTracks.length > 0
    ) {
      return recommendations.recommendedTracks
        .filter(store.isCleanTrack)
        .slice(0, 12);
    }
    const exploreTracks =
      exploreFeed?.sections?.[0]?.items
        ?.filter((item) => item.type === "track")
        ?.map((item) => item.data as Track) || [];
    if (exploreTracks.length > 0) {
      return exploreTracks.filter(store.isCleanTrack).slice(0, 12);
    }
    return [];
  }, [recommendations, exploreFeed]);

  const dynamicArtists = useMemo(() => {
    const artistMap = new Map<
      string,
      { id: string; name: string; avatar?: string }
    >();
    const pool = [...trendingTracks, ...quickPicksTracks];
    for (const track of pool) {
      for (const artist of track.artists) {
        if (
          artist.name &&
          artist.name !== "Musify Artist" &&
          artist.name !== "YouTube Artist" &&
          !artistMap.has(artist.name)
        ) {
          artistMap.set(artist.name, {
            id: artist.id || artist.name,
            name: artist.name,
            avatar: track.artworkUrl,
          });
        }
      }
    }
    const derived = Array.from(artistMap.values()).slice(0, 8);
    if (derived.length > 0) return derived;
    return POPULAR_ARTISTS.map((a) => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
    }));
  }, [trendingTracks, quickPicksTracks]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#07090e] text-zinc-100 selection:bg-white/20 flex flex-col font-sans">
      {/* Dynamic Canvas Ambient Blooms */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full blur-[140px] transition-all duration-1000"
        style={{ background: artworkTheme.glowRgba }}
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-40 h-[520px] w-[520px] rounded-full blur-[140px] transition-all duration-1000"
        style={{ background: artworkTheme.glowRgba }}
      />

      {/* Invisible YouTube Audio Engine (Zero 403 Errors, Full Sound Out of Speakers) */}
      <YouTubeAudioEngine
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        isRepeat={isRepeat}
        onTimeUpdate={(curr, dur) => {
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
        }}
        onEnded={handleTrackEnded}
        onIsPlayingChange={setIsPlaying}
        seekToTime={seekToTime}
        onSeekHandled={() => setSeekToTime(null)}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
      />

      <div className="flex flex-1 min-h-0 w-full max-w-[1920px] mx-auto overflow-hidden pb-[84px]">
        {/* Modular Left Desktop Sidebar */}
        <Sidebar
          activeNav={active}
          onSelectNav={handleSelectNav}
          playlists={customPlaylists}
          activePlaylistId={activePlaylist?.id}
          onSelectPlaylist={openPlaylist}
          onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
          favoritesCount={favorites.length}
          recentlyPlayedCount={recentlyPlayed.length}
        />

        {/* Modular Mobile Navigation Drawer */}
        <MobileNavDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeNav={active}
          onSelectNav={handleSelectNav}
          playlists={customPlaylists}
          activePlaylistId={activePlaylist?.id}
          onSelectPlaylist={openPlaylist}
          onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
          favoritesCount={favorites.length}
          recentlyPlayedCount={recentlyPlayed.length}
        />

        {/* Center Main Content Feed */}
        <section className="min-w-0 flex-1 h-full overflow-y-auto custom-scrollbar px-5 pb-12 sm:px-8 lg:px-9">
          {/* Modular Top Header */}
          <TopHeader
            query={query}
            onQueryChange={(q) => {
              setQuery(q);
              if (q) {
                setActive("Search");
                setShowSuggestions(true);
              }
            }}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            onSelectSuggestion={handleSelectQuery}
            onCloseSuggestions={() => setShowSuggestions(false)}
            onClearQuery={() => setQuery("")}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            authUser={authUser}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onSignOut={handleSignOut}
            onShowToast={showToast}
            searchInputRef={searchInputRef}
          />

          {/* VIEW: Search Results */}
          {debouncedQuery ? (
            <div className="py-8 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[2px] text-zinc-500 font-semibold">
                    SEARCH RESULTS
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white">
                    Results for &ldquo;{debouncedQuery}&rdquo;
                  </h1>
                </div>
                {isSearching && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Searching...
                  </div>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((track, idx) => (
                    <TrackRow
                      key={`${track.id}-${idx}`}
                      track={track}
                      index={idx}
                      isCurrent={currentTrack?.id === track.id}
                      isLiked={favoritesIds.has(track.id)}
                      onPlay={(t) => handlePlayTrack(t, searchResults, idx)}
                      onToggleLike={(t) => handleToggleLike(t)}
                      onAddToPlaylist={(t) => setPlaylistToAddTo(t)}
                    />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <Icon
                    name="search"
                    size={32}
                    className="text-zinc-600 mb-3"
                  />
                  <p className="text-base font-medium text-zinc-300">
                    No results found
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try searching for another artist, song, or album.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* VIEW: Search Tab Landing */}
          {active === "Search" && !debouncedQuery && (
            <div className="py-8 space-y-9 animate-fade-in">
              {recommendations &&
                recommendations.trendingQueries.length > 0 && (
                  <section>
                    <div className="mb-3.5 flex items-center gap-2">
                      <Icon
                        name="trending"
                        size={15}
                        className="text-zinc-400"
                      />
                      <h2 className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-400">
                        Trending Searches
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.trendingQueries.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleSelectQuery(item)}
                          className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              {/* Browse Genres & Moods */}
              {recommendations && recommendations.categories.length > 0 && (
                <section>
                  <div className="mb-3.5 flex items-center gap-2">
                    <Icon name="compass" size={15} className="text-zinc-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-400">
                      Browse Genres & Moods
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {recommendations.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectQuery(cat.query)}
                        style={{ backgroundColor: `${cat.color}15` }}
                        className="group relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-3.5 text-left transition hover:scale-[1.02] hover:border-white/25 shadow-lg backdrop-blur-md"
                      >
                        <div
                          className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full blur-xl opacity-60 transition group-hover:opacity-100"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-bold text-white z-10">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 z-10">
                          Explore &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* VIEW: Modular Playlist Detail */}
          {active === "PlaylistDetail" && activePlaylist && (
            <PlaylistDetailView
              playlist={activePlaylist}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              favoritesIds={favoritesIds}
              onPlayTrack={handlePlayTrack}
              onToggleLike={handleToggleLike}
              onAddToPlaylist={(t) => setPlaylistToAddTo(t)}
              onRemoveTrack={handleRemoveTrackFromPlaylist}
              onDeletePlaylist={() => handleDeletePlaylist(activePlaylist.id)}
              onBack={() => setActive("Home")}
            />
          )}

          {/* VIEW: Recently Played History */}
          {active === "Recently played" && (
            <div className="py-8 space-y-6 animate-fade-in">
              <div>
                <p className="text-xs uppercase tracking-[2px] text-zinc-500 font-semibold">
                  HISTORY
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white tracking-tight">
                  Recently Played
                </h1>
              </div>

              {recentlyPlayed.length > 0 ? (
                <div className="space-y-1">
                  {recentlyPlayed.map((track, idx) => (
                    <TrackRow
                      key={`${track.id}-${idx}`}
                      track={track}
                      index={idx}
                      isCurrent={currentTrack?.id === track.id}
                      isLiked={favoritesIds.has(track.id)}
                      onPlay={(t) => handlePlayTrack(t, recentlyPlayed, idx)}
                      onToggleLike={(t) => handleToggleLike(t)}
                      onAddToPlaylist={(t) => setPlaylistToAddTo(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center text-zinc-500">
                  <Icon name="clock" size={32} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium text-zinc-300">
                    No recently played tracks
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Your Favorites */}
          {active === "Your favorites" && (
            <div className="py-8 space-y-6 animate-fade-in">
              <div>
                <p className="text-xs uppercase tracking-[2px] text-zinc-500 font-semibold">
                  COLLECTION
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white tracking-tight">
                  Your Favorites ({favorites.length})
                </h1>
              </div>

              {favorites.length > 0 ? (
                <div className="space-y-1">
                  {favorites.map((track, idx) => (
                    <TrackRow
                      key={`${track.id}-${idx}`}
                      track={track}
                      index={idx}
                      isCurrent={currentTrack?.id === track.id}
                      isLiked={true}
                      onPlay={(t) => handlePlayTrack(t, favorites, idx)}
                      onToggleLike={(t) => handleToggleLike(t)}
                      onAddToPlaylist={(t) => setPlaylistToAddTo(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center text-zinc-500">
                  <Icon
                    name="heart"
                    size={32}
                    className="mb-3 opacity-40 text-rose-500"
                  />
                  <p className="text-sm font-medium text-zinc-300">
                    No favorite songs yet
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Click the heart icon on any song to save it here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Explore Tab */}
          {active === "Explore" && (
            <div className="py-8 space-y-10 animate-fade-in">
              <div>
                <p className="text-xs uppercase tracking-[2px] text-zinc-500 font-semibold">
                  EXPLORE MUSIC
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white tracking-tight">
                  Curated Shelves & Charts
                </h1>
              </div>

              {isLoadingExplore && (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <p className="text-xs text-zinc-500">
                    Loading explore feed...
                  </p>
                </div>
              )}

              {exploreFeed?.sections.map((section, sIdx) => (
                <section key={sIdx}>
                  <h2 className="mb-4 text-lg font-bold text-white tracking-tight">
                    {section.title}
                  </h2>
                  <div className="space-y-1">
                    {section.items.map((item, iIdx) => {
                      if (item.type === "playlist") {
                        const pl = item.data as Playlist;
                        return (
                          <div
                            key={`${pl.id}-${iIdx}`}
                            onClick={() => openPlaylist(pl)}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] transition cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-12 w-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                                {pl.artworkUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={pl.artworkUrl}
                                    alt={pl.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                    <Icon name="music" size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-semibold text-white">
                                  {pl.title}
                                </h4>
                                <p className="truncate text-xs text-zinc-400">
                                  {pl.author || "Curated Playlist"}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-medium shrink-0 ml-3">
                              Open Playlist &rarr;
                            </span>
                          </div>
                        );
                      }

                      const track = item.data as Track;
                      const sectionTracks = section.items
                        .filter((i) => i.type === "track")
                        .map((i) => i.data as Track);
                      return (
                        <TrackRow
                          key={`${track.id}-${iIdx}`}
                          track={track}
                          index={iIdx}
                          isCurrent={currentTrack?.id === track.id}
                          isLiked={favoritesIds.has(track.id)}
                          onPlay={(t) => handlePlayTrack(t, sectionTracks, iIdx)}
                          onToggleLike={(t) => handleToggleLike(t)}
                          onAddToPlaylist={(t) => setPlaylistToAddTo(t)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* VIEW: Home Feed (Default) */}
          {active === "Home" && !debouncedQuery && (
            <div className="space-y-8 animate-fade-in pb-12">
              {/* Modular Hero Banner Card */}
              <HeroBanner
                greeting={greeting}
                title="Music for a better you."
                subtitle="Discover new sounds, rediscover old favorites, and let the music take you further."
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onOpenAI={() => setShowCreatePlaylistModal(true)}
                onPlayHero={() => {
                  if (currentTrack) {
                    togglePlay();
                  } else if (trendingTracks.length > 0) {
                    handlePlayTrack(trendingTracks[0], trendingTracks, 0);
                  } else if (quickPicksTracks.length > 0) {
                    handlePlayTrack(quickPicksTracks[0], quickPicksTracks, 0);
                  }
                }}
              />

              {/* Quick Picks / Jump Back In */}
              {quickPicksTracks.length > 0 && (
                <section>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon
                        name="sparkles"
                        size={15}
                        className="text-indigo-400"
                      />
                      <h2 className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-400">
                        Quick Picks
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    {quickPicksTracks.map((t, idx) => {
                      const isCur = currentTrack?.id === t.id;
                      return (
                        <div
                          key={`${t.id}-${idx}`}
                          onClick={() => handlePlayTrack(t, quickPicksTracks, idx)}
                          className={`group relative flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0c0e15]/70 p-2.5 transition-all duration-200 hover:border-white/20 hover:bg-[#131622] hover:shadow-lg cursor-pointer select-none ${
                            isCur
                              ? "border-indigo-500/40 bg-indigo-500/10 shadow-indigo-500/10 shadow-lg"
                              : ""
                          }`}
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                            {t.artworkUrl || t.sourceTrackId ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  t.artworkUrl ||
                                  `https://i.ytimg.com/vi/${t.sourceTrackId}/hqdefault.jpg`
                                }
                                alt={t.title}
                                onError={(e) => {
                                  if (t.sourceTrackId) {
                                    (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${t.sourceTrackId}/hqdefault.jpg`;
                                  }
                                }}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                <Icon name="music" size={18} />
                              </div>
                            )}
                            {isCur && isPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                <div className="flex items-end gap-[2px] h-3.5">
                                  <span className="w-[2px] bg-white rounded-full equalizer-bar-1" />
                                  <span className="w-[2px] bg-white rounded-full equalizer-bar-2" />
                                  <span className="w-[2px] bg-white rounded-full equalizer-bar-3" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-xs sm:text-sm font-semibold tracking-tight ${
                                isCur ? "text-indigo-300" : "text-white"
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="truncate text-[11px] text-zinc-400 mt-0.5">
                              {t.artists.map((a) => a.name).join(", ")}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCur) togglePlay();
                              else handlePlayTrack(t, quickPicksTracks, idx);
                            }}
                            aria-label={`Play ${t.title}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md transition hover:scale-105 active:scale-95 shrink-0 ${
                              isCur
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Icon
                              name={isCur && isPlaying ? "pause" : "play"}
                              size={12}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Recommended for you Section (Featured Playlists) */}
              <MediaSection
                title="Recommended for you"
                actionText="See all"
                onAction={() => setActive("Explore")}
              >
                {/* Dynamically render API playlists, fallback to custom playlists */}
                {recommendations &&
                recommendations.featuredPlaylists &&
                recommendations.featuredPlaylists.length > 0
                  ? recommendations.featuredPlaylists.map((pl) => (
                      <MediaCard
                        key={pl.id}
                        id={pl.id}
                        title={pl.title}
                        subtitle={pl.description || "Curated Playlist"}
                        artworkUrl={pl.artworkUrl}
                        badge={`Playlist • ${pl.tracksCount || 50} tracks`}
                        onClick={() => openPlaylist(pl)}
                        onPlay={() => handlePlayPlaylist(pl)}
                      />
                    ))
                  : customPlaylists
                      .slice(0, 6)
                      .map((pl) => (
                        <MediaCard
                          key={pl.id}
                          id={pl.id}
                          title={pl.name}
                          subtitle={pl.description}
                          artworkUrl={pl.artwork}
                          badge={`Playlist • ${pl.tracks.length} tracks`}
                          onClick={() => openPlaylist(pl)}
                          onPlay={() => handlePlayPlaylist(pl)}
                        />
                      ))}
              </MediaSection>

              {/* Trending Worldwide Section */}
              <MediaSection
                title="Trending Worldwide"
                actionText="Explore charts"
                onAction={() => setActive("Explore")}
              >
                {trendingTracks.map((track, idx) => (
                  <MediaCard
                    key={`${track.id}-${idx}`}
                    id={track.id}
                    title={track.title}
                    subtitle={track.artists.map((a) => a.name).join(", ")}
                    artworkUrl={track.artworkUrl}
                    isCurrent={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onClick={() => handlePlayTrack(track, trendingTracks, idx)}
                    onPlay={() => handlePlayTrack(track, trendingTracks, idx)}
                  />
                ))}
              </MediaSection>

              {/* Popular Artists Shelf */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500">
                      DISCOVER CREATORS
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Popular Artists
                    </h2>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {dynamicArtists.map((artist) => (
                    <div
                      key={artist.id || artist.name}
                      onClick={() => handleSelectQuery(artist.name)}
                      className="group flex flex-col items-center gap-2.5 shrink-0 w-24 sm:w-28 text-center cursor-pointer select-none"
                    >
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-white/10 bg-zinc-800 shadow-lg transition duration-300 group-hover:scale-105 group-hover:border-white/30 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        {artist.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={artist.avatar}
                            alt={artist.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
                            <Icon name="music" size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="truncate text-xs font-bold text-white group-hover:text-indigo-300 transition max-w-[90px]">
                          {artist.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Artist
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Dynamic Vibe Collections Grid */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500">
                      MOODS & ACTIVITIES
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Vibe Collections
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {(recommendations?.categories &&
                  recommendations.categories.length > 0
                    ? recommendations.categories.slice(0, 8)
                    : VIBE_STATIONS
                  ).map((station: any) => {
                    const bgGradient = station.color
                      ? `linear-gradient(135deg, ${station.color}88 0%, #07090e 100%)`
                      : "linear-gradient(135deg, #6366f188 0%, #07090e 100%)";
                    return (
                      <div
                        key={station.id}
                        onClick={() =>
                          handleSelectQuery(station.query || station.name)
                        }
                        style={{
                          background: station.artwork ? undefined : bgGradient,
                        }}
                        className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] p-4 aspect-[4/3] cursor-pointer shadow-lg transition hover:scale-[1.02] hover:border-white/25"
                      >
                        {station.artwork && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={station.artwork}
                            alt={station.title || station.name}
                            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="relative z-10">
                          <h4 className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                            {station.title || station.name}
                          </h4>
                          <p className="text-[11px] text-zinc-300 mt-0.5 font-medium opacity-80">
                            {station.subtitle || "Explore songs & playlists"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Dynamic Curated Explore Sections on Home */}
              {exploreFeed?.sections &&
                exploreFeed.sections.map((section, sIdx) => {
                  const secTracks = section.items
                    .filter((item) => item.type === "track")
                    .map((item) => item.data as Track);
                  if (secTracks.length === 0) return null;
                  return (
                    <MediaSection
                      key={`home-feed-sec-${sIdx}`}
                      title={section.title}
                      actionText="Explore"
                      onAction={() => setActive("Explore")}
                    >
                      {secTracks.slice(0, 8).map((t, idx) => (
                        <MediaCard
                          key={`${t.id}-${idx}`}
                          id={t.id}
                          title={t.title}
                          subtitle={t.artists.map((a) => a.name).join(", ")}
                          artworkUrl={t.artworkUrl}
                          isCurrent={currentTrack?.id === t.id}
                          isPlaying={isPlaying}
                          onClick={() => handlePlayTrack(t, secTracks, idx)}
                          onPlay={() => handlePlayTrack(t, secTracks, idx)}
                        />
                      ))}
                    </MediaSection>
                  );
                })}

              {/* Recently played Section */}
              {recentlyPlayed.length > 0 && (
                <MediaSection
                  title="Recently played"
                  actionText="See all"
                  onAction={() => setActive("Recently played")}
                >
                  {recentlyPlayed.slice(0, 6).map((track, idx) => (
                    <MediaCard
                      key={`${track.id}-${idx}`}
                      id={track.id}
                      title={track.title}
                      subtitle={track.artists.map((a) => a.name).join(", ")}
                      artworkUrl={track.artworkUrl}
                      isCurrent={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      onClick={() => handlePlayTrack(track, recentlyPlayed, idx)}
                      onPlay={() => handlePlayTrack(track, recentlyPlayed, idx)}
                    />
                  ))}
                </MediaSection>
              )}
            </div>
          )}
        </section>

        {/* Right Now Playing Panel */}
        {isRightPanelOpen && (
          <NowPlayingPanel
            currentTrack={currentTrack}
            queue={queue}
            queueIndex={queueIndex}
            isLiked={isCurrentLiked}
            onToggleLike={() => handleToggleLike(currentTrack)}
            onPlayTrack={(t, idx) => handlePlayTrack(t, queue, idx)}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            isShuffle={isShuffle}
            onToggleShuffle={handleToggleShuffle}
            isRepeat={isRepeat}
            onToggleRepeat={handleToggleRepeat}
            onExpandVisualizer={() => setShowFullscreenVisualizer(true)}
            onOpenQueueModal={() => setShowQueueModal(true)}
          />
        )}
      </div>

      {/* Floating Glassmorphic Bottom Player Dock */}
      <AudioPlayer
        currentTrack={currentTrack}
        playbackUrl={playbackUrl}
        isLoadingStream={isLoadingStream}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        isLiked={isCurrentLiked}
        onToggleLike={() => handleToggleLike(currentTrack)}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onToggleLyrics={handleToggleLyrics}
        onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isRightPanelOpen={isRightPanelOpen}
        onOpenVisualizer={() => setShowFullscreenVisualizer(true)}
      />

      {/* Synchronized Karaoke Lyrics Modal */}
      <LyricsModal
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        track={currentTrack}
        lyrics={lyrics}
        isLoading={isLoadingLyrics}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      {/* Interactive Queue Manager Modal */}
      <QueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        currentTrack={currentTrack}
        queue={queue}
        queueIndex={queueIndex}
        onPlayTrack={(t, idx) => handlePlayTrack(t, queue, idx)}
        onRemoveFromQueue={handleRemoveFromQueue}
        onMoveQueueItem={handleMoveQueueItem}
        onClearQueue={handleClearQueue}
      />

      {/* Fullscreen Ambient Visualizer & Party Mode */}
      <FullscreenVisualizer
        isOpen={showFullscreenVisualizer}
        onClose={() => setShowFullscreenVisualizer(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        isRepeat={isRepeat}
        onToggleRepeat={handleToggleRepeat}
        isLiked={isCurrentLiked}
        onToggleLike={() => handleToggleLike(currentTrack)}
        accentGlow={artworkTheme.glowRgba}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistToAddTo)}
        track={playlistToAddTo}
        playlists={customPlaylists}
        onClose={() => setPlaylistToAddTo(null)}
        onSelectPlaylist={handleAddTrackToSpecificPlaylist}
        onCreateNewPlaylist={() => {
          setPlaylistToAddTo(null);
          setShowCreatePlaylistModal(true);
        }}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
        onCreate={handleCreatePlaylist}
        onGenerateAI={handleGenerateAIPlaylist}
      />

      {/* Account Authentication & Cloud Sync Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Dynamic Toast Feedback Overlay */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}

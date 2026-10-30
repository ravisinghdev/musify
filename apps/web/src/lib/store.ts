import type { Track } from "../types/music";

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: Track[];
  createdAt?: string;
  updatedAt?: string;
}

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

// Initial tracks matching top global Billboard sensations
export const SEED_TRACKS: Record<string, Track> = {
  dieWithASmile: {
    id: "yt_die_with_a_smile",
    title: "Die With A Smile",
    artists: [{ id: "gaga-bruno", name: "Lady Gaga, Bruno Mars" }],
    artworkUrl: "https://i.ytimg.com/vi/DlFXDl_ROAM/hqdefault.jpg",
    durationMs: 251000,
    source: "youtube",
    sourceTrackId: "DlFXDl_ROAM",
  },
  birdsOfAFeather: {
    id: "yt_birds_of_a_feather",
    title: "BIRDS OF A FEATHER",
    artists: [{ id: "billie-eilish", name: "Billie Eilish" }],
    artworkUrl: "https://i.ytimg.com/vi/d5gx74aac6o/hqdefault.jpg",
    durationMs: 196000,
    source: "youtube",
    sourceTrackId: "d5gx74aac6o",
  },
  sapphire: {
    id: "yt_sapphire",
    title: "Shape of You",
    artists: [{ id: "ed-sheeran", name: "Ed Sheeran" }],
    artworkUrl: "https://i.ytimg.com/vi/xTvyyoF_LZY/hqdefault.jpg",
    durationMs: 233000,
    source: "youtube",
    sourceTrackId: "xTvyyoF_LZY",
  },
  espresso: {
    id: "yt_espresso",
    title: "Espresso",
    artists: [{ id: "sabrina-carpenter", name: "Sabrina Carpenter" }],
    artworkUrl: "https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg",
    durationMs: 175000,
    source: "youtube",
    sourceTrackId: "eVli-tstM5E",
  },
  callOutMyName: {
    id: "yt_call_out_my_name",
    title: "Call Out My Name",
    artists: [{ id: "the-weeknd", name: "The Weeknd" }],
    artworkUrl: "https://i.ytimg.com/vi/M4ZoCHID9GI/hqdefault.jpg",
    durationMs: 228000,
    source: "youtube",
    sourceTrackId: "M4ZoCHID9GI",
  },
  iLikeYou: {
    id: "yt_i_like_you",
    title: "I Like You",
    artists: [{ id: "post-malone", name: "Post Malone" }],
    artworkUrl: "https://i.ytimg.com/vi/n-UIRqgXjGA/hqdefault.jpg",
    durationMs: 192000,
    source: "youtube",
    sourceTrackId: "n-UIRqgXjGA",
  },
  blindingLights: {
    id: "yt_blinding_lights",
    title: "Blinding Lights",
    artists: [{ id: "the-weeknd", name: "The Weeknd" }],
    artworkUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    durationMs: 200000,
    source: "youtube",
    sourceTrackId: "4NRXx6U8ABQ",
  },
  husn: {
    id: "yt_husn",
    title: "Husn",
    artists: [{ id: "anuv-jain", name: "Anuv Jain" }],
    artworkUrl: "https://i.ytimg.com/vi/_deqdZmKzyg/hqdefault.jpg",
    durationMs: 218000,
    source: "youtube",
    sourceTrackId: "_deqdZmKzyg",
  },
  chooLo: {
    id: "yt_choo_lo",
    title: "Choo Lo",
    artists: [{ id: "the-local-train", name: "The Local Train" }],
    artworkUrl: "https://i.ytimg.com/vi/opwZ_PJ-F_E/hqdefault.jpg",
    durationMs: 233000,
    source: "youtube",
    sourceTrackId: "opwZ_PJ-F_E",
  },
};

export const INITIAL_PLAYLISTS: CustomPlaylist[] = [
  {
    id: "cp-chill-vibes",
    name: "Chill Vibes",
    description: "Relaxing melodies and mellow beats to unwind to.",
    artwork: "https://i.ytimg.com/vi/_deqdZmKzyg/hqdefault.jpg",
    tracks: [
      SEED_TRACKS.husn,
      SEED_TRACKS.sapphire,
      SEED_TRACKS.chooLo,
      SEED_TRACKS.iLikeYou,
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cp-lofi-beats",
    name: "Lo-Fi Beats",
    description: "Quiet sunset aesthetics for study and calm.",
    artwork: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    tracks: [SEED_TRACKS.sapphire, SEED_TRACKS.callOutMyName, SEED_TRACKS.husn],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cp-workout-mix",
    name: "Workout Mix",
    description: "High-energy hits to power your workout sessions.",
    artwork: "https://i.ytimg.com/vi/DlFXDl_ROAM/hqdefault.jpg",
    tracks: [
      SEED_TRACKS.dieWithASmile,
      SEED_TRACKS.iLikeYou,
      SEED_TRACKS.callOutMyName,
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cp-discover-weekly",
    name: "Discover Weekly",
    description: "Hand-picked dynamic track discoveries updated for you.",
    artwork: "https://i.ytimg.com/vi/d5gx74aac6o/hqdefault.jpg",
    tracks: [
      SEED_TRACKS.dieWithASmile,
      SEED_TRACKS.sapphire,
      SEED_TRACKS.husn,
      SEED_TRACKS.callOutMyName,
      SEED_TRACKS.iLikeYou,
      SEED_TRACKS.chooLo,
    ],
    createdAt: new Date().toISOString(),
  },
];

export interface SafeUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

const KEYS = {
  SESSION_TOKEN: "musify_session_token",
  AUTH_TOKEN: "musify_auth_token",
  AUTH_USER: "musify_auth_user",
  FAVORITES: "musify_favorites",
  RECENTLY_PLAYED: "musify_recently_played",
  PLAYLISTS: "musify_custom_playlists",
};

/**
 * Ensures a secure, persistent anonymous device session token in the client.
 */
function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = localStorage.getItem(KEYS.SESSION_TOKEN);
    if (!token || !/^[a-zA-Z0-9_-]{10,64}$/.test(token)) {
      token =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `ms_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(KEYS.SESSION_TOKEN, token);
    }
    return token;
  } catch {
    return "";
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-user-session-id": getSessionToken(),
  };

  if (typeof window !== "undefined") {
    try {
      const authToken = localStorage.getItem(KEYS.AUTH_TOKEN);
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
    } catch {}
  }

  return headers;
}

function isCleanTrack(t: Track): boolean {
  return Boolean(t && t.id && t.title && t.sourceTrackId);
}

/**
 * musify Unified Persistence Store
 * Full Supabase PostgreSQL backend synchronization with instant local caching.
 */
export const store = {
  isCleanTrack,
  getSessionToken,

  // 0. Auth & Account Management
  getStoredUser(): SafeUser | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async getMe(): Promise<SafeUser> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data.user));
          if (data.sessionId) {
            localStorage.setItem(KEYS.SESSION_TOKEN, data.sessionId);
          }
          return data.user;
        }
      }
    } catch {}

    const cached = store.getStoredUser();
    if (cached) return cached;

    return {
      id: getSessionToken(),
      email: null,
      displayName: "Guest Listener",
      avatarUrl: null,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };
  },

  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{
    user: SafeUser;
    token: string;
    requiresVerification: boolean;
    debugCode?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Registration failed");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(KEYS.AUTH_TOKEN, data.token);
    }
    if (data.user) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data.user));
      localStorage.setItem(KEYS.SESSION_TOKEN, data.user.id);
    }

    return data;
  },

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: SafeUser;
    token: string;
    requiresVerification: boolean;
    debugCode?: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(KEYS.AUTH_TOKEN, data.token);
    }
    if (data.user) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data.user));
      localStorage.setItem(KEYS.SESSION_TOKEN, data.user.id);
    }

    return data;
  },

  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{ user: SafeUser; token: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Email verification failed");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(KEYS.AUTH_TOKEN, data.token);
    }
    if (data.user) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data.user));
      localStorage.setItem(KEYS.SESSION_TOKEN, data.user.id);
    }

    return data;
  },

  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; debugCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to resend verification code");
    }

    return await res.json();
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(KEYS.AUTH_TOKEN);
      localStorage.removeItem(KEYS.AUTH_USER);
      // Generate fresh anonymous session token so subsequent actions are isolated
      const freshToken =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `ms_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(KEYS.SESSION_TOKEN, freshToken);
    } catch {}
  },

  async updateProfile(
    displayName?: string,
    avatarUrl?: string,
  ): Promise<SafeUser> {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ displayName, avatarUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch {
      // Non-blocking fallback to local session update
    }

    // Fallback for guest or offline mode: Update local user object
    let existing: SafeUser;
    try {
      const cached = localStorage.getItem(KEYS.AUTH_USER);
      existing = cached
        ? JSON.parse(cached)
        : {
            id: `guest_${Date.now()}`,
            email: "guest@musify.app",
            displayName: displayName || "Musify Guest",
            avatarUrl: avatarUrl || null,
            isAnonymous: true,
            createdAt: new Date().toISOString(),
          };
    } catch {
      existing = {
        id: `guest_${Date.now()}`,
        email: "guest@musify.app",
        displayName: displayName || "Musify Guest",
        avatarUrl: avatarUrl || null,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
    }

    const updated: SafeUser = {
      ...existing,
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    };

    try {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(updated));
    } catch {}

    return updated;
  },

  // 1. Favorites Management
  async getFavorites(): Promise<Track[]> {
    if (typeof window === "undefined") return [];

    // Instant local read
    let localFavs: Track[] = [];
    try {
      const cached = localStorage.getItem(KEYS.FAVORITES);
      if (cached) localFavs = JSON.parse(cached);
    } catch {}

    // Background sync from secure Supabase backend
    try {
      const res = await fetch(`${API_BASE}/user/favorites`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.favorites)) {
          localStorage.setItem(KEYS.FAVORITES, JSON.stringify(data.favorites));
          return data.favorites;
        }
      }
    } catch {}

    return localFavs;
  },

  async toggleFavorite(
    track: Track,
  ): Promise<{ isLiked: boolean; favorites: Track[] }> {
    // 1. Optimistic local update
    const currentList = await store.getFavorites();
    const exists = currentList.some((t) => t.id === track.id);
    const updated = exists
      ? currentList.filter((t) => t.id !== track.id)
      : [track, ...currentList];

    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    } catch {}

    // 2. Persist to Supabase Database
    try {
      const res = await fetch(`${API_BASE}/user/favorites/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          track: {
            id: track.id,
            title: track.title,
            artists: track.artists || [],
            album: track.album,
            durationMs: track.durationMs,
            artworkUrl: track.artworkUrl,
            sourceTrackId: track.sourceTrackId || track.id.replace(/^yt_/, ""),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.favorites)) {
          localStorage.setItem(KEYS.FAVORITES, JSON.stringify(data.favorites));
          return { isLiked: data.isLiked, favorites: data.favorites };
        }
      }
    } catch (err) {
      console.warn("Offline favorite toggle saved to local storage:", err);
    }

    return { isLiked: !exists, favorites: updated };
  },

  // 2. Playlists Management
  async getPlaylists(): Promise<CustomPlaylist[]> {
    if (typeof window === "undefined") return INITIAL_PLAYLISTS;

    let cached: CustomPlaylist[] = [];
    try {
      const data = localStorage.getItem(KEYS.PLAYLISTS);
      if (data) cached = JSON.parse(data);
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/user/playlists`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.playlists)) {
          if (data.playlists.length > 0) {
            localStorage.setItem(
              KEYS.PLAYLISTS,
              JSON.stringify(data.playlists),
            );
            return data.playlists;
          }

          // If brand new user in DB, seed their initial playlists
          if (data.playlists.length === 0 && cached.length === 0) {
            for (const seed of INITIAL_PLAYLISTS) {
              await store.createPlaylist(seed.name, seed.tracks[0]);
            }
            const recheck = await fetch(`${API_BASE}/user/playlists`, {
              headers: getAuthHeaders(),
            });
            if (recheck.ok) {
              const reData = await recheck.json();
              if (reData.playlists?.length) {
                localStorage.setItem(
                  KEYS.PLAYLISTS,
                  JSON.stringify(reData.playlists),
                );
                return reData.playlists;
              }
            }
          }
        }
      }
    } catch {}

    if (cached.length > 0) return cached;
    return INITIAL_PLAYLISTS;
  },

  async createPlaylist(
    name: string,
    initialTrack?: Track,
  ): Promise<CustomPlaylist> {
    const cleanName = name.trim() || "My Playlist";
    let newPlaylist: CustomPlaylist = {
      id: `cp-${Date.now()}`,
      name: cleanName,
      description: "Custom user created playlist.",
      artwork:
        initialTrack?.artworkUrl ||
        "/icon-192.png",
      tracks: initialTrack ? [initialTrack] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/user/playlists`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: cleanName,
          description: "Custom user playlist",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.playlist) {
          newPlaylist = data.playlist;
          if (initialTrack) {
            const trackRes = await fetch(
              `${API_BASE}/user/playlists/${newPlaylist.id}/tracks`,
              {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  track: {
                    id: initialTrack.id,
                    title: initialTrack.title,
                    artists: initialTrack.artists || [],
                    album: initialTrack.album,
                    durationMs: initialTrack.durationMs,
                    artworkUrl: initialTrack.artworkUrl,
                    sourceTrackId:
                      initialTrack.sourceTrackId ||
                      initialTrack.id.replace(/^yt_/, ""),
                  },
                }),
              },
            );
            if (trackRes.ok) {
              const trackData = await trackRes.json();
              if (trackData.playlist) newPlaylist = trackData.playlist;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Offline playlist creation cached:", err);
    }

    // Update local cache
    try {
      const current = await store.getPlaylists();
      const updated = [
        newPlaylist,
        ...current.filter((p) => p.id !== newPlaylist.id),
      ];
      localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(updated));
    } catch {}

    return newPlaylist;
  },

  async addTrackToPlaylist(
    playlistId: string,
    track: Track,
  ): Promise<CustomPlaylist[]> {
    let updatedList: CustomPlaylist[] = [];
    try {
      const res = await fetch(
        `${API_BASE}/user/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            track: {
              id: track.id,
              title: track.title,
              artists: track.artists || [],
              album: track.album,
              durationMs: track.durationMs,
              artworkUrl: track.artworkUrl,
              sourceTrackId:
                track.sourceTrackId || track.id.replace(/^yt_/, ""),
            },
          }),
        },
      );
      if (res.ok) {
        return await store.getPlaylists();
      }
    } catch {}

    // Fallback local update
    const playlists = await store.getPlaylists();
    updatedList = playlists.map((pl) => {
      if (pl.id === playlistId) {
        const hasTrack = pl.tracks.some((t) => t.id === track.id);
        if (!hasTrack) {
          return {
            ...pl,
            tracks: [track, ...pl.tracks],
            artwork: pl.artwork || track.artworkUrl,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return pl;
    });

    try {
      localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(updatedList));
    } catch {}

    return updatedList;
  },

  async removeTrackFromPlaylist(
    playlistId: string,
    trackId: string,
  ): Promise<CustomPlaylist[]> {
    try {
      const res = await fetch(
        `${API_BASE}/user/playlists/${playlistId}/tracks/${trackId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        return await store.getPlaylists();
      }
    } catch {}

    // Fallback local update
    const playlists = await store.getPlaylists();
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.id !== trackId),
          updatedAt: new Date().toISOString(),
        };
      }
      return pl;
    });

    try {
      localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(updated));
    } catch {}

    return updated;
  },

  async deletePlaylist(playlistId: string): Promise<CustomPlaylist[]> {
    try {
      const res = await fetch(`${API_BASE}/user/playlists/${playlistId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await store.getPlaylists();
      }
    } catch {}

    const playlists = await store.getPlaylists();
    const updated = playlists.filter((pl) => pl.id !== playlistId);
    try {
      localStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // 3. Listening History (Deduplicated with Lift-to-Top)
  async getRecentlyPlayed(): Promise<Track[]> {
    if (typeof window === "undefined") return [];

    const dedup = (items: Track[]): Track[] => {
      const seen = new Set<string>();
      const result: Track[] = [];
      for (const t of items) {
        if (!isCleanTrack(t)) continue;
        const key = (t.sourceTrackId || t.id.replace(/^yt_/, "")).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(t);
        }
      }
      return result;
    };

    let localHistory: Track[] = [];
    try {
      const data = localStorage.getItem(KEYS.RECENTLY_PLAYED);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          localHistory = dedup(parsed);
        }
      }
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/user/history`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          const serverHistory = dedup(data.history);
          localStorage.setItem(
            KEYS.RECENTLY_PLAYED,
            JSON.stringify(serverHistory),
          );
          return serverHistory;
        }
      }
    } catch {}

    return localHistory;
  },

  async addRecentlyPlayed(track: Track): Promise<Track[]> {
    if (!isCleanTrack(track)) return await store.getRecentlyPlayed();

    const trackKey = (track.sourceTrackId || track.id.replace(/^yt_/, "")).toLowerCase();

    // Optimistic local update: lift to top by filtering out any older occurrences
    const list = await store.getRecentlyPlayed();
    const filtered = list.filter((t) => {
      const tKey = (t.sourceTrackId || t.id.replace(/^yt_/, "")).toLowerCase();
      return t.id !== track.id && tKey !== trackKey;
    });
    const updated = [track, ...filtered].slice(0, 40);

    try {
      localStorage.setItem(KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
    } catch {}

    // Persist to Supabase Database
    try {
      fetch(`${API_BASE}/user/history`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          track: {
            id: track.id,
            title: track.title,
            artists: track.artists || [],
            album: track.album,
            durationMs: track.durationMs,
            artworkUrl: track.artworkUrl,
            sourceTrackId: track.sourceTrackId || track.id.replace(/^yt_/, ""),
          },
        }),
      }).catch(() => {});
    } catch {}

    return updated;
  },

  // 4. AI Smart Playlist Generator (Gemini 3.6 Flash + Supabase)
  async generateAIPlaylist(
    prompt: string,
    count = 8,
  ): Promise<{
    playlistId: string;
    playlistName: string;
    description: string;
    tracks: Track[];
  }> {
    const res = await fetch(`${API_BASE}/ai/generate-playlist`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, count }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate AI playlist");
    }

    const data = await res.json();
    return data;
  },
};

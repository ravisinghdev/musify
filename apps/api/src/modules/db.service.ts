import { PrismaClient } from "@prisma/client";

// Global singleton to prevent connection leaks during hot reload in Bun
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export interface TrackData {
  id: string;
  title: string;
  artists: Array<{ id: string; name: string }>;
  album?: { id: string; title: string };
  durationMs?: number;
  artworkUrl?: string;
  sourceTrackId: string;
}

export interface CustomPlaylistData {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: TrackData[];
  createdAt: string;
  updatedAt?: string;
}

// Sanitize user-provided text to prevent XSS / script injection attacks
export function sanitizeText(text: string, maxLength = 150): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>?/gm, "") // strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // strip control characters
    .trim()
    .slice(0, maxLength);
}

export const dbService = {
  // 1. Session & Identity Resolution
  async getOrCreateSession(token?: string) {
    const cleanToken = token?.trim();
    if (cleanToken && cleanToken.length >= 10 && cleanToken.length <= 64) {
      const existing = await prisma.userSession.findUnique({
        where: { id: cleanToken },
      });
      if (existing) return existing;

      // Create with provided stable client token
      return await prisma.userSession.create({
        data: { id: cleanToken },
      });
    }

    // Generate fresh session
    return await prisma.userSession.create({
      data: {},
    });
  },

  // 2. Favorites Management (User-Scoped & Unique)
  async getFavorites(userId: string): Promise<TrackData[]> {
    const rows = await prisma.favoriteTrack.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      take: 200,
    });

    return rows.map((r) => {
      let artists = [{ id: "", name: "Musify Artist" }];
      try {
        artists = JSON.parse(r.artistsJson);
      } catch {}

      return {
        id: r.trackId,
        title: r.title,
        artists,
        album: r.albumTitle ? { id: "", title: r.albumTitle } : undefined,
        durationMs: r.durationMs ?? undefined,
        artworkUrl: r.artworkUrl ?? undefined,
        sourceTrackId: r.sourceTrackId,
      };
    });
  },

  async toggleFavorite(
    userId: string,
    track: TrackData,
  ): Promise<{ isLiked: boolean; favorites: TrackData[] }> {
    const existing = await prisma.favoriteTrack.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId: track.id,
        },
      },
    });

    if (existing) {
      await prisma.favoriteTrack.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.favoriteTrack.create({
        data: {
          userId,
          trackId: track.id,
          title: sanitizeText(track.title, 200),
          artistsJson: JSON.stringify(track.artists || []),
          albumTitle: track.album?.title ? sanitizeText(track.album.title, 200) : null,
          artworkUrl: track.artworkUrl,
          durationMs: track.durationMs,
          sourceTrackId: track.sourceTrackId || track.id.replace(/^yt_/, ""),
        },
      });
    }

    const updated = await this.getFavorites(userId);
    return { isLiked: !existing, favorites: updated };
  },

  // 3. Playlists Management (Strict Ownership Verification)
  async getPlaylists(userId: string): Promise<CustomPlaylistData[]> {
    const rows = await prisma.playlist.findMany({
      where: { userId },
      include: {
        tracks: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map((pl) => ({
      id: pl.id,
      name: pl.name,
      description: pl.description ?? undefined,
      artwork: pl.artworkUrl ?? pl.tracks[0]?.artworkUrl ?? undefined,
      createdAt: pl.createdAt.toISOString(),
      updatedAt: pl.updatedAt.toISOString(),
      tracks: pl.tracks.map((t) => {
        let artists = [{ id: "", name: "Musify Artist" }];
        try {
          artists = JSON.parse(t.artistsJson);
        } catch {}

        return {
          id: t.trackId,
          title: t.title,
          artists,
          album: t.albumTitle ? { id: "", title: t.albumTitle } : undefined,
          durationMs: t.durationMs ?? undefined,
          artworkUrl: t.artworkUrl ?? undefined,
          sourceTrackId: t.sourceTrackId,
        };
      }),
    }));
  },

  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
  ): Promise<CustomPlaylistData> {
    const sanitizedName = sanitizeText(name, 100) || "My Playlist";
    const sanitizedDesc = description ? sanitizeText(description, 300) : undefined;

    const pl = await prisma.playlist.create({
      data: {
        userId,
        name: sanitizedName,
        description: sanitizedDesc,
      },
      include: {
        tracks: true,
      },
    });

    return {
      id: pl.id,
      name: pl.name,
      description: pl.description ?? undefined,
      artwork: undefined,
      createdAt: pl.createdAt.toISOString(),
      updatedAt: pl.updatedAt.toISOString(),
      tracks: [],
    };
  },

  async addTrackToPlaylist(
    userId: string,
    playlistId: string,
    track: TrackData,
  ): Promise<CustomPlaylistData | null> {
    // Ownership check: ensure user owns the playlist
    const pl = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
      include: { tracks: true },
    });
    if (!pl) return null;

    // Check if track already exists in playlist
    const exists = pl.tracks.some((t) => t.trackId === track.id);
    if (!exists) {
      await prisma.playlistTrack.create({
        data: {
          playlistId,
          trackId: track.id,
          title: sanitizeText(track.title, 200),
          artistsJson: JSON.stringify(track.artists || []),
          albumTitle: track.album?.title ? sanitizeText(track.album.title, 200) : null,
          artworkUrl: track.artworkUrl,
          durationMs: track.durationMs,
          sourceTrackId: track.sourceTrackId || track.id.replace(/^yt_/, ""),
          position: pl.tracks.length,
        },
      });

      // Update playlist timestamp and artwork
      await prisma.playlist.update({
        where: { id: playlistId },
        data: {
          updatedAt: new Date(),
          artworkUrl: pl.artworkUrl || track.artworkUrl,
        },
      });
    }

    const updated = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: { orderBy: { position: "asc" } },
      },
    });
    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      artwork: updated.artworkUrl ?? updated.tracks[0]?.artworkUrl ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      tracks: updated.tracks.map((t) => {
        let artists = [{ id: "", name: "Musify Artist" }];
        try {
          artists = JSON.parse(t.artistsJson);
        } catch {}
        return {
          id: t.trackId,
          title: t.title,
          artists,
          album: t.albumTitle ? { id: "", title: t.albumTitle } : undefined,
          durationMs: t.durationMs ?? undefined,
          artworkUrl: t.artworkUrl ?? undefined,
          sourceTrackId: t.sourceTrackId,
        };
      }),
    };
  },

  async removeTrackFromPlaylist(
    userId: string,
    playlistId: string,
    trackId: string,
  ): Promise<CustomPlaylistData | null> {
    // Ownership check
    const pl = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    if (!pl) return null;

    await prisma.playlistTrack.deleteMany({
      where: { playlistId, trackId },
    });

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    const updated = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: { orderBy: { position: "asc" } },
      },
    });
    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      artwork: updated.artworkUrl ?? updated.tracks[0]?.artworkUrl ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      tracks: updated.tracks.map((t) => {
        let artists = [{ id: "", name: "Musify Artist" }];
        try {
          artists = JSON.parse(t.artistsJson);
        } catch {}
        return {
          id: t.trackId,
          title: t.title,
          artists,
          album: t.albumTitle ? { id: "", title: t.albumTitle } : undefined,
          durationMs: t.durationMs ?? undefined,
          artworkUrl: t.artworkUrl ?? undefined,
          sourceTrackId: t.sourceTrackId,
        };
      }),
    };
  },

  async deletePlaylist(userId: string, playlistId: string): Promise<boolean> {
    // Ownership check
    const pl = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });
    if (!pl) return false;

    await prisma.playlist.delete({
      where: { id: playlistId },
    });
    return true;
  },

  // 4. Listening History (Lifting to Top, Deduplicated & Bounded)
  async getHistory(userId: string, limit = 50): Promise<TrackData[]> {
    const rows = await prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: Math.min(100, Math.max(1, limit * 2)),
    });

    const seen = new Set<string>();
    const unique: TrackData[] = [];

    for (const r of rows) {
      const key = (r.sourceTrackId || r.trackId.replace(/^yt_/, "")).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);

        let artists = [{ id: "", name: "Musify Artist" }];
        try {
          artists = JSON.parse(r.artistsJson);
        } catch {}

        unique.push({
          id: r.trackId,
          title: r.title,
          artists,
          album: r.albumTitle ? { id: "", title: r.albumTitle } : undefined,
          durationMs: r.durationMs ?? undefined,
          artworkUrl: r.artworkUrl ?? undefined,
          sourceTrackId: r.sourceTrackId,
        });

        if (unique.length >= limit) break;
      }
    }

    return unique;
  },

  async addHistory(userId: string, track: TrackData): Promise<TrackData[]> {
    const cleanSourceId = track.sourceTrackId || track.id.replace(/^yt_/, "");

    // Delete any older occurrence of this track so it lifts to the very top without duplicate rows
    await prisma.listeningHistory.deleteMany({
      where: {
        userId,
        OR: [
          { trackId: track.id },
          { trackId: `yt_${cleanSourceId}` },
          { trackId: cleanSourceId },
          { sourceTrackId: cleanSourceId },
        ],
      },
    });

    // Insert as the newest top entry
    await prisma.listeningHistory.create({
      data: {
        userId,
        trackId: track.id,
        title: sanitizeText(track.title, 200),
        artistsJson: JSON.stringify(track.artists || []),
        albumTitle: track.album?.title ? sanitizeText(track.album.title, 200) : null,
        artworkUrl: track.artworkUrl,
        durationMs: track.durationMs,
        sourceTrackId: cleanSourceId,
        playedAt: new Date(),
      },
    });

    return await this.getHistory(userId, 30);
  },

  // 6. Cross-Platform User Settings Synchronization
  async getSettings(userId: string): Promise<Record<string, any>> {
    const session = await prisma.userSession.findUnique({
      where: { id: userId },
      select: { settingsJson: true },
    });
    if (!session || !session.settingsJson) return {};
    try {
      return JSON.parse(session.settingsJson);
    } catch {
      return {};
    }
  },

  async updateSettings(userId: string, settings: Record<string, any>): Promise<Record<string, any>> {
    const current = await this.getSettings(userId);
    const merged = { ...current, ...settings };
    await prisma.userSession.update({
      where: { id: userId },
      data: {
        settingsJson: JSON.stringify(merged),
      },
    });
    return merged;
  },
};


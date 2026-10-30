import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import path from "path";
import { YouTubeMusicProvider } from "./modules/youtube.provider";
import { dbService, type TrackData } from "./modules/db.service";
import { AIService } from "./modules/ai.service";
import { authService } from "./modules/auth.service";
import { notificationService } from "./modules/notification.service";
import { memoryCache } from "./modules/cache.service";
import { roomService } from "./modules/room.service";

const provider = new YouTubeMusicProvider();
const aiService = new AIService(provider);

async function resolveAuthUser(headers: Record<string, string | undefined>) {
  return await authService.resolveUser(
    headers["authorization"],
    headers["x-user-session-id"],
  );
}

const app = new Elysia()
  .use(
    cors({
      origin: true, // reflects the request origin (allows all origins including Vercel)
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-user-session-id"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      preflight: true,
    }),
  )
  .get("/api/health", () => ({
    status: "ok",
    service: "musify-api",
    timestamp: new Date().toISOString(),
  }))
  .get("/api/v1", () => ({
    name: "MUSIFY API",
    version: "1.0.0",
    endpoints: [
      "GET /api/v1/search?q=:query&type=all|song|artist|album|playlist",
      "GET /api/v1/search/recommendations",
      "GET /api/v1/search/suggestions?q=:query",
      "GET /api/v1/explore",
      "GET /api/v1/tracks/:id",
      "GET /api/v1/tracks/:id/playback",
      "GET /api/v1/tracks/:id/queue",
      "GET /api/v1/tracks/:id/lyrics",
      "GET /api/v1/artists/:id",
      "GET /api/v1/albums/:id",
      "GET /api/v1/playlists/:id",
    ],
  }))

  // Multi-type Search with Ultra-Fast Concurrency Cache
  .get(
    "/api/v1/search",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) {
        return { tracks: [], artists: [], albums: [], playlists: [] };
      }

      const type = query.type ?? "song";
      const cacheKey = `search:${type}:${q}:${query.pageToken ?? ""}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return cached;

      let result: any;
      switch (type) {
        case "artist":
          result = { artists: await provider.searchArtists(q) };
          break;
        case "album":
          result = { albums: await provider.searchAlbums(q) };
          break;
        case "playlist":
          result = { playlists: await provider.searchPlaylists(q) };
          break;
        case "all":
          result = await provider.searchAll(q);
          break;
        case "song":
        default:
          result = await provider.searchTracks(q, query.pageToken);
          break;
      }

      memoryCache.set(cacheKey, result, 900); // 15 min TTL
      return result;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        type: t.Optional(
          t.Union([
            t.Literal("song"),
            t.Literal("artist"),
            t.Literal("album"),
            t.Literal("playlist"),
            t.Literal("all"),
          ]),
        ),
        pageToken: t.Optional(t.String()),
      }),
    },
  )

  // Search Recommendations (Trending, Categories, Top Picks) with Cache
  .get("/api/v1/search/recommendations", async () => {
    const cached = memoryCache.get("search_recommendations");
    if (cached) return cached;
    const recs = await provider.getSearchRecommendations();
    memoryCache.set("search_recommendations", recs, 600); // 10 min TTL
    return recs;
  })

  // Search Suggestions (Autocomplete) with Micro-Cache
  .get(
    "/api/v1/search/suggestions",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) return [];
      const cacheKey = `sugg:${q.toLowerCase()}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return cached;
      const suggs = await provider.getSearchSuggestions(q);
      memoryCache.set(cacheKey, suggs, 1800); // 30 min TTL
      return suggs;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    },
  )

  // Explore & Home Feed with High-Traffic Cache
  .get("/api/v1/explore", async () => {
    const cached = memoryCache.get("explore_feed");
    if (cached) return cached;
    const feed = await provider.getExploreFeed();
    memoryCache.set("explore_feed", feed, 600); // 10 min TTL
    return feed;
  })

  // Server Cache & Concurrency Stats
  .get("/api/v1/server/stats", () => ({
    cache: memoryCache.getStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }))

  // Listen Together & Remote Sync Rooms API
  .post(
    "/api/v1/rooms/create",
    async ({ body }) => {
      const code = `MUS-${Math.floor(100 + Math.random() * 900)}`;
      const state = roomService.createRoom(code, body.hostId, body.hostName);
      return { room: state, code };
    },
    {
      body: t.Object({
        hostId: t.String(),
        hostName: t.String(),
      }),
    },
  )
  .get("/api/v1/rooms/:code", async ({ params, set }) => {
    const room = roomService.getRoom(params.code);
    if (!room) {
      set.status = 404;
      return { error: "Room not found or expired" };
    }
    return { room: room.state };
  })

  // Real-time WebSocket Listen Together & MUSIFY Connect
  .ws("/ws/rooms/:roomId", {
    open(ws) {
      const roomId = (ws.data.params as any).roomId;
      const query = (ws.data as any).query || {};
      const memberId = query.memberId || `u_${Date.now()}`;
      const name = query.name || "Listener";
      const avatarUrl = query.avatarUrl;

      const state = roomService.joinRoom(roomId, { id: memberId, name, avatarUrl }, ws);
      ws.send(JSON.stringify({ type: "ROOM_CONNECTED", state, memberId }));
    },
    message(ws, message: any) {
      try {
        const payload = typeof message === "string" ? JSON.parse(message) : message;
        const roomId = (ws.data.params as any).roomId;
        const query = (ws.data as any).query || {};
        const memberId = query.memberId || "anon";

        if (payload.type === "ACTION") {
          roomService.syncPlayback(roomId, payload.action, memberId);
        } else if (payload.type === "CHAT") {
          roomService.broadcast(roomId, {
            type: "CHAT_MESSAGE",
            senderId: memberId,
            senderName: payload.name || "Listener",
            text: payload.text,
            timestamp: Date.now(),
          });
        }
      } catch {}
    },
    close(ws) {
      const roomId = (ws.data.params as any).roomId;
      const query = (ws.data as any).query || {};
      const memberId = query.memberId || "anon";
      roomService.leaveRoom(roomId, memberId);
    },
  })

  // Track Metadata
  .get(
    "/api/v1/tracks/:id",
    async ({ params, set }) => {
      const track = await provider.getTrack(params.id);
      if (!track) {
        set.status = 404;
        return { error: "Track not found" };
      }
      return track;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Track Audio Playback Stream
  .get(
    "/api/v1/tracks/:id/playback",
    async ({ params }) => {
      return await provider.getPlaybackBySourceId(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Alias for backward compatibility
  .get(
    "/api/v1/playback/:id",
    async ({ params }) => {
      return await provider.getPlaybackBySourceId(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Up Next / Autoplay Radio Queue
  .get(
    "/api/v1/tracks/:id/queue",
    async ({ params }) => {
      return await provider.getQueue(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Track Lyrics (Time-synced LRC via LRCLIB + YouTube fallback)
  .get(
    "/api/v1/tracks/:id/lyrics",
    async ({ params, query, set }) => {
      const lyrics = await provider.getLyrics(
        params.id,
        query.title,
        query.artist,
      );
      if (!lyrics) {
        set.status = 404;
        return { error: "Lyrics not available for this track" };
      }
      return lyrics;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        title: t.Optional(t.String()),
        artist: t.Optional(t.String()),
      }),
    },
  )

  // Artist Profile (Top songs, albums, singles)
  .get(
    "/api/v1/artists/:id",
    async ({ params, set }) => {
      const artist = await provider.getArtist(params.id);
      if (!artist) {
        set.status = 404;
        return { error: "Artist not found" };
      }
      return artist;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Album Details (Metadata + Tracklist)
  .get(
    "/api/v1/albums/:id",
    async ({ params, set }) => {
      const album = await provider.getAlbum(params.id);
      if (!album) {
        set.status = 404;
        return { error: "Album not found" };
      }
      return album;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Playlist Details (Metadata + Tracklist)
  .get(
    "/api/v1/playlists/:id",
    async ({ params, set }) => {
      const playlist = await provider.getPlaylist(params.id);
      if (!playlist) {
        set.status = 404;
        return { error: "Playlist not found" };
      }
      return playlist;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // -------------------------------------------------------------
  // SECURE AUTH & ACCOUNT SYSTEM (Argon2id + JWT + Guest Migration)
  // -------------------------------------------------------------

  // Register new account (or upgrade anonymous session)
  .post(
    "/api/v1/auth/register",
    async ({ headers, body, set }) => {
      try {
        const result = await authService.register(
          body.email,
          body.password,
          body.displayName,
          headers["x-user-session-id"],
        );
        // Welcome notification (non-blocking)
        notificationService.createSystemNotification(
          result.user.id,
          "system",
          "🎵 Welcome to Musify!",
          "Your account is ready. Explore curated mixes, lossless audio, and personalized radios.",
          { icon: "🎵" }
        ).catch(() => {});
        return { ...result, sessionId: result.user.id };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Registration failed" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        displayName: t.Optional(t.String()),
      }),
    },
  )

  // Log in to existing account with guest data migration
  .post(
    "/api/v1/auth/login",
    async ({ headers, body, set, request }) => {
      try {
        const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
        const result = await authService.login(
          body.email,
          body.password,
          headers["x-user-session-id"],
          clientIp,
        );
        // Welcome back notification
        notificationService.createSystemNotification(
          result.user.id,
          "system",
          "👋 Welcome back!",
          "Good to see you again. Your library and custom playlists are synced.",
          { icon: "👋" }
        ).catch(() => {});
        return { ...result, sessionId: result.user.id };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Login failed" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  )

  // Verify 6-digit email OTP
  .post(
    "/api/v1/auth/verify-email",
    async ({ body, set }) => {
      try {
        const result = await authService.verifyEmail(body.email, body.code);
        return { ...result, sessionId: result.user.id };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Email verification failed" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
      }),
    },
  )

  // Resend 6-digit email OTP
  .post(
    "/api/v1/auth/resend-code",
    async ({ body, set }) => {
      try {
        const result = await authService.resendVerificationCode(body.email);
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to resend code" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    },
  )

  // Current user profile
  .get("/api/v1/auth/me", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    return { user, sessionId: user.id };
  })

  // Update profile
  .patch(
    "/api/v1/auth/profile",
    async ({ headers, body, set }) => {
      const user = await resolveAuthUser(headers);
      if (user.isAnonymous) {
        set.status = 401;
        return { error: "Please log in or register to update your profile." };
      }
      try {
        const updated = await authService.updateProfile(
          user.id,
          body.displayName,
          body.avatarUrl,
        );
        return { user: updated };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to update profile" };
      }
    },
    {
      body: t.Object({
        displayName: t.Optional(t.String()),
        avatarUrl: t.Optional(t.String()),
      }),
    },
  )

  // Change password
  .post(
    "/api/v1/auth/change-password",
    async ({ headers, body, set }) => {
      const user = await resolveAuthUser(headers);
      if (user.isAnonymous) {
        set.status = 401;
        return { error: "Please log in to change your password." };
      }
      try {
        await authService.changePassword(
          user.id,
          body.oldPassword,
          body.newPassword,
        );
        return { success: true };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to change password" };
      }
    },
    {
      body: t.Object({
        oldPassword: t.String(),
        newPassword: t.String(),
      }),
    },
  )

  // -------------------------------------------------------------
  // SECURE USER DATA ENDPOINTS (Isolated by UserSession)
  // -------------------------------------------------------------

  // Session handshake & verification
  .get("/api/v1/user/session", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    return { sessionId: user.id, user };
  })

  // Get user favorites
  .get("/api/v1/user/favorites", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    const favorites = await dbService.getFavorites(user.id);
    return { favorites };
  })

  // Toggle user favorite
  .post(
    "/api/v1/user/favorites/toggle",
    async ({ headers, body }) => {
      const user = await resolveAuthUser(headers);
      const result = await dbService.toggleFavorite(
        user.id,
        body.track as TrackData,
      );
      if (result.isLiked) {
        notificationService.createSystemNotification(
          user.id,
          "track",
          "❤️ Added to Liked Songs",
          `"${body.track.title}" was saved to your library.`,
          {
            icon: "❤️",
            artworkUrl: body.track.artworkUrl,
          }
        ).catch(() => {});
      }
      return { ...result, sessionId: user.id };
    },
    {
      body: t.Object({
        track: t.Object({
          id: t.String(),
          title: t.String(),
          artists: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            }),
          ),
          album: t.Optional(
            t.Object({
              id: t.String(),
              title: t.String(),
            }),
          ),
          durationMs: t.Optional(t.Number()),
          artworkUrl: t.Optional(t.String()),
          sourceTrackId: t.String(),
        }),
      }),
    },
  )

  // Get user custom playlists
  .get("/api/v1/user/playlists", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    const playlists = await dbService.getPlaylists(user.id);
    return { playlists };
  })

  // Create new user playlist
  .post(
    "/api/v1/user/playlists",
    async ({ headers, body, set }) => {
      const user = await resolveAuthUser(headers);
      try {
        const playlist = await dbService.createPlaylist(
          user.id,
          body.name,
          body.description,
        );
        notificationService.createSystemNotification(
          user.id,
          "playlist",
          "🎶 Playlist Created",
          `"${playlist.name}" is ready. Start adding your favorite tracks!`,
          { icon: "🎶" }
        ).catch(() => {});
        return { playlist, sessionId: user.id };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to create playlist" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
    },
  )

  // Add track to custom playlist (with strict ownership check)
  .post(
    "/api/v1/user/playlists/:id/tracks",
    async ({ headers, params, body, set }) => {
      const user = await resolveAuthUser(headers);
      try {
        const updated = await dbService.addTrackToPlaylist(
          user.id,
          params.id,
          body.track as TrackData,
        );
        if (!updated) {
          set.status = 404;
          return { error: "Playlist not found or access denied" };
        }
        return { playlist: updated };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to add track" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        track: t.Object({
          id: t.String(),
          title: t.String(),
          artists: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            }),
          ),
          album: t.Optional(
            t.Object({
              id: t.String(),
              title: t.String(),
            }),
          ),
          durationMs: t.Optional(t.Number()),
          artworkUrl: t.Optional(t.String()),
          sourceTrackId: t.String(),
        }),
      }),
    },
  )

  // Remove track from custom playlist (strict ownership check)
  .delete(
    "/api/v1/user/playlists/:id/tracks/:trackId",
    async ({ headers, params, set }) => {
      const user = await resolveAuthUser(headers);
      const updated = await dbService.removeTrackFromPlaylist(
        user.id,
        params.id,
        params.trackId,
      );
      if (!updated) {
        set.status = 404;
        return { error: "Playlist not found or access denied" };
      }
      return { playlist: updated };
    },
    {
      params: t.Object({
        id: t.String(),
        trackId: t.String(),
      }),
    },
  )

  // Delete user playlist (strict ownership check)
  .delete(
    "/api/v1/user/playlists/:id",
    async ({ headers, params, set }) => {
      const user = await resolveAuthUser(headers);
      const success = await dbService.deletePlaylist(user.id, params.id);
      if (!success) {
        set.status = 404;
        return { error: "Playlist not found or access denied" };
      }
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Get listening history
  .get("/api/v1/user/history", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    const history = await dbService.getHistory(user.id);
    return { history };
  })

  // Log track to listening history
  .post(
    "/api/v1/user/history",
    async ({ headers, body }) => {
      const user = await resolveAuthUser(headers);
      const history = await dbService.addHistory(
        user.id,
        body.track as TrackData,
      );
      return { history, sessionId: user.id };
    },
    {
      body: t.Object({
        track: t.Object({
          id: t.String(),
          title: t.String(),
          artists: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            }),
          ),
          album: t.Optional(
            t.Object({
              id: t.String(),
              title: t.String(),
            }),
          ),
          durationMs: t.Optional(t.Number()),
          artworkUrl: t.Optional(t.String()),
          sourceTrackId: t.String(),
        }),
      }),
    },
  )

  // -------------------------------------------------------------
  // AI SMART PLAYLIST & QUEUE SUGGESTIONS (Gemini 3.6 Flash)
  // -------------------------------------------------------------
  .post(
    "/api/v1/ai/generate-playlist",
    async ({ headers, body, set }) => {
      const user = await resolveAuthUser(headers);
      try {
        const result = await aiService.generatePlaylist(
          user.id,
          body.prompt,
          body.count ?? 8,
        );
        return { ...result, sessionId: user.id };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to generate AI playlist" };
      }
    },
    {
      body: t.Object({
        prompt: t.String(),
        count: t.Optional(t.Number()),
      }),
    },
  )

  // AI Next Song & Smart Queue Suggestions
  .post(
    "/api/v1/ai/queue-suggestions",
    async ({ body, set }) => {
      try {
        const suggestions = await aiService.getAISmartQueueSuggestions(
          body.currentTrack as TrackData,
          (body.queue || []) as TrackData[],
          body.mood || "smart",
          body.count ?? 6,
        );
        return { suggestions };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to generate AI queue suggestions" };
      }
    },
    {
      body: t.Object({
        currentTrack: t.Object({
          id: t.String(),
          title: t.String(),
          artists: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            }),
          ),
          album: t.Optional(
            t.Object({
              id: t.String(),
              title: t.String(),
            }),
          ),
          durationMs: t.Optional(t.Number()),
          artworkUrl: t.Optional(t.String()),
          sourceTrackId: t.String(),
        }),
        queue: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              title: t.String(),
              artists: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                }),
              ),
              album: t.Optional(
                t.Object({
                  id: t.String(),
                  title: t.String(),
                }),
              ),
              durationMs: t.Optional(t.Number()),
              artworkUrl: t.Optional(t.String()),
              sourceTrackId: t.String(),
            }),
          ),
        ),
        mood: t.Optional(t.String()),
        count: t.Optional(t.Number()),
      }),
    },
  )

  // Fast track-based next AI recommendation
  .get(
    "/api/v1/tracks/:id/ai-suggestions",
    async ({ params, query }) => {
      const track = await provider.getTrack(params.id);
      if (!track) {
        return { suggestions: [] };
      }
      const count = query.count ? parseInt(query.count, 10) : 6;
      const suggestions = await aiService.getAISmartQueueSuggestions(
        track as TrackData,
        [],
        query.mood || "smart",
        count,
      );
      return { suggestions };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        count: t.Optional(t.String()),
        mood: t.Optional(t.String()),
      }),
    },
  )

  // -------------------------------------------------------------
  // IN-APP NOTIFICATIONS SYSTEM
  // -------------------------------------------------------------

  // Get user notifications (paginated / bounded)
  .get(
    "/api/v1/notifications",
    async ({ headers, query }) => {
      const user = await resolveAuthUser(headers);
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const notifications = await notificationService.getNotifications(user.id, limit);
      return { notifications };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    },
  )

  // Get unread notification count
  .get("/api/v1/notifications/unread-count", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    return await notificationService.getUnreadCount(user.id);
  })

  // Create a new notification (user-triggered or admin)
  .post(
    "/api/v1/notifications",
    async ({ headers, body, set }) => {
      const user = await resolveAuthUser(headers);
      const notif = await notificationService.createNotification(user.id, {
        type: body.type as any,
        title: body.title,
        message: body.message,
        icon: body.icon,
        artworkUrl: body.artworkUrl,
        actionUrl: body.actionUrl,
      });
      if (!notif) {
        set.status = 400;
        return { error: "Failed to create notification" };
      }
      return { notification: notif };
    },
    {
      body: t.Object({
        type: t.Optional(t.String()),
        title: t.String(),
        message: t.String(),
        icon: t.Optional(t.String()),
        artworkUrl: t.Optional(t.String()),
        actionUrl: t.Optional(t.String()),
      }),
    },
  )

  // Mark single notification as read
  .patch(
    "/api/v1/notifications/:id/read",
    async ({ headers, params, set }) => {
      const user = await resolveAuthUser(headers);
      const notif = await notificationService.markAsRead(user.id, params.id);
      if (!notif) {
        set.status = 404;
        return { error: "Notification not found" };
      }
      return { notification: notif };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Mark all notifications as read
  .patch("/api/v1/notifications/read-all", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    return await notificationService.markAllRead(user.id);
  })

  // Delete a single notification
  .delete(
    "/api/v1/notifications/:id",
    async ({ headers, params, set }) => {
      const user = await resolveAuthUser(headers);
      const success = await notificationService.deleteNotification(user.id, params.id);
      if (!success) {
        set.status = 404;
        return { error: "Notification not found" };
      }
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Clear all notifications for user
  .delete("/api/v1/notifications", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    return await notificationService.clearAll(user.id);
  })

  // -------------------------------------------------------------
  // CROSS-PLATFORM SETTINGS SYNCHRONIZATION
  // -------------------------------------------------------------

  // Get synchronized user settings
  .get("/api/v1/settings", async ({ headers }) => {
    const user = await resolveAuthUser(headers);
    const settings = await dbService.getSettings(user.id);
    return { settings };
  })

  // Update synchronized user settings across all devices
  .put(
    "/api/v1/settings",
    async ({ headers, body }) => {
      const user = await resolveAuthUser(headers);
      const updated = await dbService.updateSettings(user.id, body.settings);
      return { settings: updated };
    },
    {
      body: t.Object({
        settings: t.Record(t.String(), t.Any()),
      }),
    },
  )

  // Test endpoint
  .get("/api/test-video", async () => {
    return await provider.getPlaybackBySourceId("dQw4w9WgXcQ");
  })

  // Direct APK download endpoint for phone testing
  .get("/download/apk", ({ set }) => {
    try {
      const apkPath = path.resolve(process.cwd(), "releases", "Musify.apk");
      if (typeof Bun !== "undefined" && Bun.file) {
        const file = Bun.file(apkPath);
        if (file.size > 0) {
          return new Response(file, {
            headers: {
              "Content-Type": "application/vnd.android.package-archive",
              "Content-Disposition": 'attachment; filename="Musify.apk"',
            },
          });
        }
      }
    } catch {}
    set.redirect = "/downloads/Musify.apk";
  });

// Run standalone server only in local development when not on Vercel
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port);
  console.log(`MUSIFY API is running on port ${port}`);
}

// Export a universal HTTP handler compatible with Vercel Node.js Serverless Functions, Bun & Edge
export default async function handler(req: any, res?: any) {
  // If invoked as standard Node.js (req: IncomingMessage, res: ServerResponse):
  if (req && res && typeof res.setHeader === "function") {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
      const url = `${protocol}://${host}${req.url}`;

      let body: any = undefined;
      if (!["GET", "HEAD"].includes(req.method || "")) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        if (chunks.length > 0) {
          body = Buffer.concat(chunks);
        }
      }

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val !== undefined) {
          if (Array.isArray(val)) {
            val.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, val as string);
          }
        }
      }

      const webReq = new Request(url, {
        method: req.method,
        headers,
        body,
      });

      const webRes = await app.handle(webReq);

      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const resBuffer = await webRes.arrayBuffer();
      res.end(Buffer.from(resBuffer));
    } catch (err: any) {
      console.error("[Vercel Handler Error]:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || "Internal Server Error" }));
    }
    return;
  }

  // Web Request fallback (Bun, Cloudflare, or Vercel Edge)
  return app.handle(req);
}

export { app };
export type App = typeof app;

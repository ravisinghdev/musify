import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { YouTubeMusicProvider } from "./modules/youtube.provider";
import { dbService, type TrackData } from "./modules/db.service";
import { AIService } from "./modules/ai.service";
import { authService } from "./modules/auth.service";

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

  // Multi-type Search
  .get(
    "/api/v1/search",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) {
        return { tracks: [], artists: [], albums: [], playlists: [] };
      }

      const type = query.type ?? "song";

      switch (type) {
        case "artist":
          return { artists: await provider.searchArtists(q) };
        case "album":
          return { albums: await provider.searchAlbums(q) };
        case "playlist":
          return { playlists: await provider.searchPlaylists(q) };
        case "all":
          return await provider.searchAll(q);
        case "song":
        default:
          return await provider.searchTracks(q, query.pageToken);
      }
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

  // Search Recommendations (Trending, Categories, Top Picks)
  .get("/api/v1/search/recommendations", async () => {
    return await provider.getSearchRecommendations();
  })

  // Search Suggestions (Autocomplete)
  .get(
    "/api/v1/search/suggestions",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) return [];
      return await provider.getSearchSuggestions(q);
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    },
  )

  // Explore & Home Feed
  .get("/api/v1/explore", async () => {
    return await provider.getExploreFeed();
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
  // AI SMART PLAYLIST GENERATION (Gemini 3.6 Flash + Supabase DB)
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

  // Test endpoint
  .get("/api/test-video", async () => {
    return await provider.getPlaybackBySourceId("dQw4w9WgXcQ");
  });

// Run standalone server only in local development when not on Vercel
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port);
  console.log(`MUSIFY API is running on port ${port}`);
}

export default app;
export type App = typeof app;

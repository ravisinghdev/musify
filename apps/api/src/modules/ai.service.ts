import { YouTubeMusicProvider } from "./youtube.provider";
import { dbService, sanitizeText, type TrackData } from "./db.service";

interface AISuggestion {
  title: string;
  artist: string;
  reason?: string;
}

interface AIPlaylistResponse {
  playlistName: string;
  playlistDescription: string;
  tracks: AISuggestion[];
}

export class AIService {
  private apiKey: string;
  private provider: YouTubeMusicProvider;

  constructor(provider: YouTubeMusicProvider) {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.provider = provider;
  }

  /**
   * Generates a context-aware smart playlist using Gemini 3.6 Flash,
   * searches and validates playable YouTube tracks for each recommendation,
   * and saves it directly to the user's database.
   */
  async generatePlaylist(
    userId: string,
    rawPrompt: string,
    limit: number = 8,
  ): Promise<{
    playlistId: string;
    playlistName: string;
    description: string;
    tracks: TrackData[];
  }> {
    const cleanPrompt = sanitizeText(rawPrompt, 250);
    if (!cleanPrompt) {
      throw new Error("A valid prompt description is required.");
    }

    const maxCount = Math.min(15, Math.max(3, limit));

    let aiResult: AIPlaylistResponse | null = null;

    if (this.apiKey) {
      try {
        const systemInstruction = `You are Musify AI, an expert music curator and DJ.
Given a user prompt describing a mood, theme, language, genre, activity, or artist vibe, generate a cohesive playlist of ${maxCount} real, well-known songs.
Always return pure JSON matching this exact structure:
{
  "playlistName": "Short creative title (max 50 chars)",
  "playlistDescription": "Engaging 1-2 sentence description",
  "tracks": [
    { "title": "Song Title", "artist": "Artist Name", "reason": "Why this song fits" }
  ]
}`;

        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [{ text: `Create a playlist for: "${cleanPrompt}"` }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        };

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          },
        );

        if (res.ok) {
          const json = await res.json();
          const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            aiResult = JSON.parse(textResponse) as AIPlaylistResponse;
          }
        } else {
          console.error("Gemini API returned error status:", res.status);
        }
      } catch (err) {
        console.error("Gemini generation failed, falling back:", err);
      }
    }

    // Fallback if AI call failed or returned empty
    if (
      !aiResult ||
      !Array.isArray(aiResult.tracks) ||
      aiResult.tracks.length === 0
    ) {
      const fallbackTracks = await this.provider.searchTracks(cleanPrompt);
      const playlistName = `Mix: ${cleanPrompt.slice(0, 30)}`;
      const playlistDesc = `A curated vibe tailored for "${cleanPrompt}".`;

      const tracksToUse = (fallbackTracks.tracks || []).slice(0, maxCount);
      const created = await dbService.createPlaylist(
        userId,
        playlistName,
        playlistDesc,
      );

      for (const track of tracksToUse) {
        await dbService.addTrackToPlaylist(userId, created.id, track);
      }

      return {
        playlistId: created.id,
        playlistName,
        description: playlistDesc,
        tracks: tracksToUse,
      };
    }

    // Resolve AI recommended songs into actual verified, playable YouTube music tracks in parallel
    const playlistName = sanitizeText(
      aiResult.playlistName || `AI Mix: ${cleanPrompt}`,
      80,
    );
    const playlistDesc = sanitizeText(
      aiResult.playlistDescription ||
        `Curated by Musify AI for "${cleanPrompt}"`,
      300,
    );

    const targetSuggestions = aiResult.tracks
      .slice(0, maxCount)
      .filter((t) => !!t.title);

    // Parallel search queries for high responsiveness
    const searchPromises = targetSuggestions.map(async (item) => {
      const query = `${item.title} ${item.artist || ""}`.trim();
      try {
        const searchRes = await this.provider.searchTracks(query);
        return searchRes.tracks?.[0] || null;
      } catch {
        return null;
      }
    });

    const settled = await Promise.allSettled(searchPromises);
    const verifiedTracks: TrackData[] = [];
    const seenIds = new Set<string>();

    for (const res of settled) {
      if (
        res.status === "fulfilled" &&
        res.value &&
        !seenIds.has(res.value.id)
      ) {
        seenIds.add(res.value.id);
        verifiedTracks.push(res.value);
      }
    }

    // If verified tracks is empty, fallback to searching the main prompt
    if (verifiedTracks.length === 0) {
      const searchRes = await this.provider.searchTracks(cleanPrompt);
      for (const t of (searchRes.tracks || []).slice(0, maxCount)) {
        verifiedTracks.push(t);
      }
    }

    // Save newly generated AI playlist to Supabase DB for this user
    const created = await dbService.createPlaylist(
      userId,
      playlistName,
      playlistDesc,
    );
    for (const track of verifiedTracks) {
      await dbService.addTrackToPlaylist(userId, created.id, track);
    }

    return {
      playlistId: created.id,
      playlistName,
      description: playlistDesc,
      tracks: verifiedTracks,
    };
  }

  /**
   * Generates intelligent next-song suggestions and seamless queue transitions using Gemini 3.6 Flash.
   */
  async getAISmartQueueSuggestions(
    currentTrack: TrackData,
    queue: TrackData[] = [],
    mood: string = "smart",
    limit: number = 6,
  ): Promise<
    Array<{
      track: TrackData;
      reason: string;
      badge: string;
    }>
  > {
    const maxCount = Math.min(10, Math.max(2, limit));
    const currentArtist = currentTrack.artists?.[0]?.name || "Unknown Artist";
    const currentTitle = currentTrack.title || "Unknown Song";

    const existingIds = new Set<string>([
      currentTrack.id,
      currentTrack.sourceTrackId,
      ...queue.map((t) => t.id),
      ...queue.map((t) => t.sourceTrackId),
    ]);

    let aiSuggestions: Array<{
      title: string;
      artist: string;
      reason?: string;
      badge?: string;
    }> = [];

    if (this.apiKey) {
      try {
        const queueContext = queue
          .slice(0, 4)
          .map((t) => `"${t.title}" by ${t.artists?.[0]?.name || "Artist"}`)
          .join(", ");

        const prompt = `Current playing song: "${currentTitle}" by ${currentArtist}.
Upcoming queue tracks: [${queueContext || "None yet"}].
Requested vibe style: "${mood}".

As a professional AI Music DJ, select ${maxCount} real, popular songs that would blend or transition smoothly after this song.
Return pure JSON with this exact schema:
{
  "suggestions": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "reason": "1 brief sentence explaining the acoustic / energy / genre transition",
      "badge": "Short 2-3 word tag like 'Vibe Match', 'Energy Lift', 'Deep Cut', 'Acoustic Blend'"
    }
  ]
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.65,
                maxOutputTokens: 1024,
              },
            }),
          },
        );

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed.suggestions)) {
              aiSuggestions = parsed.suggestions;
            }
          }
        }
      } catch (err) {
        console.warn(
          "[AIService.getAISmartQueueSuggestions] Gemini error:",
          err,
        );
      }
    }

    // Resolve AI suggestions to playable YouTube Music tracks
    const resolvedResults: Array<{
      track: TrackData;
      reason: string;
      badge: string;
    }> = [];

    if (aiSuggestions.length > 0) {
      const searchPromises = aiSuggestions.map(async (s) => {
        try {
          const query = `${s.title} ${s.artist}`.trim();
          const searchRes = await this.provider.searchTracks(query);
          const topTrack = searchRes.tracks?.[0];
          if (
            topTrack &&
            !existingIds.has(topTrack.id) &&
            !existingIds.has(topTrack.sourceTrackId)
          ) {
            existingIds.add(topTrack.id);
            existingIds.add(topTrack.sourceTrackId);
            return {
              track: topTrack,
              reason:
                s.reason || `Complements "${currentTitle}" by ${currentArtist}`,
              badge: s.badge || "✨ Vibe Match",
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const settled = await Promise.allSettled(searchPromises);
      for (const item of settled) {
        if (item.status === "fulfilled" && item.value) {
          resolvedResults.push(item.value);
        }
      }
    }

    // Fallback: If AI returned fewer results, populate with algorithmic YouTube upNext & artist radio
    if (resolvedResults.length < maxCount) {
      try {
        const cleanId = (currentTrack.sourceTrackId || currentTrack.id).replace(
          /^yt_/,
          "",
        );
        const fallbackQueue = await this.provider.getQueue(cleanId);
        const candidates = fallbackQueue.tracks || [];

        const defaultBadges = [
          "✨ Seamless Flow",
          "✨ Artist Radio",
          "✨ Vibe Harmony",
          "✨ Up Next",
          "✨ Curated Pick",
        ];

        for (
          let i = 0;
          i < candidates.length && resolvedResults.length < maxCount;
          i++
        ) {
          const t = candidates[i];
          if (!existingIds.has(t.id) && !existingIds.has(t.sourceTrackId)) {
            existingIds.add(t.id);
            existingIds.add(t.sourceTrackId);
            resolvedResults.push({
              track: t,
              reason: `Continuously recommended after "${currentTitle}"`,
              badge: defaultBadges[i % defaultBadges.length],
            });
          }
        }
      } catch (e) {
        console.warn("[AIService] Fallback queue error:", e);
      }
    }

    return resolvedResults.slice(0, maxCount);
  }
}

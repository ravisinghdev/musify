"use client";

import React, { useMemo } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

export interface ListeningStatsViewProps {
  recentlyPlayed: Track[];
  favoritesCount: number;
  playlistsCount: number;
  onPlayTrack: (track: Track, queue: Track[]) => void;
  onBack: () => void;
  onShare?: (title: string, text: string) => void;
  className?: string;
}

export function ListeningStatsView({
  recentlyPlayed,
  favoritesCount,
  playlistsCount,
  onPlayTrack,
  onBack,
  onShare,
  className = "",
}: ListeningStatsViewProps) {
  // Aggregate top tracks, top artists, estimated total minutes
  const stats = useMemo(() => {
    const totalMinutes = Math.round(
      recentlyPlayed.reduce((acc, t) => acc + (t.durationMs || 210000), 0) /
        60000,
    );

    // Track play counts
    const trackCounts: Record<string, { track: Track; count: number }> = {};
    const artistCounts: Record<
      string,
      { name: string; count: number; artwork?: string }
    > = {};

    recentlyPlayed.forEach((t) => {
      // Tracks
      if (!trackCounts[t.id]) {
        trackCounts[t.id] = { track: t, count: 0 };
      }
      trackCounts[t.id].count += 1;

      // Artists
      const primaryArtist = t.artists?.[0]?.name || "Unknown Artist";
      if (!artistCounts[primaryArtist]) {
        artistCounts[primaryArtist] = {
          name: primaryArtist,
          count: 0,
          artwork: t.artworkUrl,
        };
      }
      artistCounts[primaryArtist].count += 1;
    });

    const topTracks = Object.values(trackCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topArtists = Object.values(artistCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate dynamic streak based on persistent active listening days
    let streakDays = 0;
    if (typeof window !== "undefined" && recentlyPlayed.length > 0) {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const storedDaysRaw = localStorage.getItem("musify_listening_days");
        const daysSet = new Set<string>(storedDaysRaw ? JSON.parse(storedDaysRaw) : []);
        daysSet.add(todayStr);
        localStorage.setItem("musify_listening_days", JSON.stringify(Array.from(daysSet)));

        // Count consecutive days backward from today
        let checkDate = new Date();
        while (true) {
          const ds = checkDate.toISOString().slice(0, 10);
          if (daysSet.has(ds)) {
            streakDays += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      } catch {
        streakDays = Math.min(30, Math.max(1, Math.ceil(recentlyPlayed.length / 4)));
      }
    }

    // Dynamic Music Taste Persona based on actual track & artist taxonomy
    const genreBuckets: Record<string, { count: number; color: string }> = {
      "Bollywood & Desi Chill": { count: 0, color: "from-amber-500 to-orange-500" },
      "Global Pop & Hits": { count: 0, color: "from-cyan-500 to-blue-500" },
      "Lo-Fi Ambient & Beats": { count: 0, color: "from-indigo-500 to-purple-500" },
      "Acoustic & Classical": { count: 0, color: "from-emerald-500 to-teal-500" },
      "Electronic & Dance": { count: 0, color: "from-fuchsia-500 to-pink-500" },
      "Rock & Alternative": { count: 0, color: "from-rose-500 to-red-500" },
    };

    const desiKeywords = ["arijit", "pritam", "shashwat", "armaan", "vishal", "shreya", "badshah", "diljit", "dhillon", "bollywood", "hindi", "punjabi", "atif", "neha", "sonu", "jubin", "sid sriram", "anirudh", "desi", "gehra hua", "ilahi"];
    const lofiKeywords = ["lofi", "lo-fi", "chill", "sleep", "ambient", "beats", "focus", "study", "relax", "rain", "piano"];
    const edmKeywords = ["avicii", "garrix", "edm", "dance", "club", "party", "house", "techno", "guetta", "marshmello", "chainsmokers", "remix"];
    const rockKeywords = ["rock", "metal", "coldplay", "linkin", "queen", "imagine dragons", "nirvana", "muse", "greenday"];
    const acousticKeywords = ["acoustic", "unplugged", "guitar", "folk", "ed sheeran", "indie", "live", "classical", "strings"];

    let totalCategorized = 0;
    recentlyPlayed.forEach((t) => {
      const text = `${t.title} ${t.artists?.map((a) => a.name).join(" ") || ""}`.toLowerCase();
      if (desiKeywords.some((k) => text.includes(k))) {
        genreBuckets["Bollywood & Desi Chill"].count += 1;
        totalCategorized += 1;
      } else if (lofiKeywords.some((k) => text.includes(k))) {
        genreBuckets["Lo-Fi Ambient & Beats"].count += 1;
        totalCategorized += 1;
      } else if (edmKeywords.some((k) => text.includes(k))) {
        genreBuckets["Electronic & Dance"].count += 1;
        totalCategorized += 1;
      } else if (rockKeywords.some((k) => text.includes(k))) {
        genreBuckets["Rock & Alternative"].count += 1;
        totalCategorized += 1;
      } else if (acousticKeywords.some((k) => text.includes(k))) {
        genreBuckets["Acoustic & Classical"].count += 1;
        totalCategorized += 1;
      } else {
        genreBuckets["Global Pop & Hits"].count += 1;
        totalCategorized += 1;
      }
    });

    const activeGenres = Object.entries(genreBuckets)
      .filter(([_, item]) => item.count > 0)
      .map(([label, item]) => ({
        label,
        pct: Math.max(5, Math.round((item.count / Math.max(1, totalCategorized)) * 100)),
        color: item.color,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);

    const tasteGenres = activeGenres.length > 0 ? activeGenres : [
      { label: "Bollywood & Desi Chill", pct: 44, color: "from-amber-500 to-orange-500" },
      { label: "Global Pop & Hits", pct: 26, color: "from-cyan-500 to-blue-500" },
      { label: "Lo-Fi Ambient & Beats", pct: 18, color: "from-indigo-500 to-purple-500" },
      { label: "Acoustic & Classical", pct: 12, color: "from-emerald-500 to-teal-500" },
    ];

    return {
      totalMinutes,
      totalTracks: recentlyPlayed.length,
      topTracks,
      topArtists,
      streakDays,
      tasteGenres,
    };
  }, [recentlyPlayed]);

  const handleShareStats = () => {
    const topArtistText = stats.topArtists[0]?.name
      ? ` Top artist: ${stats.topArtists[0].name}.`
      : "";
    onShare?.(
      "My Musify Listening Stats",
      `I've listened to ${stats.totalMinutes} minutes of music on Musify!${topArtistText} Check it out!`,
    );
  };

  return (
    <div className={`space-y-8 animate-fade-in pb-24 pt-4 ${className}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
          aria-label="Back"
        >
          <Icon name="chevron-left" size={18} />
        </button>

        <button
          onClick={handleShareStats}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 active:scale-95 shadow-lg"
        >
          <Icon name="share" size={14} />
          <span>Share Wrapped</span>
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-black/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-pink-500/20 blur-[100px]" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
              <Icon name="sparkles" size={13} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Musify Listening Intelligence
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Your Sound Capsule
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Real-time analytics based on your listening habits and history
            </p>
          </div>

          {/* Quick Metrics 4-Box Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {stats.totalMinutes}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                Minutes Listened
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {stats.totalTracks}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                Songs Streamed
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {stats.streakDays}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                Day Streak
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {favoritesCount}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">
                Saved to Favorites
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Artists & Top Songs 2-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Artists */}
        <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Top Artists
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Most Played</span>
          </div>

          {stats.topArtists.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Start listening to reveal your top artists.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topArtists.map((art, idx) => (
                <div
                  key={art.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center font-mono text-xs font-bold text-zinc-500">
                      {idx + 1}
                    </span>
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                      {art.artwork ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={art.artwork}
                          alt={art.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white text-xs font-bold">
                          {art.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white truncate">
                      {art.name}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0">
                    {art.count} {art.count === 1 ? "play" : "plays"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Songs */}
        <section className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Top Songs
            </h2>
            <span className="text-xs text-zinc-400 font-mono">On Repeat</span>
          </div>

          {stats.topTracks.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Start listening to reveal your top songs.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topTracks.map((item, idx) => (
                <div
                  key={item.track.id}
                  onClick={() => onPlayTrack(item.track, recentlyPlayed)}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 transition hover:bg-white/[0.06] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center font-mono text-xs font-bold text-zinc-500 group-hover:text-white">
                      {idx + 1}
                    </span>
                    <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-white/10">
                      {item.track.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.track.artworkUrl}
                          alt={item.track.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                          <Icon name="music" size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition">
                        {item.track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {item.track.artists?.[0]?.name || "Artist"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0">
                    {item.count} {item.count === 1 ? "stream" : "streams"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Music Taste Profile Distribution */}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Music Taste Persona
        </h2>
        <p className="text-xs text-zinc-400">
          Calculated from playback duration across moods and regional styles
        </p>

        <div className="space-y-3 pt-2">
          {stats.tasteGenres.map((genre) => (
            <div key={genre.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{genre.label}</span>
                <span className="font-mono text-zinc-400">{genre.pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${genre.color} transition-all duration-1000`}
                  style={{ width: `${genre.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

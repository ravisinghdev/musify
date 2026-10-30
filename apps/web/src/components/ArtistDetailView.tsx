"use client";

import React, { useEffect, useState } from "react";
import type { Artist, ArtistDetails, Track, Album } from "../types/music";
import { Icon } from "./Icons";
import { TrackRow } from "./TrackRow";
import { api } from "../lib/api";

export interface ArtistDetailViewProps {
  artistId: string;
  artistName?: string;
  artistImage?: string;
  currentTrackId?: string;
  isPlaying?: boolean;
  favoritesIds: Set<string>;
  onPlayTrack: (track: Track, queue: Track[], targetIndex?: number) => void;
  onToggleLike: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
  onBack: () => void;
  onShare?: (title: string, text: string) => void;
  className?: string;
}

export function ArtistDetailView({
  artistId,
  artistName = "Artist",
  artistImage,
  currentTrackId,
  isPlaying,
  favoritesIds,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onSelectArtist,
  onSelectAlbum,
  onBack,
  onShare,
  className = "",
}: ArtistDetailViewProps) {
  const [details, setDetails] = useState<ArtistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    api
      .getArtist(artistId)
      .then((res) => {
        if (active) {
          setDetails(res);
        }
      })
      .catch((err) => {
        console.warn("Failed to load artist details:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistId]);

  const displayName = details?.artist?.name || artistName;
  const displayImage =
    details?.artist?.artworkUrl ||
    details?.topSongs?.[0]?.artworkUrl ||
    artistImage ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80";

  const topSongs = details?.topSongs || [];
  const albums = details?.albums || [];
  const singles = details?.singles || [];
  const related = details?.relatedArtists || [];

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      onPlayTrack(topSongs[0], topSongs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (topSongs.length > 0) {
      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className={`space-y-8 animate-fade-in pb-24 ${className}`}>
      {/* Top Navigation Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
          aria-label="Back"
        >
          <Icon name="chevron-left" size={18} />
        </button>

        <button
          onClick={() =>
            onShare?.(
              `${displayName} on Musify`,
              `Listen to ${displayName} and top hits on Musify!`,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
          aria-label="Share Artist"
        >
          <Icon name="share" size={16} />
        </button>
      </div>

      {/* Hero Banner with Ambient Glow */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
        {/* Blurred backdrop image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125"
          style={{ backgroundImage: `url(${displayImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Circular Artist Avatar */}
          <div className="relative h-36 w-36 sm:h-44 sm:w-44 shrink-0 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Artist Metadata */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                <Icon name="sparkles" size={12} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Verified Artist
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {displayName}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300">
              {topSongs.length > 0
                ? `${topSongs.length} Popular Tracks`
                : "Featured on Musify"}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                onClick={handlePlayAll}
                disabled={topSongs.length === 0}
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10 disabled:opacity-40"
              >
                <Icon name="play" size={16} />
                <span>Play</span>
              </button>

              <button
                onClick={handleShufflePlay}
                disabled={topSongs.length === 0}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-95 disabled:opacity-40"
              >
                <Icon name="shuffle" size={16} />
                <span>Shuffle</span>
              </button>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition active:scale-95 ${
                  isFollowing
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                    : "border-white/15 bg-white/[0.06] text-white hover:bg-white/15"
                }`}
              >
                <Icon name={isFollowing ? "heart-filled" : "heart"} size={16} />
                <span>{isFollowing ? "Following" : "Follow"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Songs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Popular Tracks
          </h2>
          {topSongs.length > 5 && (
            <span className="text-xs text-zinc-400 font-mono">
              Top {topSongs.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-white/[0.03] border border-white/5"
              />
            ))}
          </div>
        ) : topSongs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-400">
            No tracks found for this artist.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 backdrop-blur-xl">
            {topSongs.map((track, idx) => (
              <div key={`${track.id}-${idx}`} className="flex items-center">
                <span className="w-8 text-center text-xs font-mono font-semibold text-zinc-500 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={idx}
                    isCurrent={isPlaying && currentTrackId === track.id}
                    isLiked={favoritesIds.has(track.id)}
                    onPlay={() => onPlayTrack(track, topSongs, idx)}
                    onToggleLike={() => onToggleLike(track)}
                    onAddToPlaylist={() => onAddToPlaylist(track)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Albums Section (if any) */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight px-1">
            Albums
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {albums.map((alb) => (
              <div
                key={alb.id}
                onClick={() => onSelectAlbum(alb)}
                className="w-40 sm:w-48 shrink-0 cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl transition hover:border-white/20 hover:scale-[1.02] active:scale-95 group"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                  {alb.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={alb.artworkUrl}
                      alt={alb.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <Icon name="disc" size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-950 shadow-xl scale-90 group-hover:scale-100 transition">
                      <Icon name="play" size={18} />
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white truncate">
                  {alb.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {alb.year || "Album"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Singles & EPs Section (if any) */}
      {singles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight px-1">
            Singles & EPs
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {singles.map((single) => (
              <div
                key={single.id}
                onClick={() => onSelectAlbum(single)}
                className="w-36 sm:w-44 shrink-0 cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl transition hover:border-white/20 hover:scale-[1.02] active:scale-95 group"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-800">
                  {single.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={single.artworkUrl}
                      alt={single.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <Icon name="music" size={28} />
                    </div>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {single.title}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {single.year || "Single"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Artists Section */}
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight px-1">
            Fans Also Like
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {related.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectArtist(rel)}
                className="w-32 sm:w-36 shrink-0 cursor-pointer flex flex-col items-center text-center p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:border-white/20 hover:scale-[1.03] active:scale-95 transition group"
              >
                <div className="relative h-24 w-24 rounded-full overflow-hidden mb-3 bg-zinc-800 ring-2 ring-white/10 group-hover:ring-white/30 transition shadow-lg">
                  {rel.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rel.artworkUrl}
                      alt={rel.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white font-bold text-xl">
                      {rel.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold text-white truncate w-full">
                  {rel.name}
                </h3>
                <span className="text-[10px] text-zinc-400 mt-0.5">Artist</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import type { Album, AlbumDetails, Artist, Track } from "../types/music";
import { Icon } from "./Icons";
import { TrackRow } from "./TrackRow";
import { api } from "../lib/api";

export interface AlbumDetailViewProps {
  albumId: string;
  albumTitle?: string;
  albumArtwork?: string;
  artistName?: string;
  currentTrackId?: string;
  isPlaying?: boolean;
  favoritesIds: Set<string>;
  onPlayTrack: (track: Track, queue: Track[], targetIndex?: number) => void;
  onToggleLike: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onSelectArtist?: (artist: Artist) => void;
  onBack: () => void;
  onShare?: (title: string, text: string) => void;
  className?: string;
}

export function AlbumDetailView({
  albumId,
  albumTitle = "Album",
  albumArtwork,
  artistName,
  currentTrackId,
  isPlaying,
  favoritesIds,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onSelectArtist,
  onBack,
  onShare,
  className = "",
}: AlbumDetailViewProps) {
  const [details, setDetails] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    api
      .getAlbum(albumId)
      .then((res) => {
        if (active) {
          setDetails(res);
        }
      })
      .catch((err) => {
        console.warn("Failed to load album details:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [albumId]);

  const displayTitle = details?.album?.title || albumTitle;
  const displayArtwork = details?.album?.artworkUrl || albumArtwork;
  const displayArtist = details?.album?.artists?.[0]?.name || artistName || "Various Artists";
  const tracks = details?.tracks || [];

  const totalDurationMinutes = Math.floor(
    tracks.reduce((acc, t) => acc + (t.durationMs || 210000), 0) / 60000,
  );

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      onPlayTrack(tracks[0], tracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className={`space-y-8 animate-fade-in pb-24 ${className}`}>
      {/* Top Navigation */}
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
              `${displayTitle} on Musify`,
              `Listen to the album ${displayTitle} by ${displayArtist} on Musify!`,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
          aria-label="Share Album"
        >
          <Icon name="share" size={16} />
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
        {/* Ambient blurred backdrop */}
        {displayArtwork && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125"
            style={{ backgroundImage: `url(${displayArtwork})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Square Album Cover */}
          <div className="relative h-44 w-44 sm:h-56 sm:w-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-800">
            {displayArtwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayArtwork}
                alt={displayTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600">
                <Icon name="disc" size={48} />
              </div>
            )}
          </div>

          {/* Album Information */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Album
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {displayTitle}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-zinc-300">
              <button
                onClick={() => {
                  if (details?.album?.artists?.[0] && onSelectArtist) {
                    onSelectArtist(details.album.artists[0]);
                  }
                }}
                className="font-semibold text-white hover:underline transition"
              >
                {displayArtist}
              </button>
              <span>&bull;</span>
              <span>{details?.album?.year || "Album"}</span>
              <span>&bull;</span>
              <span>{tracks.length} songs</span>
              {totalDurationMinutes > 0 && (
                <>
                  <span>&bull;</span>
                  <span>{totalDurationMinutes} min</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10 disabled:opacity-40"
              >
                <Icon name="play" size={16} />
                <span>Play</span>
              </button>

              <button
                onClick={handleShufflePlay}
                disabled={tracks.length === 0}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-95 disabled:opacity-40"
              >
                <Icon name="shuffle" size={16} />
                <span>Shuffle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight px-1">Tracks</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-white/[0.03] border border-white/5"
              />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-400">
            No tracks found for this album.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 backdrop-blur-xl">
            {tracks.map((track, idx) => (
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
                    onPlay={() => onPlayTrack(track, tracks, idx)}
                    onToggleLike={() => onToggleLike(track)}
                    onAddToPlaylist={() => onAddToPlaylist(track)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

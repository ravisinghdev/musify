"use client";

import React from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { TrackRow } from "./TrackRow";

export interface ActivePlaylistView {
  id: string;
  name: string;
  artwork?: string;
  description?: string;
  author?: string;
  tracks: Track[];
  isCustom?: boolean;
  isLoading?: boolean;
}

export interface PlaylistDetailViewProps {
  playlist: ActivePlaylistView;
  currentTrackId?: string;
  isPlaying?: boolean;
  favoritesIds: Set<string>;
  downloadedIds?: Set<string>;
  onPlayTrack: (track: Track, queue: Track[], targetIndex?: number) => void;
  onToggleLike: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onDownload?: (track: Track) => void;
  onSelectArtist?: (artist: any) => void;
  onSelectAlbum?: (album: any) => void;
  onRemoveTrack?: (track: Track) => void;
  onDeletePlaylist?: () => void;
  onBack: () => void;
  className?: string;
}

export function PlaylistDetailView({
  playlist,
  currentTrackId,
  favoritesIds,
  downloadedIds,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onDownload,
  onSelectArtist,
  onSelectAlbum,
  onRemoveTrack,
  onDeletePlaylist,
  onBack,
  className = "",
}: PlaylistDetailViewProps) {
  const totalDurationMinutes = Math.floor(
    playlist.tracks.reduce((acc, t) => acc + (t.durationMs || 210000), 0) / 60000,
  );

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className={`py-6 space-y-8 animate-fade-in ${className}`}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition group select-none"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition group-hover:bg-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </span>
        <span>Back</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden select-none">
        {playlist.artwork && (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-30 blur-2xl scale-110"
            style={{
              backgroundImage: `url('${playlist.artwork}')`,
            }}
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {/* Playlist Artwork */}
        <div className="relative h-44 w-44 sm:h-52 sm:w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-zinc-900">
          {playlist.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={playlist.artwork}
              alt={playlist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Icon name="music" size={48} />
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-zinc-400">
            {playlist.isCustom ? "CUSTOM PLAYLIST" : "CURATED PLAYLIST"}
          </span>

          <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {playlist.name}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
            {playlist.description ||
              (playlist.author
                ? `Curated by ${playlist.author}`
                : "A collection of music for your vibe.")}
          </p>

          <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400 font-medium">
            <span>{playlist.tracks.length} tracks</span>
            <span>•</span>
            <span>{totalDurationMinutes} min</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {playlist.tracks.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-white/20 transition hover:bg-zinc-200 hover:scale-105 active:scale-95"
              >
                <Icon name="play" size={14} />
                <span>Play All</span>
              </button>
            )}

            {playlist.tracks.length > 0 && (
              <button
                onClick={handleShufflePlay}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/10 hover:border-white/20 active:scale-95"
              >
                <Icon name="shuffle" size={14} />
                <span>Shuffle</span>
              </button>
            )}

            {playlist.isCustom && onDeletePlaylist && (
              <button
                onClick={onDeletePlaylist}
                title="Delete this playlist"
                className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition"
              >
                <Icon name="close" size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-1">
        {playlist.isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-xs text-zinc-400">Loading playlist tracks...</p>
          </div>
        ) : playlist.tracks.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/[0.05]">
              <div className="flex items-center gap-3.5 flex-1">
                <span className="w-5 text-center">#</span>
                <span>Title</span>
              </div>
              <span className="hidden w-1/4 md:block">Album</span>
              <span className="w-10 text-right">Time</span>
            </div>

            <div className="space-y-1 pt-1">
              {playlist.tracks.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  isCurrent={currentTrackId === track.id}
                  isLiked={favoritesIds.has(track.id)}
                  isDownloaded={downloadedIds?.has(track.id)}
                  onPlay={(t) => onPlayTrack(t, playlist.tracks, idx)}
                  onToggleLike={(t) => onToggleLike(t)}
                  onAddToPlaylist={(t) => onAddToPlaylist(t)}
                  onDownload={onDownload}
                  onSelectArtist={onSelectArtist}
                  onSelectAlbum={onSelectAlbum}
                  onRemove={
                    playlist.isCustom && onRemoveTrack
                      ? (t) => onRemoveTrack(t)
                      : undefined
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-zinc-500">
            <Icon name="music" size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium text-zinc-300">
              No tracks in this playlist yet
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Search songs and click the plus button to add tracks here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


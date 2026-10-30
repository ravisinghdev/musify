"use client";

import React, { useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import { useTouchGestures } from "../lib/gestures";
import { TrackActionSheet } from "./TrackActionSheet";

interface TrackRowProps {
  track: Track;
  index?: number;
  isCurrent?: boolean;
  isLiked?: boolean;
  onPlay: (track: Track) => void;
  onToggleLike?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  onSelectArtist?: (artist: any) => void;
  onSelectAlbum?: (album: any) => void;
  onDownload?: (track: Track) => void;
  isDownloaded?: boolean;
  compact?: boolean;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
}

function formatDuration(ms?: number): string {
  if (!ms) return "3:40";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function TrackRow({
  track,
  index,
  isCurrent,
  isLiked,
  onPlay,
  onToggleLike,
  onAddToPlaylist,
  onRemove,
  onSelectArtist,
  onSelectAlbum,
  onDownload,
  isDownloaded = false,
  compact = false,
  onPlayNext,
  onAddToQueue,
}: TrackRowProps) {
  const [imgError, setImgError] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const artistsText = track.artists.map((a) => a.name).join(", ");
  const fallbackArt = track.sourceTrackId
    ? `https://i.ytimg.com/vi/${track.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const displayArt = imgError ? fallbackArt : track.artworkUrl || fallbackArt;

  const { touchHandlers } = useTouchGestures({
    onTap: () => {
      haptics.light();
      onPlay(track);
    },
    onLongPress: () => {
      haptics.heavy();
      setShowActionSheet(true);
    },
  });

  return (
    <>
      <div
        {...touchHandlers}
        onContextMenu={(e) => {
          e.preventDefault();
          haptics.heavy();
          setShowActionSheet(true);
        }}
        className={`group flex items-center justify-between gap-4 rounded-xl px-3 transition cursor-pointer select-none border-b border-white/[0.06] last:border-b-0 touch-pan-y active:scale-[0.99] ${
          compact ? "py-1.5" : "py-2.5"
        } ${
          isCurrent
            ? "bg-white/[0.08] text-white"
            : "hover:bg-white/[0.04] text-zinc-300"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3.5 flex-1">
          {index !== undefined && (
            <span className="w-5 text-center text-xs font-medium text-zinc-500 group-hover:hidden">
              {index + 1}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptics.medium();
              onPlay(track);
            }}
            aria-label="Play track"
            className="hidden group-hover:flex h-5 w-5 items-center justify-center text-white"
          >
            <Icon name="play" size={13} />
          </button>

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm">
            {displayArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayArt}
                alt={track.title}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <Icon name="music" size={16} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold tracking-tight ${
                isCurrent ? "text-indigo-400 font-bold" : "text-white"
              }`}
            >
              {track.title}
            </p>
            <p className="truncate text-xs text-zinc-400 font-medium mt-0.5">
              {onSelectArtist ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.light();
                    onSelectArtist(track.artists[0]);
                  }}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  {artistsText}
                </span>
              ) : (
                artistsText
              )}
            </p>
          </div>
        </div>

        {/* Right Actions & Duration */}
        <div className="flex items-center gap-3 shrink-0">
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                onDownload(track);
              }}
              title={isDownloaded ? "Downloaded offline" : "Download offline"}
              aria-label="Download track"
              className={`p-1 transition active:scale-90 ${
                isDownloaded
                  ? "text-emerald-400 opacity-100"
                  : "text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white"
              }`}
            >
              <Icon name="download" size={14} />
            </button>
          )}

          {onAddToPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                onAddToPlaylist(track);
              }}
              title="Add to playlist"
              aria-label="Add to playlist"
              className="p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white transition active:scale-90"
            >
              <Icon name="plus" size={15} />
            </button>
          )}

          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                onRemove(track);
              }}
              title="Remove from playlist"
              aria-label="Remove from playlist"
              className="p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition active:scale-90"
            >
              <Icon name="close" size={15} />
            </button>
          )}

          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.medium();
                onToggleLike(track);
              }}
              aria-label={isLiked ? "Unlike" : "Like"}
              className={`p-1.5 transition active:scale-90 ${
                isLiked
                  ? "text-rose-500 opacity-100"
                  : "text-zinc-500 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:text-white hover:opacity-100"
              }`}
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={16}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>
          )}

          <span className="text-right text-xs font-mono text-zinc-500 w-10">
            {formatDuration(track.durationMs)}
          </span>
        </div>
      </div>

      {/* Contextual Action Sheet on Long-press */}
      {showActionSheet && (
        <TrackActionSheet
          track={track}
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onPlay={(t) => onPlay(t)}
          onPlayNext={(t) => onPlayNext?.(t)}
          onAddToQueue={(t) => onAddToQueue?.(t)}
          isLiked={Boolean(isLiked)}
          onToggleLike={(t) => onToggleLike?.(t)}
          onAddToPlaylist={(t) => onAddToPlaylist?.(t)}
        />
      )}
    </>
  );
}
export default TrackRow;

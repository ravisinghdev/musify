"use client";

import React from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

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
}: TrackRowProps) {
  const [imgError, setImgError] = React.useState(false);
  const artistsText = track.artists.map((a) => a.name).join(", ");
  const fallbackArt = track.sourceTrackId
    ? `https://i.ytimg.com/vi/${track.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const displayArt = imgError ? fallbackArt : track.artworkUrl || fallbackArt;

  return (
    <div
      onClick={() => onPlay(track)}
      className={`group flex items-center justify-between gap-4 rounded-xl px-3 transition cursor-pointer select-none ${
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

        {index !== undefined && (
          <span className="hidden w-5 items-center justify-center text-white group-hover:flex">
            <Icon name="play" size={13} />
          </span>
        )}

        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800 shadow-sm">
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

          {isCurrent && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
              <div className="flex items-end gap-[2px] h-4">
                <span className="w-[3px] bg-white rounded-full equalizer-bar-1" />
                <span className="w-[3px] bg-white rounded-full equalizer-bar-2" />
                <span className="w-[3px] bg-white rounded-full equalizer-bar-3" />
                <span className="w-[3px] bg-white rounded-full equalizer-bar-4" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${
              isCurrent ? "text-white font-semibold" : "text-zinc-200"
            }`}
          >
            {track.title}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {track.artists.map((artist, aIdx) => (
              <span key={`${artist.id || artist.name}-${aIdx}`}>
                {aIdx > 0 && ", "}
                <span
                  onClick={(e) => {
                    if (onSelectArtist && artist.id) {
                      e.stopPropagation();
                      onSelectArtist(artist);
                    }
                  }}
                  className={onSelectArtist && artist.id ? "hover:text-zinc-200 hover:underline cursor-pointer" : ""}
                >
                  {artist.name}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>

      {track.album && (
        <span
          onClick={(e) => {
            if (onSelectAlbum && track.album?.id) {
              e.stopPropagation();
              onSelectAlbum(track.album);
            }
          }}
          className={`hidden w-1/4 truncate text-xs text-zinc-500 md:block ${
            onSelectAlbum && track.album?.id ? "hover:text-zinc-200 hover:underline cursor-pointer" : ""
          }`}
        >
          {track.album.title}
        </span>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
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
              onAddToPlaylist(track);
            }}
            title="Add to playlist"
            aria-label="Add to playlist"
            className="p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white transition"
          >
            <Icon name="plus" size={15} />
          </button>
        )}

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(track);
            }}
            title="Remove from playlist"
            aria-label="Remove from playlist"
            className="p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition"
          >
            <Icon name="close" size={15} />
          </button>
        )}

        {onToggleLike && (
          <button
            onClick={(e) => {
              e.stopPropagation();
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
  );
}

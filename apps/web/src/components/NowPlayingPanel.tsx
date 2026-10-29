"use client";

import React from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

interface NowPlayingPanelProps {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onPlayTrack: (track: Track, index?: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
  onClose?: () => void;
  onExpandVisualizer?: () => void;
  onOpenQueueModal?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function getHighResArtworkUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Upgrade Google user content dimension parameters (e.g. =w60-h60 to =w800-h800)
  let clean = url.replace(/=w\d+-h\d+.*$/, "=w800-h800-l90-rj");
  // Upgrade YouTube i.ytimg.com default.jpg to hqdefault.jpg
  clean = clean.replace("/default.jpg", "/hqdefault.jpg");
  return clean;
}

export function NowPlayingPanel({
  currentTrack,
  queue,
  queueIndex,
  isLiked = false,
  onToggleLike,
  onPlayTrack,
  isPlaying = false,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  onSeek,
  onNext,
  onPrev,
  isShuffle = false,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
  onExpandVisualizer,
  onOpenQueueModal,
}: NowPlayingPanelProps) {
  const [imgError, setImgError] = React.useState(false);

  const hasTrack = Boolean(currentTrack);
  const trackTitle = currentTrack?.title || "No Track Selected";
  const artistsText = currentTrack?.artists && currentTrack.artists.length > 0
    ? currentTrack.artists.map((a) => a.name).join(", ")
    : "Select any song to start listening";

  const fallbackArt = currentTrack?.sourceTrackId
    ? `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const rawArt = imgError ? fallbackArt : currentTrack?.artworkUrl || fallbackArt;
  const artworkUrl = getHighResArtworkUrl(rawArt);

  const upNextItems = React.useMemo(() => {
    if (!queue || queue.length === 0) return [];
    const list: { track: Track; originalIndex: number }[] = [];
    queue.forEach((track, idx) => {
      if (queueIndex !== undefined && queueIndex >= 0) {
        if (idx !== queueIndex) {
          list.push({ track, originalIndex: idx });
        }
      } else if (!currentTrack || track.id !== currentTrack.id) {
        list.push({ track, originalIndex: idx });
      }
    });
    return list.slice(0, 5);
  }, [queue, currentTrack, queueIndex]);

  const effectiveDuration = hasTrack
    ? duration || (currentTrack?.durationMs ? currentTrack.durationMs / 1000 : 0)
    : 0;
  const progressPercent = effectiveDuration
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  return (
    <aside className="hidden w-[340px] shrink-0 h-full overflow-y-auto custom-scrollbar border-l border-white/[0.07] bg-[#07090e]/60 p-5 backdrop-blur-2xl xl:flex xl:flex-col select-none">
      {/* Big Square Artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt={trackTitle}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
            <Icon name="music" size={48} />
          </div>
        )}

        {hasTrack && (
          <button
            onClick={onExpandVisualizer}
            aria-label="Expand artwork into visualizer"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 hover:scale-105"
          >
            <Icon name="maximize" size={13} />
          </button>
        )}
      </div>

      {/* Track Title, Artist, & Like Button */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white tracking-tight">
            {trackTitle}
          </h3>
          <p className="truncate text-xs text-zinc-400 mt-0.5">{artistsText}</p>
        </div>

        {hasTrack && (
          <button
            onClick={onToggleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
            className="text-zinc-400 transition hover:text-white p-1"
          >
            <Icon
              name={isLiked ? "heart-filled" : "heart"}
              size={20}
              className={isLiked ? "text-rose-500" : ""}
            />
          </button>
        )}
      </div>

      {/* Seek Bar & Timers */}
      <div className="mt-5 space-y-1.5">
        <div className="relative flex items-center group">
          <div className="h-1 w-full rounded-full bg-white/10 relative overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            value={currentTime}
            onChange={(e) => onSeek && onSeek(Number(e.target.value))}
            aria-label="Seek track in right panel"
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Playback Controls Row */}
      <div className="mt-3 flex items-center justify-between px-2">
        <button
          onClick={onToggleShuffle}
          disabled={!hasTrack}
          aria-label="Toggle Shuffle"
          className={`transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
            isShuffle
              ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Icon name="shuffle" size={16} />
          {isShuffle && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
          )}
        </button>

        <button
          onClick={onPrev}
          disabled={!hasTrack}
          aria-label="Previous track"
          className="text-zinc-400 transition hover:text-white hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="skip-back" size={20} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={!hasTrack}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/20 transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name={isPlaying ? "pause" : "play"} size={17} />
        </button>

        <button
          onClick={onNext}
          disabled={!hasTrack}
          aria-label="Next track"
          className="text-zinc-400 transition hover:text-white hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="skip-forward" size={20} />
        </button>

        <button
          onClick={onToggleRepeat}
          disabled={!hasTrack}
          aria-label="Toggle Repeat / Loop"
          className={`transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
            isRepeat
              ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Icon name="repeat" size={16} />
          {isRepeat && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
          )}
        </button>
      </div>

      {/* Up Next Queue Section */}
      <div className="mt-7 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
            Up Next
          </h4>
          <span
            onClick={onOpenQueueModal}
            className="text-[11px] font-medium text-zinc-500 hover:text-white transition cursor-pointer"
          >
            See all
          </span>
        </div>

        <div className="space-y-1 flex-1 min-h-0 custom-scrollbar pr-1">
          {upNextItems.map((item) => (
            <div
              key={`${item.track.id}-${item.originalIndex}`}
              onClick={() => onPlayTrack(item.track, item.originalIndex)}
              className="group flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-white/[0.05] cursor-pointer"
            >
              <div className="flex min-w-0 items-center gap-3 flex-1">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-zinc-800">
                  {item.track.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getHighResArtworkUrl(item.track.artworkUrl)}
                      alt={item.track.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <Icon name="music" size={14} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {item.track.title}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </div>

              <button
                aria-label="Options"
                className="text-zinc-600 transition hover:text-zinc-300 p-1"
              >
                <Icon name="more" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

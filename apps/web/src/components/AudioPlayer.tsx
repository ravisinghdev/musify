"use client";

import React, { useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

interface AudioPlayerProps {
  currentTrack: Track | null;
  playbackUrl: string | null;
  isLoadingStream: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onTogglePlay?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (vol: number) => void;
  onToggleMute?: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleLyrics?: () => void;
  onToggleRightPanel?: () => void;
  onOpenQueueModal?: () => void;
  isRightPanelOpen?: boolean;
  onOpenVisualizer?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function AudioPlayer({
  currentTrack,
  isLoadingStream,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  isRepeat,
  isLiked = false,
  onToggleLike,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onNext,
  onPrev,
  onToggleLyrics,
  onToggleRightPanel,
  onOpenQueueModal,
  isRightPanelOpen = true,
  onOpenVisualizer,
}: AudioPlayerProps) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleQueueClick = () => {
    if (
      onOpenQueueModal &&
      (typeof window === "undefined" || window.innerWidth < 1280)
    ) {
      onOpenQueueModal();
    } else if (onToggleRightPanel) {
      onToggleRightPanel();
    }
  };

  const hasTrack = Boolean(currentTrack);
  const trackTitle = currentTrack?.title || "No Track Selected";
  const artistsText =
    currentTrack?.artists && currentTrack.artists.length > 0
      ? currentTrack.artists.map((a) => a.name).join(", ")
      : "Select any song to start listening";

  const fallbackArt = currentTrack?.sourceTrackId
    ? `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const displayArtwork = imgError
    ? fallbackArt
    : currentTrack?.artworkUrl || fallbackArt;

  const effectiveDuration = hasTrack
    ? duration ||
      (currentTrack?.durationMs ? currentTrack.durationMs / 1000 : 0)
    : 0;
  const progressPercent = effectiveDuration
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  const displayEndTime = showCountdown
    ? `-${formatTime(Math.max(0, effectiveDuration - currentTime))}`
    : formatTime(effectiveDuration);

  return (
    <aside
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-50 h-[84px] border-t border-white/10  px-3 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.6)] sm:px-6 select-none flex items-center pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Top Edge Full-Width Time Slider / Scrubber */}
      <div className="absolute -top-2 left-0 right-0 h-4 flex items-center group cursor-pointer z-30">
        <div className="h-1 group-hover:h-2 w-full bg-white/10 transition-all relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          value={currentTime}
          disabled={!hasTrack}
          onChange={(e) => onSeek && onSeek(Number(e.target.value))}
          aria-label="Seek track position"
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 sm:gap-4">
        {/* Left: Track Info & Glowing Artwork & Like */}
        <div className="flex min-w-0 max-w-[130px] xs:max-w-[160px] sm:max-w-[260px] items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={hasTrack ? onOpenVisualizer : undefined}
            title={
              hasTrack ? "Click to open Fullscreen Visualizer" : "Musify Player"
            }
            className={`relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-md transition ${
              hasTrack
                ? "cursor-pointer hover:scale-105 group"
                : "cursor-default"
            }`}
          >
            {displayArtwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayArtwork}
                alt={trackTitle}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition group-hover:opacity-90"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
                <Icon name="music" size={18} />
              </div>
            )}
            {hasTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                <Icon name="maximize" size={12} className="text-white" />
              </div>
            )}
            {isLoadingStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs sm:text-sm font-semibold text-white tracking-tight">
              {trackTitle}
            </p>
            <p className="truncate text-[10px] sm:text-xs text-zinc-400 mt-0.5">
              {artistsText}
            </p>
          </div>

          {hasTrack && (
            <button
              onClick={onToggleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
              className="text-zinc-400 hover:text-white transition p-1 shrink-0"
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={17}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>
          )}
        </div>

        {/* Center: Controls & Scrub Bar */}
        <div className="flex max-w-[620px] flex-1 flex-col items-center gap-1 sm:gap-1.5 px-1 sm:px-2 min-w-0">
          {/* Controls Buttons Row */}
          <div className="flex items-center gap-2.5 xs:gap-3.5 sm:gap-5">
            <button
              onClick={onToggleShuffle}
              disabled={!hasTrack}
              aria-label="Toggle Shuffle"
              className={`inline-flex transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
                isShuffle
                  ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon name="shuffle" size={15} />
              {isShuffle && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
              )}
            </button>

            <button
              onClick={onPrev}
              disabled={!hasTrack}
              aria-label="Previous track"
              className="text-zinc-400 transition hover:text-white hover:scale-110 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="skip-back" size={17} />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!hasTrack || isLoadingStream}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-white/20 shrink-0"
            >
              {isLoadingStream ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} size={15} />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasTrack}
              aria-label="Next track"
              className="text-zinc-400 transition hover:text-white hover:scale-110 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="skip-forward" size={17} />
            </button>

            <button
              onClick={onToggleRepeat}
              disabled={!hasTrack}
              aria-label="Toggle Repeat / Loop"
              className={`inline-flex transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
                isRepeat
                  ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon name="repeat" size={15} />
              {isRepeat && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
              )}
            </button>
          </div>

          {/* Mobile Compact Timestamps */}
          <div className="flex sm:hidden items-center gap-1.5 text-[10px] font-mono text-zinc-400">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <button
              onClick={() => setShowCountdown(!showCountdown)}
              className="tabular-nums hover:text-zinc-200 transition"
            >
              {displayEndTime}
            </button>
          </div>

          {/* Desktop/Tablet Seek Bar with Timers */}
          <div className="hidden sm:flex w-full items-center gap-3 text-[11px] font-medium text-zinc-500 font-mono">
            <span className="w-9 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex flex-1 items-center group py-1.5 cursor-pointer">
              {/* Background Track */}
              <div className="h-1 group-hover:h-1.5 w-full rounded-full bg-white/10 relative transition-all">
                {/* Progress Fill */}
                <div
                  className="h-full bg-white rounded-full transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  {/* Thumb Knob */}
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                value={currentTime}
                disabled={!hasTrack}
                onChange={(e) => onSeek && onSeek(Number(e.target.value))}
                aria-label="Seek track position"
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <button
              onClick={() => setShowCountdown(!showCountdown)}
              title={
                showCountdown
                  ? "Click to show total duration"
                  : "Click to show remaining time"
              }
              className="w-9 text-left tabular-nums hover:text-zinc-300 transition cursor-pointer"
            >
              {displayEndTime}
            </button>
          </div>
        </div>

        {/* Right Tools: Volume, Lyrics, Right Panel / Queue Toggle */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 sm:w-[240px]">
          {/* Custom Interactive Glass Volume Slider */}
          <div className="hidden sm:flex items-center gap-2 group">
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-zinc-400 transition hover:text-white"
            >
              <Icon
                name={isMuted || volume === 0 ? "volume-x" : "volume"}
                size={18}
              />
            </button>

            <div className="relative flex w-20 lg:w-24 items-center py-2 cursor-pointer">
              <div className="h-1 group-hover:h-1.5 w-full rounded-full bg-white/10 relative transition-all">
                <div
                  className="h-full bg-white rounded-full transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 relative"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) =>
                  onVolumeChange && onVolumeChange(Number(e.target.value))
                }
                aria-label="Volume slider"
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Mobile Mute Quick Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="sm:hidden text-zinc-400 transition hover:text-white p-1"
          >
            <Icon
              name={isMuted || volume === 0 ? "volume-x" : "volume"}
              size={18}
            />
          </button>

          {/* Lyrics button */}
          <button
            onClick={onToggleLyrics}
            title="Lyrics"
            aria-label="Toggle song lyrics"
            className="text-zinc-400 transition hover:text-white p-1 hover:scale-105"
          >
            <Icon name="mic" size={17} />
          </button>

          {/* Right Panel / Queue Toggle (Opens Queue Modal on Mobile/Tablet) */}
          <button
            onClick={handleQueueClick}
            title="Toggle Queue Panel"
            aria-label="Toggle Queue Panel"
            className={`transition p-1 hover:scale-105 ${
              isRightPanelOpen ? "text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon name="queue" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

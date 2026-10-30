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
  sleepTimerRemaining?: number | null;
  onOpenSleepTimer?: () => void;
  playerShape?: "pill" | "bar";
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
  sleepTimerRemaining,
  onOpenSleepTimer,
  playerShape = "pill",
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

  const isBar = playerShape === "bar";

  return (
    <aside
      aria-label="Audio player"
      className={`fixed z-50 transition-all duration-300 select-none backdrop-blur-3xl border-white/15 ${
        isBar
          ? "bottom-0 left-0 right-0 w-full rounded-none border-t border-x-0 border-b-0 p-3 sm:px-8 sm:py-0 sm:h-[84px] sm:flex sm:items-center shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
          : "bottom-2.5 left-2.5 right-2.5 max-w-lg mx-auto rounded-[24px] p-2.5 border sm:bottom-4 sm:left-4 sm:right-4 sm:max-w-[1440px] sm:rounded-full sm:h-[84px] sm:px-6 sm:py-0 sm:flex sm:items-center shadow-[0_16px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]"
      }`}
    >
      {/* =========================================================================
          MOBILE VIEW (< sm): Clean 2-Tier Pill Layout (No Overlaps, Zero Clutter)
          ========================================================================= */}
      <div className="flex sm:hidden flex-col w-full gap-2">
        {/* Tier 1: Track Info (Left) + Playback Controls (Right) */}
        <div className="flex items-center justify-between gap-2">
          {/* Track Info & Artwork */}
          <div className="flex min-w-0 items-center gap-2.5 flex-1 pr-1">
            <div
              onClick={hasTrack ? onOpenVisualizer : undefined}
              title={hasTrack ? "Open Visualizer" : "Musify Player"}
              className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-zinc-900 shadow-sm transition ${
                hasTrack ? "cursor-pointer active:scale-95" : "cursor-default"
              }`}
            >
              {displayArtwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayArtwork}
                  alt={trackTitle}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
                  <Icon name="music" size={16} />
                </div>
              )}
              {isLoadingStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white tracking-tight">
                {trackTitle}
              </p>
              <p className="truncate text-[10px] text-zinc-400 mt-0.5">
                {artistsText}
              </p>
            </div>

            {hasTrack && (
              <button
                onClick={onToggleLike}
                aria-label={isLiked ? "Unlike" : "Like"}
                className="text-zinc-400 hover:text-white active:scale-90 transition p-1 shrink-0"
              >
                <Icon
                  name={isLiked ? "heart-filled" : "heart"}
                  size={16}
                  className={isLiked ? "text-rose-500" : ""}
                />
              </button>
            )}
          </div>

          {/* Primary Playback Controls Row */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleShuffle}
              disabled={!hasTrack}
              aria-label="Toggle Shuffle"
              className={`p-1.5 transition active:scale-90 relative disabled:opacity-40 ${
                isShuffle ? "text-indigo-400" : "text-zinc-400"
              }`}
            >
              <Icon name="shuffle" size={14} />
              {isShuffle && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
              )}
            </button>

            <button
              onClick={onPrev}
              disabled={!hasTrack}
              aria-label="Previous track"
              className="text-zinc-300 active:scale-90 transition p-1.5 disabled:opacity-40"
            >
              <Icon name="skip-back" size={16} />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!hasTrack || isLoadingStream}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition active:scale-90 shadow-md shadow-white/20 shrink-0"
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
              className="text-zinc-300 active:scale-90 transition p-1.5 disabled:opacity-40"
            >
              <Icon name="skip-forward" size={16} />
            </button>

            <button
              onClick={onToggleRepeat}
              disabled={!hasTrack}
              aria-label="Toggle Repeat"
              className={`p-1.5 transition active:scale-90 relative disabled:opacity-40 ${
                isRepeat ? "text-indigo-400" : "text-zinc-400"
              }`}
            >
              <Icon name="repeat" size={14} />
              {isRepeat && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
              )}
            </button>
          </div>
        </div>

        {/* Tier 2: Interactive Scrubber with Timestamps + Utility Controls */}
        <div className="flex items-center gap-2 pt-0.5 border-t border-white/5">
          {/* Time Scrubber */}
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center py-2 cursor-pointer">
              <div className="h-1 w-full rounded-full bg-white/15 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
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
              className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0 hover:text-zinc-200 transition"
            >
              {displayEndTime}
            </button>
          </div>

          {/* Quick Utility Tools (Volume, Sleep Timer, Lyrics) — Hamburger omitted on mobile as requested */}
          <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/10">
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-zinc-400 hover:text-white p-1 active:scale-90 transition"
            >
              <Icon
                name={isMuted || volume === 0 ? "volume-x" : "volume"}
                size={16}
              />
            </button>

            {onOpenSleepTimer && (
              <button
                onClick={onOpenSleepTimer}
                title={
                  sleepTimerRemaining
                    ? `Sleep Timer: ${sleepTimerRemaining}m remaining`
                    : "Set Sleep Timer"
                }
                aria-label="Set Sleep Timer"
                className={`flex items-center gap-0.5 rounded-full p-1 active:scale-90 transition ${
                  sleepTimerRemaining
                    ? "bg-indigo-500/25 text-indigo-300 px-1.5 text-[9px] font-bold border border-indigo-500/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span className="text-xs">🌙</span>
                {sleepTimerRemaining && <span>{sleepTimerRemaining}m</span>}
              </button>
            )}

            <button
              onClick={onToggleLyrics}
              title="Lyrics"
              aria-label="Toggle song lyrics"
              className="text-zinc-400 hover:text-white p-1 active:scale-90 transition"
            >
              <Icon name="mic" size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= sm): Spacious 3-Column Floating Pill Dock
          ========================================================================= */}
      <div className="hidden sm:flex w-full items-center justify-between gap-4">
        {/* Left: Track Info & Glowing Artwork & Like */}
        <div className="flex min-w-0 w-[260px] lg:w-[300px] items-center gap-3 shrink-0">
          <div
            onClick={hasTrack ? onOpenVisualizer : undefined}
            title={
              hasTrack ? "Click to open Fullscreen Visualizer" : "Musify Player"
            }
            className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-md transition ${
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
                <Icon name="maximize" size={14} className="text-white" />
              </div>
            )}
            {isLoadingStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white tracking-tight">
              {trackTitle}
            </p>
            <p className="truncate text-xs text-zinc-400 mt-0.5">
              {artistsText}
            </p>
          </div>

          {hasTrack && (
            <button
              onClick={onToggleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
              className="text-zinc-400 hover:text-white hover:scale-110 transition p-1.5 shrink-0"
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={18}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>
          )}
        </div>

        {/* Center: Playback Controls & Continuous Scrub Bar */}
        <div className="flex max-w-[620px] flex-1 flex-col items-center gap-1.5 px-2 min-w-0">
          {/* Controls Buttons Row */}
          <div className="flex items-center gap-4 sm:gap-5">
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
              <Icon name="shuffle" size={16} />
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
              <Icon name="skip-back" size={18} />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!hasTrack || isLoadingStream}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-white/20 shrink-0"
            >
              {isLoadingStream ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} size={16} />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasTrack}
              aria-label="Next track"
              className="text-zinc-400 transition hover:text-white hover:scale-110 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="skip-forward" size={18} />
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
              <Icon name="repeat" size={16} />
              {isRepeat && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.9)]" />
              )}
            </button>
          </div>

          {/* Desktop Seek Bar with Timers */}
          <div className="flex w-full items-center gap-3 text-[11px] font-medium text-zinc-500 font-mono">
            <span className="w-9 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex flex-1 items-center group py-1.5 cursor-pointer">
              <div className="h-1 group-hover:h-1.5 w-full rounded-full bg-white/10 relative transition-all">
                <div
                  className="h-full bg-white rounded-full transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 relative"
                  style={{ width: `${progressPercent}%` }}
                >
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

        {/* Right: Volume Slider, Sleep Timer, Lyrics, Queue Button */}
        <div className="flex items-center justify-end gap-3 w-[260px] lg:w-[300px]">
          {/* Custom Interactive Glass Volume Slider */}
          <div className="flex items-center gap-2 group">
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

          {/* Sleep Timer button */}
          {onOpenSleepTimer && (
            <button
              onClick={onOpenSleepTimer}
              title={
                sleepTimerRemaining
                  ? `Sleep Timer: ${sleepTimerRemaining}m remaining`
                  : "Set Sleep Timer"
              }
              aria-label="Set Sleep Timer"
              className={`flex items-center gap-1 rounded-full p-1.5 transition hover:scale-105 ${
                sleepTimerRemaining
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-bold shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="text-sm">🌙</span>
              {sleepTimerRemaining && <span>{sleepTimerRemaining}m</span>}
            </button>
          )}

          {/* Lyrics button */}
          <button
            onClick={onToggleLyrics}
            title="Lyrics"
            aria-label="Toggle song lyrics"
            className="text-zinc-400 transition hover:text-white p-1.5 hover:scale-105"
          >
            <Icon name="mic" size={18} />
          </button>

          {/* Right Panel / Queue Toggle (Visible on Desktop only; omitted on mobile) */}
          <button
            onClick={handleQueueClick}
            title="Toggle Queue Panel"
            aria-label="Toggle Queue Panel"
            className={`transition p-1.5 hover:scale-105 ${
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

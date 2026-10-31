"use client";

import React, { useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import { useTouchGestures } from "../lib/gestures";
import { SlidersHorizontal, Maximize2 } from "lucide-react";

interface AudioPlayerProps {
  currentTrack: Track | null;
  playbackUrl: string | null;
  isLoadingStream: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedFraction?: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  repeatMode?: "off" | "all" | "one";
  isLiked?: boolean;
  queueCount?: number;
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
  onOpenAudioSettings?: () => void;
  isRightPanelOpen?: boolean;
  onOpenVisualizer?: () => void;
  sleepTimerRemaining?: number | null;
  onOpenSleepTimer?: () => void;
  onClose?: () => void;
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
  bufferedFraction = 0,
  volume,
  isMuted,
  isShuffle,
  isRepeat,
  repeatMode = "off",
  isLiked = false,
  queueCount = 0,
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
  onOpenAudioSettings,
  isRightPanelOpen = true,
  onOpenVisualizer,
  sleepTimerRemaining,
  onOpenSleepTimer,
  onClose,
  playerShape = "pill",
}: AudioPlayerProps) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { touchHandlers: mobileDockGestures } = useTouchGestures({
    onTap: () => {
      onOpenVisualizer?.();
    },
    onSwipeUp: () => {
      onOpenVisualizer?.();
    },
    onSwipeDown: () => {
      onClose?.();
    },
    onSwipeLeft: () => {
      haptics.light();
      onNext?.();
    },
    onSwipeRight: () => {
      haptics.light();
      onPrev?.();
    },
  });

  // When no song is selected, hide the audio player completely
  if (!currentTrack) {
    return null;
  }

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
      className="fixed z-40 transition-all duration-300 select-none backdrop-blur-2xl bg-[#12141C]/95 border border-white/[0.12] shadow-none bottom-[calc(56px+max(env(safe-area-inset-bottom,0px),8px))] lg:bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-lg sm:max-w-5xl lg:max-w-6xl mx-auto rounded-2xl sm:rounded-full px-3 py-2 sm:px-7 sm:py-0 sm:h-[82px] sm:flex sm:items-center"
    >
      {/* =========================================================================
          MOBILE VIEW (< sm): Ultra-Compact Sleek Player Dock with Embedded Progress
          ========================================================================= */}
      <div className="flex sm:hidden flex-col w-full relative">
        <div className="flex items-center justify-between gap-2.5">
          {/* Artwork & Track Info (Click/Swipe-up opens visualizer) */}
          <div
            {...mobileDockGestures}
            className="flex min-w-0 items-center gap-2.5 flex-1 cursor-pointer active:opacity-80 transition touch-pan-y"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1A1D28] shadow-md">
              {displayArtwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayArtwork}
                  alt={trackTitle}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#686C7B] bg-[#1A1D28]">
                  <Icon name="music" size={16} />
                </div>
              )}
              {isLoadingStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#A5A9FF] border-t-transparent" />
                </div>
              )}
              {isPlaying && !isLoadingStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-end gap-[2px] h-3">
                    <span className="w-[2px] bg-[#A5A9FF] rounded-full equalizer-bar-1 shadow-[0_0_4px_rgba(165,169,255,0.8)]" />
                    <span className="w-[2px] bg-[#A5A9FF] rounded-full equalizer-bar-2 shadow-[0_0_4px_rgba(165,169,255,0.8)]" />
                    <span className="w-[2px] bg-[#A5A9FF] rounded-full equalizer-bar-3 shadow-[0_0_4px_rgba(165,169,255,0.8)]" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#F5F5F7] tracking-tight">
                {trackTitle}
              </p>
              <p className="truncate text-[10px] text-[#A1A4B2]">
                {artistsText}
              </p>
            </div>
          </div>

          {/* Quick Actions: Like, Play/Pause, Next, Expand, Queue, Close */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                haptics.light();
                onToggleLike?.();
              }}
              aria-label={isLiked ? "Unlike" : "Like"}
              className="text-[#A1A4B2] hover:text-[#F5F5F7] active:scale-90 transition p-1.5 shrink-0"
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={16}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>

            <button
              onClick={() => {
                haptics.light();
                onTogglePlay?.();
              }}
              disabled={isLoadingStream}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] text-[#090A0F] transition active:scale-90 shadow-md shrink-0 hover:bg-white"
            >
              {isLoadingStream ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} size={16} />
              )}
            </button>

            <button
              onClick={() => {
                haptics.light();
                onNext?.();
              }}
              aria-label="Next track"
              className="text-[#A1A4B2] hover:text-[#F5F5F7] active:scale-90 transition p-1.5"
            >
              <Icon name="skip-forward" size={17} />
            </button>

            {onOpenVisualizer && (
              <button
                onClick={onOpenVisualizer}
                title="Expand Now Playing"
                aria-label="Expand Now Playing"
                className="text-[#A1A4B2] hover:text-[#A5A9FF] p-1.5 active:scale-90 transition shrink-0"
              >
                <Maximize2 size={15} />
              </button>
            )}

            {onOpenQueueModal && (
              <button
                onClick={() => {
                  onOpenQueueModal();
                }}
                title="Open Play Queue"
                aria-label="Open Play Queue"
                className="relative text-[#A1A4B2] hover:text-[#F5F5F7] p-1.5 active:scale-90 transition"
              >
                <Icon name="queue" size={16} />
                {queueCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#A5A9FF] px-1 text-[8px] font-bold text-[#090A0F]">
                    {queueCount > 9 ? "9+" : queueCount}
                  </span>
                )}
              </button>
            )}

            {onClose && (
              <button
                onClick={() => {
                  onClose();
                }}
                title="Close Player"
                aria-label="Close Player"
                className="text-[#686C7B] hover:text-[#F5F5F7] p-1.5 active:scale-90 transition shrink-0 ml-0.5"
              >
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Embedded Thin Interactive Progress Bar with Buffering at Bottom of Pill */}
        <div className="relative w-full pt-1.5 -mb-0.5">
          <div className="h-1 w-full rounded-full bg-white/[0.08] relative overflow-hidden">
            {/* Buffered Fraction */}
            <div
              className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, bufferedFraction * 100))}%` }}
            />
            {/* Current Playback */}
            <div
              className="relative h-full bg-[#A5A9FF] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={effectiveDuration || 100}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              onSeek && onSeek(val);
            }}
            aria-label="Seek track position"
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (>= sm): Spacious 3-Column Floating Pill Dock
          ========================================================================= */}
      <div className="hidden sm:flex w-full items-center justify-between gap-4">
        {/* Left: Track Info & Glowing Artwork & Like */}
        <div className="flex min-w-0 w-[270px] lg:w-[320px] items-center gap-3.5 shrink-0">
          <div
            onClick={hasTrack ? onOpenVisualizer : undefined}
            title={
              hasTrack ? "Click to open Fullscreen Visualizer" : "Musify Player"
            }
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-lg transition ${
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
                <Icon name="music" size={20} />
              </div>
            )}
            {/* Live animated Equalizer on Artwork */}
            {isPlaying && !isLoadingStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:opacity-0 transition-opacity">
                <div className="flex items-end gap-[2px] h-3.5">
                  <span className="w-[2.5px] bg-[#A5A9FF] rounded-full equalizer-bar-1 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
                  <span className="w-[2.5px] bg-[#A5A9FF] rounded-full equalizer-bar-2 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
                  <span className="w-[2.5px] bg-[#A5A9FF] rounded-full equalizer-bar-3 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
                </div>
              </div>
            )}
            {hasTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                <Icon name="maximize" size={16} className="text-white" />
              </div>
            )}
            {isLoadingStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm lg:text-base font-bold text-[#F5F5F7] tracking-tight">
                {trackTitle}
              </p>
              {hasTrack && (
                <span className="shrink-0 rounded-[4px] border border-[#A5A9FF]/30 bg-[#292B4B]/60 px-1.5 py-0.2 text-[8px] font-mono font-bold tracking-wider text-[#A5A9FF]">
                  LOSSLESS
                </span>
              )}
            </div>
            <p className="truncate text-xs text-[#A1A4B2] font-medium mt-0.5">
              {artistsText}
            </p>
          </div>

          {hasTrack && (
            <button
              onClick={() => {
                haptics.light();
                onToggleLike?.();
              }}
              aria-label={isLiked ? "Unlike" : "Like"}
              className="text-[#A1A4B2] hover:text-[#F5F5F7] hover:scale-110 transition p-1.5 shrink-0"
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={20}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>
          )}
        </div>

        {/* Center: Playback Controls & Continuous Scrub Bar */}
        <div className="flex max-w-[620px] flex-1 flex-col items-center gap-1.5 px-2 min-w-0">
          {/* Controls Buttons Row */}
          <div className="flex items-center gap-5 sm:gap-6">
            <button
              onClick={() => {
                onToggleShuffle?.();
              }}
              disabled={!hasTrack}
              aria-label="Toggle Shuffle"
              className={`inline-flex transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
                isShuffle
                  ? "text-[#A5A9FF] drop-shadow-[0_0_8px_rgba(165,169,255,0.7)]"
                  : "text-[#686C7B] hover:text-[#A1A4B2]"
              }`}
            >
              <Icon name="shuffle" size={17} />
              {isShuffle && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#A5A9FF]" />
              )}
            </button>

            <button
              onClick={() => {
                haptics.light();
                onPrev?.();
              }}
              disabled={!hasTrack}
              aria-label="Previous track"
              className="text-[#A1A4B2] transition hover:text-[#F5F5F7] hover:scale-110 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="skip-back" size={20} />
            </button>

            <button
              onClick={() => {
                haptics.light();
                onTogglePlay?.();
              }}
              disabled={!hasTrack || isLoadingStream}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F7] text-[#090A0F] transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(165,169,255,0.25)] hover:bg-white shrink-0"
            >
              {isLoadingStream ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} size={18} />
              )}
            </button>

            <button
              onClick={() => {
                haptics.light();
                onNext?.();
              }}
              disabled={!hasTrack}
              aria-label="Next track"
              className="text-[#A1A4B2] transition hover:text-[#F5F5F7] hover:scale-110 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="skip-forward" size={20} />
            </button>

            <button
              onClick={() => {
                onToggleRepeat?.();
              }}
              disabled={!hasTrack}
              aria-label="Toggle Repeat Mode"
              title={
                repeatMode === "one"
                  ? "Repeat: Current Track"
                  : repeatMode === "all" || isRepeat
                  ? "Repeat: Queue"
                  : "Repeat: Off"
              }
              className={`inline-flex transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
                repeatMode === "one" || repeatMode === "all" || isRepeat
                  ? "text-[#A5A9FF] drop-shadow-[0_0_8px_rgba(165,169,255,0.7)]"
                  : "text-[#686C7B] hover:text-[#A1A4B2]"
              }`}
            >
              <Icon name="repeat" size={17} />
              {repeatMode === "one" ? (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#A5A9FF] text-[8px] font-black text-[#090A0F]">
                  1
                </span>
              ) : repeatMode === "all" || isRepeat ? (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#A5A9FF]" />
              ) : null}
            </button>
          </div>

          {/* Desktop Seek Bar with Timers & Buffering */}
          <div className="flex w-full items-center gap-3 text-[11px] font-medium text-[#686C7B] font-mono">
            <span className="w-9 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex flex-1 items-center group py-1.5 cursor-pointer">
              <div className="h-1 group-hover:h-1.5 w-full rounded-full bg-white/[0.08] relative transition-all overflow-hidden">
                {/* Buffered Fraction */}
                <div
                  className="absolute left-0 top-0 h-full bg-white/15 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, bufferedFraction * 100))}%` }}
                />
                {/* Current Playback */}
                <div
                  className="relative h-full bg-[#A5A9FF] rounded-full transition-all group-hover:bg-[#888EFF]"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#F5F5F7] shadow-[0_0_8px_rgba(165,169,255,0.7)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                value={currentTime}
                disabled={!hasTrack}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onSeek && onSeek(val);
                }}
                aria-label="Seek track position"
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <button
              onClick={() => {
                setShowCountdown(!showCountdown);
              }}
              title={
                showCountdown
                  ? "Click to show total duration"
                  : "Click to show remaining time"
              }
              className="w-9 text-left tabular-nums hover:text-[#A1A4B2] transition cursor-pointer"
            >
              {displayEndTime}
            </button>
          </div>
        </div>

        {/* Right: Volume Slider, Audio Studio, Sleep Timer, Lyrics, Queue Button, Expand */}
        <div className="flex items-center justify-end gap-2.5 w-[280px] lg:w-[340px]">
          {/* Custom Interactive Glass Volume Slider */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={() => {
                onToggleMute?.();
              }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-[#A1A4B2] transition hover:text-[#F5F5F7]"
            >
              <Icon
                name={isMuted || volume === 0 ? "volume-x" : "volume"}
                size={18}
              />
            </button>

            <div className="relative flex w-16 lg:w-20 items-center py-2 cursor-pointer">
              <div className="h-1 group-hover:h-1.5 w-full rounded-full bg-white/[0.08] relative transition-all">
                <div
                  className="h-full bg-[#A5A9FF] rounded-full transition-all group-hover:bg-[#888EFF] relative"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#F5F5F7] shadow-[0_0_8px_rgba(165,169,255,0.7)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onVolumeChange && onVolumeChange(val);
                }}
                aria-label="Volume slider"
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Studio & Equalizer button */}
          {onOpenAudioSettings && (
            <button
              onClick={onOpenAudioSettings}
              title="Audio Studio & Equalizer"
              aria-label="Audio Studio & Equalizer"
              className="text-[#A1A4B2] transition hover:text-[#A5A9FF] p-1.5 hover:scale-105"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}

          {/* Sleep Timer button */}
          {onOpenSleepTimer && (
            <button
              onClick={() => {
                onOpenSleepTimer();
              }}
              title={
                sleepTimerRemaining
                  ? `Sleep Timer: ${sleepTimerRemaining}m remaining`
                  : "Set Sleep Timer"
              }
              aria-label="Set Sleep Timer"
              className={`flex items-center gap-1 rounded-full p-1.5 transition hover:scale-105 ${
                sleepTimerRemaining
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/30 px-2 py-0.5 text-[10px] font-bold"
                  : "text-[#A1A4B2] hover:text-[#F5F5F7]"
              }`}
            >
              <span className="text-sm">🌙</span>
              {sleepTimerRemaining && <span>{sleepTimerRemaining}m</span>}
            </button>
          )}

          {/* Lyrics button */}
          <button
            onClick={() => {
              onToggleLyrics?.();
            }}
            title="Lyrics"
            aria-label="Toggle song lyrics"
            className="text-[#A1A4B2] transition hover:text-[#F5F5F7] p-1.5 hover:scale-105"
          >
            <Icon name="mic" size={18} />
          </button>

          {/* Right Panel / Queue Toggle with Count Badge */}
          <button
            onClick={handleQueueClick}
            title="Toggle Queue Panel"
            aria-label="Toggle Queue Panel"
            className={`relative transition p-2 rounded-xl hover:bg-white/10 hover:scale-105 ${
              isRightPanelOpen
                ? "text-[#A5A9FF] bg-[#292B4B]/60 border border-[#A5A9FF]/20"
                : "text-[#A1A4B2] hover:text-[#F5F5F7]"
            }`}
          >
            <Icon name="queue" size={18} />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A5A9FF] px-1 text-[9px] font-bold text-[#090A0F]">
                {queueCount > 9 ? "9+" : queueCount}
              </span>
            )}
          </button>

          {/* Fullscreen Expand button */}
          {onOpenVisualizer && (
            <button
              onClick={onOpenVisualizer}
              title="Expand to Fullscreen"
              aria-label="Expand to Fullscreen"
              className="text-[#A1A4B2] transition hover:text-[#F5F5F7] p-1.5 hover:scale-105"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {/* Close Player button */}
          {onClose && (
            <button
              onClick={() => {
                onClose();
              }}
              title="Close Player"
              aria-label="Close Player"
              className="text-[#686C7B] hover:text-[#F5F5F7] p-2 rounded-xl hover:bg-white/10 transition hover:scale-105 active:scale-95 ml-1"
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

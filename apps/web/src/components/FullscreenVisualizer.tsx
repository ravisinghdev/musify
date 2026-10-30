"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { AppLogo } from "./AppLogo";
import { haptics } from "../lib/haptics";
import { useTouchGestures } from "../lib/gestures";
import { TrackActionSheet } from "./TrackActionSheet";
import { Heart } from "lucide-react";

interface FullscreenVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  accentGlow?: string;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onAskAI?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function FullscreenVisualizer({
  isOpen,
  onClose,
  track,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isLiked,
  onToggleLike,
  onPlayNext,
  onAddToQueue,
  onAskAI,
  onAddToPlaylist,
}: FullscreenVisualizerProps) {
  const [imgError, setImgError] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        haptics.light();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Touch & Swipe gestures for the whole visualizer screen
  const { touchHandlers } = useTouchGestures({
    onSwipeDown: () => {
      haptics.light();
      onClose();
    },
    onSwipeLeft: () => {
      haptics.medium();
      onNext();
    },
    onSwipeRight: () => {
      haptics.medium();
      onPrev();
    },
    onDoubleTap: () => {
      haptics.success();
      onToggleLike();
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    },
    onLongPress: () => {
      haptics.heavy();
      setShowActionSheet(true);
    },
  });

  if (!isOpen || !track) return null;

  const fallbackArt = track.sourceTrackId
    ? `https://i.ytimg.com/vi/${track.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const displayArtwork = imgError ? fallbackArt : track.artworkUrl || fallbackArt;

  const effectiveDuration =
    duration || (track.durationMs ? track.durationMs / 1000 : 239);
  const progressPercent = effectiveDuration
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      {...touchHandlers}
      className="fixed inset-0 z-50 flex flex-col justify-between px-4 sm:px-8 pt-[max(env(safe-area-inset-top,0px),24px)] pb-[max(env(safe-area-inset-bottom,0px),24px)] text-white select-none animate-fade-in overflow-hidden bg-black/85 backdrop-blur-3xl h-[100dvh] max-h-screen w-screen box-border touch-pan-y"
    >
      {/* Translucent Backdrop Layer */}
      <div className="pointer-events-none absolute inset-0 bg-black/50 z-0" />

      {/* Clean Velvety Dark Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#0b0d18] via-[#07090f] to-[#040508]" />

      {/* Top Bar with Safe Spacing */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <AppLogo size="sm" showText={false} />
          <div className="flex flex-col">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[2px] text-zinc-400">
              PLAYING FROM MUSIFY
            </p>
            <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
              {track.album?.title || "Master Audio"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptics.light();
            onClose();
          }}
          aria-label="Exit fullscreen"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/15 hover:scale-105 active:scale-95"
        >
          <Icon name="close" size={18} />
        </button>
      </header>

      {/* Center: Significantly Enlarged Spinning Vinyl Disc with Smooth Sinusoidal Float */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-2 min-h-0 overflow-hidden">
        {/* Double-tap popping heart feedback */}
        {showHeartPop && (
          <div className="absolute z-30 pointer-events-none flex items-center justify-center animate-ping duration-700">
            <div className="p-5 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
              <Heart className="w-16 h-16 text-rose-500 fill-current drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
            </div>
          </div>
        )}

        {/* Vinyl Disc Container with Gentle Wave Animation */}
        <div
          className={`relative flex items-center justify-center shrink transition-transform duration-700 ${
            isPlaying ? "animate-[float-wave_6s_ease-in-out_infinite] motion-reduce:animate-none" : ""
          }`}
        >
          {/* Vinyl Disc with Grooves - Substantially Increased Size */}
          <div
            className={`relative h-60 w-60 xs:h-72 xs:w-72 sm:h-80 sm:w-80 md:h-96 md:w-96 max-h-[38vh] max-w-[38vh] aspect-square rounded-full border-[5px] sm:border-[8px] border-[#13151d] bg-[#090a0f] shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-2 ring-white/15 transition-transform cursor-pointer ${
              isPlaying ? "animate-[spin_20s_linear_infinite]" : ""
            }`}
          >
            {/* Concentric Vinyl Grooves */}
            <div className="absolute inset-4 rounded-full border border-white/[0.05]" />
            <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-12 rounded-full border border-white/[0.05]" />
            <div className="absolute inset-16 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-20 rounded-full border border-white/[0.05]" />

            {/* Vinyl Center Label with Artwork */}
            <div className="absolute inset-[28%] overflow-hidden rounded-full border-4 border-black/90 shadow-2xl">
              {displayArtwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayArtwork}
                  alt={track.title}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                  <Icon name="music" size={32} />
                </div>
              )}
              {/* Spindle hole */}
              <div className="absolute inset-0 m-auto h-5 w-5 rounded-full border-2 border-zinc-700 bg-black shadow-inner" />
            </div>
          </div>
        </div>

        {/* Dynamic Sound Frequency Visualizer */}
        <div className="mt-4 sm:mt-5 flex items-end gap-1.5 h-6 sm:h-8">
          {[
            35, 60, 45, 80, 65, 95, 50, 75, 90, 60, 40, 85, 100, 70, 55, 85, 45,
            65, 80, 50, 70, 40, 60, 30,
          ].map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full bg-gradient-to-t from-white/40 to-white transition-all duration-150 ${
                isPlaying ? "" : "opacity-30"
              }`}
              style={{
                height: isPlaying
                  ? `${Math.max(8, Math.sin(i + currentTime * 4) * 26 + height * 0.3)}px`
                  : "5px",
              }}
            />
          ))}
        </div>

        {/* Track Title, Artist, & Like */}
        <div className="mt-4 sm:mt-5 flex items-center justify-between w-full max-w-md mx-auto px-4 gap-3">
          <div
            onClick={() => {
              haptics.heavy();
              setShowActionSheet(true);
            }}
            className="min-w-0 flex-1 text-left cursor-pointer group"
          >
            <div className="overflow-hidden w-full">
              <h1
                title={track.title}
                className={`text-lg sm:text-2xl font-black tracking-tight text-white group-hover:text-indigo-300 transition ${
                  track.title.length > 22
                    ? "animate-marquee whitespace-nowrap"
                    : "truncate block"
                }`}
              >
                {track.title}
              </h1>
            </div>
            <p
              className="mt-0.5 text-xs sm:text-sm text-zinc-400 font-medium truncate"
              title={track.artists.map((a) => a.name).join(", ")}
            >
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.medium();
              onToggleLike();
            }}
            aria-label={isLiked ? "Unlike" : "Like"}
            className="text-zinc-400 hover:text-white transition p-2.5 rounded-full hover:bg-white/10 active:scale-90 shrink-0 flex items-center justify-center"
          >
            <Icon
              name={isLiked ? "heart-filled" : "heart"}
              size={24}
              className={isLiked ? "text-rose-500" : ""}
            />
          </button>
        </div>
      </div>

      {/* Floating Bottom Glass Controls */}
      <footer className="relative z-10 mx-auto w-full max-w-xl rounded-3xl border border-white/15 bg-white/[0.08] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl shrink-0">
        {/* Scrubber Bar with Timers */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span className="w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex flex-1 items-center group py-2 cursor-pointer">
            <div className="h-1.5 w-full rounded-full bg-white/20 relative">
              <div
                className="h-full bg-white rounded-full transition-all group-hover:bg-indigo-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              value={currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                haptics.tick("visualizer-seek");
                onSeek(val);
              }}
              aria-label="Seek track"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-10 text-left tabular-nums">
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Primary Controls Row */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between px-2">
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              onToggleShuffle();
            }}
            aria-label="Toggle Shuffle"
            className={`p-2 transition hover:scale-110 active:scale-95 relative ${
              isShuffle ? "text-indigo-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon name="shuffle" size={18} />
            {isShuffle && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.medium();
              onPrev();
            }}
            aria-label="Previous Track"
            className="p-2 text-zinc-300 hover:text-white transition hover:scale-110 active:scale-95"
          >
            <Icon name="skip-back" size={24} />
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.medium();
              onTogglePlay();
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 shadow-xl shadow-white/20"
          >
            <Icon name={isPlaying ? "pause" : "play"} size={24} />
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.medium();
              onNext();
            }}
            aria-label="Next Track"
            className="p-2 text-zinc-300 hover:text-white transition hover:scale-110 active:scale-95"
          >
            <Icon name="skip-forward" size={24} />
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.selection();
              onToggleRepeat();
            }}
            aria-label="Toggle Repeat"
            className={`p-2 transition hover:scale-110 active:scale-95 relative ${
              isRepeat ? "text-indigo-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon name="repeat" size={18} />
            {isRepeat && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
            )}
          </button>
        </div>
      </footer>

      {/* Track Action Sheet on Long-press */}
      {showActionSheet && (
        <TrackActionSheet
          track={track}
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onPlay={() => {
            if (!isPlaying) onTogglePlay();
          }}
          onPlayNext={(t) => onPlayNext?.(t)}
          onAddToQueue={(t) => onAddToQueue?.(t)}
          isLiked={isLiked}
          onToggleLike={() => onToggleLike()}
          onAskAI={(t) => onAskAI?.(t)}
          onAddToPlaylist={(t) => onAddToPlaylist?.(t)}
        />
      )}
    </div>
  );
}
export default FullscreenVisualizer;

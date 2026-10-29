"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { AppLogo } from "./AppLogo";

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
  accentGlow = "rgba(99, 102, 241, 0.25)",
}: FullscreenVisualizerProps) {
  const [imgError, setImgError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  // High-vibrancy glows specifically tuned for rich visibility on mobile and desktop
  const vibrantGlow = accentGlow.replace(/[\d.]+\)$/, "0.55)");
  const secondaryGlow = accentGlow.replace(/[\d.]+\)$/, "0.35)");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-6 pb-6 sm:pb-8 text-white select-none animate-fade-in overflow-hidden bg-[#07090e] h-[100dvh] max-h-screen w-screen box-border"
    >
      {/* 100% Solid Opaque Pitch-Black Base Layer - completely blocks underlying page */}
      <div className="pointer-events-none absolute inset-0 bg-[#07090e] z-0" />

      {/* Vibrant Ambient Dynamic Gradient Over Opaque Base */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 95% 65% at 50% 15%, ${vibrantGlow} 0%, transparent 75%), radial-gradient(circle at 50% 90%, ${secondaryGlow} 0%, transparent 60%)`,
        }}
      />

      {/* Explicit Mobile-Visible Ambient Glow Orbs (Centered, never clipped) */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[340px] w-[340px] sm:h-[550px] sm:w-[550px] rounded-full blur-[80px] sm:blur-[130px] transition-all duration-700 z-0"
        style={{
          background: `radial-gradient(circle, ${vibrantGlow} 0%, ${secondaryGlow} 50%, transparent 80%)`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[260px] w-[260px] sm:h-[420px] sm:w-[420px] rounded-full blur-[80px] sm:blur-[130px] transition-all duration-700 z-0"
        style={{
          background: `radial-gradient(circle, ${secondaryGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between">
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
          onClick={onClose}
          aria-label="Exit fullscreen"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:bg-white/15 hover:scale-105"
        >
          <Icon name="close" size={18} />
        </button>
      </header>

      {/* Center: Spinning Vinyl & Visualizer Bars */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-1 min-h-0 overflow-hidden">
        {/* Vinyl Disc Container */}
        <div className="relative flex items-center justify-center shrink">
          {/* Vinyl Disc with Grooves */}
          <div
            className={`relative h-28 w-28 xs:h-36 xs:w-36 sm:h-44 sm:w-44 md:h-48 md:w-48 max-h-[20vh] max-w-[20vh] aspect-square rounded-full border-[4px] sm:border-[6px] border-[#15171f] bg-[#0c0d12] shadow-[0_15px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform ${
              isPlaying ? "animate-[spin_18s_linear_infinite]" : ""
            }`}
          >
            {/* Concentric Vinyl Grooves */}
            <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-6 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-9 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-12 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-15 rounded-full border border-white/[0.04]" />

            {/* Vinyl Center Label with Artwork */}
            <div className="absolute inset-[30%] overflow-hidden rounded-full border-3 sm:border-4 border-black/80 shadow-2xl">
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
                  <Icon name="music" size={24} />
                </div>
              )}
              {/* Spindle hole */}
              <div className="absolute inset-0 m-auto h-4 w-4 rounded-full border-2 border-zinc-700 bg-black" />
            </div>
          </div>
        </div>

        {/* Dynamic 24-Bar Sound Frequency Visualizer */}
        <div className="mt-3 sm:mt-4 flex items-end gap-1.5 h-6 sm:h-7">
          {[
            35, 60, 45, 80, 65, 95, 50, 75, 90, 60, 40, 85, 100, 70, 55, 85, 45,
            65, 80, 50, 70, 40, 60, 30,
          ].map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full bg-gradient-to-t from-white/30 to-white transition-all duration-150 ${
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
        <div className="mt-2 sm:mt-3 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white max-w-[85vw] truncate">
              {track.title}
            </h1>
            <button
              onClick={onToggleLike}
              className="text-zinc-400 hover:text-white transition p-1"
            >
              <Icon
                name={isLiked ? "heart-filled" : "heart"}
                size={20}
                className={isLiked ? "text-rose-500" : ""}
              />
            </button>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-400 max-w-[85vw] truncate">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
      </div>

      {/* Floating Bottom Glass Controls - Viewport-Safe Height */}
      <footer className="relative z-10 mx-auto w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.08] p-3 sm:p-4 shadow-2xl backdrop-blur-2xl mb-2 sm:mb-4 shrink-0">
        {/* Scrubber Bar with Timers */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span className="w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex flex-1 items-center group py-1.5 cursor-pointer">
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
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-10 tabular-nums">
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="mt-3 flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={onToggleShuffle}
            aria-label="Toggle Shuffle"
            className={`transition hover:scale-110 p-2 relative ${
              isShuffle
                ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon name="shuffle" size={17} />
            {isShuffle && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={onPrev}
            aria-label="Previous Track"
            className="text-zinc-300 hover:text-white transition hover:scale-110 p-2"
          >
            <Icon name="skip-back" size={20} />
          </button>

          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-xl shadow-white/30 transition hover:scale-105 active:scale-95"
          >
            <Icon name={isPlaying ? "pause" : "play"} size={18} />
          </button>

          <button
            onClick={onNext}
            aria-label="Next Track"
            className="text-zinc-300 hover:text-white transition hover:scale-110 p-2"
          >
            <Icon name="skip-forward" size={20} />
          </button>

          <button
            onClick={onToggleRepeat}
            aria-label="Toggle Repeat"
            className={`transition hover:scale-110 p-2 relative ${
              isRepeat
                ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon name="repeat" size={17} />
            {isRepeat && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

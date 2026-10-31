"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { AppLogo } from "./AppLogo";
import { haptics } from "../lib/haptics";
import { useTouchGestures } from "../lib/gestures";
import { TrackActionSheet } from "./TrackActionSheet";
import type { EqualizerBands } from "../lib/settingsStore";
import { Heart, Disc3, Image as ImageIcon, SlidersHorizontal, ListMusic, Mic2, Moon, MoreHorizontal, Gauge } from "lucide-react";

interface FullscreenVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  bufferedFraction?: number;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  repeatMode?: "off" | "all" | "one";
  onToggleRepeat: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  accentGlow?: string;
  playbackSpeed?: number;
  onChangePlaybackSpeed?: (speed: number) => void;
  onOpenAudioSettings?: () => void;
  onOpenLyrics?: () => void;
  onOpenQueue?: () => void;
  onOpenSleepTimer?: () => void;
  sleepTimerRemaining?: number | null;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onAskAI?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  equalizerEnabled?: boolean;
  equalizerBands?: EqualizerBands;
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
  bufferedFraction = 0,
  onSeek,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  repeatMode,
  onToggleRepeat,
  isLiked,
  onToggleLike,
  playbackSpeed = 1.0,
  onChangePlaybackSpeed,
  onOpenAudioSettings,
  onOpenLyrics,
  onOpenQueue,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onPlayNext,
  onAddToQueue,
  onAskAI,
  onAddToPlaylist,
  equalizerEnabled = false,
  equalizerBands,
}: FullscreenVisualizerProps) {
  const [imgError, setImgError] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [presentationMode, setPresentationMode] = useState<"vinyl" | "cover">("vinyl");
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);

  const eqBars = React.useMemo(() => {
    const raw = [35, 60, 45, 80, 65, 95, 50, 75, 90, 60, 40, 85, 100, 70, 55, 85, 45, 65, 80, 50, 70, 40, 60, 30];
    if (!equalizerEnabled || !equalizerBands) return raw;
    const b60 = (equalizerBands as any)[60] ?? 0;
    const b230 = (equalizerBands as any)[230] ?? 0;
    const b910 = (equalizerBands as any)[910] ?? 0;
    const b3600 = (equalizerBands as any)[3600] ?? 0;
    const b14000 = (equalizerBands as any)[14000] ?? 0;
    return raw.map((val, idx) => {
      let boost = 0;
      if (idx < 5) boost = b60;
      else if (idx < 10) boost = b230;
      else if (idx < 15) boost = b910;
      else if (idx < 20) boost = b3600;
      else boost = b14000;
      const factor = 1 + boost / 24;
      return Math.max(15, Math.min(100, Math.round(val * factor)));
    });
  }, [equalizerEnabled, equalizerBands]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Touch & Swipe gestures for the whole visualizer screen
  const { touchHandlers } = useTouchGestures({
    onSwipeDown: () => {
      onClose();
    },
    onSwipeLeft: () => {
      haptics.light();
      onNext();
    },
    onSwipeRight: () => {
      haptics.light();
      onPrev();
    },
    onDoubleTap: () => {
      haptics.light();
      onToggleLike();
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    },
    onLongPress: () => {
      haptics.light();
      setShowActionSheet(true);
    },
  });

  if (!isOpen || !track) return null;

  const effectiveRepeatMode = repeatMode ?? (isRepeat ? "all" : "off");

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
      className="fixed inset-0 z-50 flex flex-col justify-between px-4 sm:px-8 pt-[max(env(safe-area-inset-top,0px),20px)] pb-[max(env(safe-area-inset-bottom,0px),20px)] text-white select-none animate-fade-in overflow-hidden bg-black/90 backdrop-blur-3xl h-[100dvh] max-h-screen w-screen box-border touch-pan-y"
    >
      {/* Translucent Backdrop Layer */}
      <div className="pointer-events-none absolute inset-0 bg-black/50 z-0" />

      {/* Clean Velvety Dark Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#12141C] via-[#090A0F] to-[#040508]" />

      {/* Dynamic Ambient Artwork Wash */}
      {displayArtwork && (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20 blur-[120px] scale-125 transition-all duration-1000"
          style={{
            backgroundImage: `url(${displayArtwork})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      )}

      {/* Top Bar with Mode Switcher & Close */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <AppLogo size="sm" showText={false} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[2px] text-[#686C7B]">
                PLAYING FROM MUSIFY
              </p>
              <span className="rounded-full border border-[#A5A9FF]/30 bg-[#292B4B]/60 px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider text-[#A5A9FF]">
                LOSSLESS MASTER
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#F5F5F7] tracking-tight">
              {track.album?.title || "Master Audio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Vinyl vs Cover */}
          <div className="flex items-center rounded-2xl border border-white/[0.08] bg-[#12141C]/60 p-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setPresentationMode("vinyl")}
              title="Vinyl Mode"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                presentationMode === "vinyl"
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/30"
                  : "text-[#A1A4B2] hover:text-white"
              }`}
            >
              <Disc3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPresentationMode("cover")}
              title="Cover Mode"
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                presentationMode === "cover"
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/30"
                  : "text-[#A1A4B2] hover:text-white"
              }`}
            >
              <ImageIcon size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            aria-label="Exit fullscreen"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#12141C]/60 text-[#A1A4B2] backdrop-blur-xl transition hover:bg-[#25283A] hover:text-[#F5F5F7] hover:scale-105 active:scale-95"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      {/* Center: Presentation Stage (Vinyl Mode or Cover Mode) */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-2 min-h-0 overflow-hidden w-full">
        {/* Double-tap popping heart feedback */}
        {showHeartPop && (
          <div className="absolute z-30 pointer-events-none flex items-center justify-center animate-ping duration-700">
            <div className="p-5 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
              <Heart className="w-16 h-16 text-rose-500 fill-current drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
            </div>
          </div>
        )}

        {presentationMode === "vinyl" ? (
          /* Vinyl Disc Container with Sinusoidal Float & Smooth Spin */
          <div
            className={`relative flex items-center justify-center shrink transition-transform duration-700 ${
              isPlaying ? "animate-[float-wave_6s_ease-in-out_infinite] motion-reduce:animate-none" : ""
            }`}
          >
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
        ) : (
          /* Cover Mode: Large High-Fidelity Album Art with Glass Border & Depth */
          <div className="relative flex items-center justify-center shrink max-h-[40vh] max-w-[40vh] w-64 xs:w-72 sm:w-80 md:w-96 aspect-square">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20 bg-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.9)] group">
              {displayArtwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayArtwork}
                  alt={track.title}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
                  <Icon name="music" size={48} />
                </div>
              )}
              {/* Subtle Glass Reflection Gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-transparent" />
            </div>
          </div>
        )}

        {/* Dynamic Sound Frequency Visualizer (Equalizer-Calibrated) */}
        <div className="mt-4 sm:mt-5 flex items-end gap-1.5 h-6 sm:h-8">
          {eqBars.map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full bg-gradient-to-t from-[#292B4B] to-[#A5A9FF] transition-all duration-150 ${
                isPlaying ? "shadow-[0_0_8px_rgba(165,169,255,0.4)]" : "opacity-30"
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
              setShowActionSheet(true);
            }}
            className="min-w-0 flex-1 text-left cursor-pointer group"
          >
            <div className="overflow-hidden w-full [mask-image:linear-gradient(to_right,black_88%,transparent)]">
              <h1
                title={track.title}
                className={`text-lg sm:text-2xl font-black tracking-tight text-[#F5F5F7] group-hover:text-[#A5A9FF] transition ${
                  track.title.length > 22
                    ? "animate-marquee whitespace-nowrap"
                    : "truncate block"
                }`}
              >
                {track.title}
              </h1>
            </div>
            <p
              className="mt-0.5 text-xs sm:text-sm text-[#A1A4B2] font-medium truncate"
              title={track.artists.map((a) => a.name).join(", ")}
            >
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.light();
              onToggleLike();
            }}
            aria-label={isLiked ? "Unlike" : "Like"}
            className="text-[#A1A4B2] hover:text-[#F5F5F7] transition p-2.5 rounded-full hover:bg-white/10 active:scale-90 shrink-0 flex items-center justify-center"
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
      <footer className="relative z-10 mx-auto w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#12141C]/90 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl shrink-0 space-y-3">
        {/* Scrubber Bar with Buffered Bar & Timers */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#686C7B]">
          <span className="w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex flex-1 items-center group py-2 cursor-pointer">
            <div className="h-1.5 w-full rounded-full bg-white/[0.08] relative overflow-hidden">
              {/* Buffered fraction bar */}
              <div
                className="absolute left-0 top-0 h-full bg-white/15 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, bufferedFraction * 100))}%` }}
              />
              {/* Played progress */}
              <div
                className="relative h-full bg-[#A5A9FF] rounded-full transition-all group-hover:bg-[#888EFF]"
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

        {/* Primary Playback Controls Row */}
        <div className="flex items-center justify-between px-2">
          {/* Shuffle Button */}
          <button
            type="button"
            onClick={() => {
              onToggleShuffle();
            }}
            aria-label="Toggle Shuffle"
            className={`p-2 transition hover:scale-110 active:scale-95 relative ${
              isShuffle ? "text-[#A5A9FF]" : "text-[#A1A4B2] hover:text-[#F5F5F7]"
            }`}
          >
            <Icon name="shuffle" size={18} />
            {isShuffle && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#A5A9FF]" />
            )}
          </button>

          {/* Previous Track */}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onPrev();
            }}
            aria-label="Previous Track"
            className="p-2 text-[#A1A4B2] hover:text-[#F5F5F7] transition hover:scale-110 active:scale-95"
          >
            <Icon name="skip-back" size={24} />
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onTogglePlay();
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F7] text-[#090A0F] transition hover:scale-105 active:scale-95 shadow-[0_0_24px_rgba(165,169,255,0.3)] hover:bg-white"
          >
            <Icon name={isPlaying ? "pause" : "play"} size={24} />
          </button>

          {/* Next Track */}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onNext();
            }}
            aria-label="Next Track"
            className="p-2 text-[#A1A4B2] hover:text-[#F5F5F7] transition hover:scale-110 active:scale-95"
          >
            <Icon name="skip-forward" size={24} />
          </button>

          {/* 3-State Repeat Button */}
          <button
            type="button"
            onClick={() => {
              onToggleRepeat();
            }}
            aria-label={`Repeat mode: ${effectiveRepeatMode}`}
            className={`p-2 transition hover:scale-110 active:scale-95 relative ${
              effectiveRepeatMode !== "off" ? "text-[#A5A9FF]" : "text-[#A1A4B2] hover:text-[#F5F5F7]"
            }`}
          >
            <Icon name="repeat" size={18} />
            {effectiveRepeatMode === "one" ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#A5A9FF] text-[8px] font-black text-[#090A0F]">
                1
              </span>
            ) : effectiveRepeatMode === "all" ? (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#A5A9FF]" />
            ) : null}
          </button>
        </div>

        {/* Secondary Studio Toolbar: Speed, Lyrics, Queue, EQ, Sleep Timer, More */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 px-1 text-[#A1A4B2]">
          {/* Speed Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedSelector(!showSpeedSelector)}
              title="Playback Speed"
              className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-mono font-bold hover:text-white hover:bg-white/5 transition"
            >
              <Gauge size={14} />
              <span>{playbackSpeed}x</span>
            </button>
            {showSpeedSelector && (
              <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-2xl border border-white/10 bg-[#12141C] p-1.5 shadow-2xl backdrop-blur-2xl z-30">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChangePlaybackSpeed?.(s);
                      setShowSpeedSelector(false);
                    }}
                    className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition ${
                      playbackSpeed === s
                        ? "bg-[#A5A9FF] text-[#090A0F]"
                        : "text-[#A1A4B2] hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lyrics Trigger */}
          {onOpenLyrics && (
            <button
              type="button"
              onClick={onOpenLyrics}
              title="View Lyrics"
              className="p-1.5 rounded-xl hover:text-white hover:bg-white/5 transition"
            >
              <Mic2 size={16} />
            </button>
          )}

          {/* Queue Trigger */}
          {onOpenQueue && (
            <button
              type="button"
              onClick={onOpenQueue}
              title="Play Queue"
              className="p-1.5 rounded-xl hover:text-white hover:bg-white/5 transition"
            >
              <ListMusic size={16} />
            </button>
          )}

          {/* Audio Studio / EQ Trigger */}
          {onOpenAudioSettings && (
            <button
              type="button"
              onClick={onOpenAudioSettings}
              title="Audio Studio & Equalizer"
              className="p-1.5 rounded-xl hover:text-[#A5A9FF] hover:bg-white/5 transition"
            >
              <SlidersHorizontal size={16} />
            </button>
          )}

          {/* Sleep Timer Trigger */}
          {onOpenSleepTimer && (
            <button
              type="button"
              onClick={onOpenSleepTimer}
              title="Sleep Timer"
              className={`p-1.5 rounded-xl transition relative ${
                sleepTimerRemaining ? "text-[#A5A9FF]" : "hover:text-white hover:bg-white/5"
              }`}
            >
              <Moon size={16} />
              {sleepTimerRemaining && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#A5A9FF] px-0.5 text-[8px] font-bold text-[#090A0F]">
                  {sleepTimerRemaining}m
                </span>
              )}
            </button>
          )}

          {/* More Action Sheet */}
          <button
            type="button"
            onClick={() => setShowActionSheet(true)}
            title="More Options"
            className="p-1.5 rounded-xl hover:text-white hover:bg-white/5 transition"
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      </footer>

      {/* Track Action Sheet on Long-press or More button */}
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

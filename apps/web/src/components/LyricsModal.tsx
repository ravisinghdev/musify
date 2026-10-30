"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  lyrics: string | null;
  isLoading: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  fontSize?: "compact" | "normal" | "large";
}

interface LyricLine {
  timeSeconds: number;
  text: string;
}

export function LyricsModal({
  isOpen,
  onClose,
  track,
  lyrics,
  isLoading,
  currentTime = 0,
  duration = 210,
  onSeek,
  fontSize = "normal",
}: LyricsModalProps) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse LRC timestamps [mm:ss.xx] or dynamically distribute plain lyrics across duration
  const parsedLyrics = useMemo<LyricLine[] | null>(() => {
    if (!lyrics) return null;
    const rawLines = lyrics.split("\n");
    const lrcResults: LyricLine[] = [];
    let hasLrcTimestamps = false;

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;
      const matches = Array.from(
        line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d+))?\]/g),
      );
      if (matches.length > 0) {
        hasLrcTimestamps = true;
        const text = line
          .replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d+))?\]/g, "")
          .trim();
        if (text) {
          for (const match of matches) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const rawFrac = match[3] || "0";
            const fraction = parseFloat(`0.${rawFrac}`);
            const timeSeconds = minutes * 60 + seconds + fraction;
            lrcResults.push({ timeSeconds, text });
          }
        }
      }
    }

    if (hasLrcTimestamps && lrcResults.length >= 2) {
      return lrcResults.sort((a, b) => a.timeSeconds - b.timeSeconds);
    }

    // Dynamic phrase-timing fallback for plain lyrics: distribute evenly across track duration
    const cleanLines = rawLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l));
    if (cleanLines.length === 0) return null;

    const totalDuration =
      (track?.durationMs ? track.durationMs / 1000 : 0) || duration || 210;
    const startSec = Math.min(8, totalDuration * 0.05);
    const endSec = Math.max(startSec + 15, totalDuration * 0.94);
    const step = (endSec - startSec) / Math.max(1, cleanLines.length);

    return cleanLines.map((text, idx) => ({
      timeSeconds: startSec + idx * step,
      text,
    }));
  }, [lyrics, track?.durationMs, duration]);

  // Identify current active line index with natural vocal attack anticipation (350ms lead)
  const activeIndex = useMemo(() => {
    if (!parsedLyrics || parsedLyrics.length === 0) return -1;
    let idx = -1;
    const vocalLeadTime = currentTime + 0.35;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (vocalLeadTime >= parsedLyrics[i].timeSeconds) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, currentTime]);

  // Smoothly scroll active line directly to container center with graceful easing
  useEffect(() => {
    if (containerRef.current && activeLineRef.current) {
      const container = containerRef.current;
      const line = activeLineRef.current;
      const targetScroll =
        line.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        line.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const fontClass =
    fontSize === "compact"
      ? "text-sm sm:text-base"
      : fontSize === "large"
      ? "text-lg sm:text-xl md:text-2xl"
      : "text-base sm:text-lg md:text-xl";

  return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const fontClass =
    fontSize === "compact"
      ? "text-sm sm:text-base"
      : fontSize === "large"
      ? "text-lg sm:text-xl md:text-2xl"
      : "text-base sm:text-lg md:text-xl";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Song lyrics"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-2xl animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[90vh] sm:h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-white/10 bg-black/70 p-5 sm:p-8 shadow-2xl backdrop-blur-3xl overflow-hidden"
      >
        {/* Soft Ambient Background Aura */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-indigo-500/15 blur-[120px]" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-3 sm:pb-4">
          <div className="min-w-0 pr-4">
            <h2 className="truncate text-base sm:text-lg font-bold text-white tracking-tight">
              {track.title}
            </h2>
            <p className="truncate text-xs text-zinc-400 mt-0.5">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {parsedLyrics && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-semibold text-indigo-300 border border-indigo-500/25">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Live Sync
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close lyrics"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        </div>

        {/* Content with Apple Music-style Soft Edge Masking */}
        <div
          ref={containerRef}
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
          className="relative z-10 mt-2 flex-1 overflow-y-auto custom-scrollbar pr-1 text-center select-none"
        >
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              <p className="text-xs text-zinc-400">Loading lyrics...</p>
            </div>
          ) : parsedLyrics && parsedLyrics.length > 0 ? (
            /* Time-synced interactive karaoke view with polite, soft, smooth transitions */
            <div className="py-36 space-y-3 sm:space-y-4">
              {parsedLyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;

                const fontClass =
    fontSize === "compact"
      ? "text-sm sm:text-base"
      : fontSize === "large"
      ? "text-lg sm:text-xl md:text-2xl"
      : "text-base sm:text-lg md:text-xl";

  return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => onSeek && onSeek(line.timeSeconds)}
                    className={`cursor-pointer rounded-2xl py-2 px-3 sm:py-2.5 sm:px-4 ${fontClass} transition-all duration-700 ease-out ${
                      isActive
                        ? "text-white font-semibold opacity-100 bg-white/[0.06] drop-shadow-[0_2px_14px_rgba(255,255,255,0.35)]"
                        : isPast
                        ? "text-zinc-500 font-normal opacity-30 hover:opacity-75 hover:text-zinc-300"
                        : "text-zinc-400 font-normal opacity-50 hover:opacity-85 hover:text-zinc-200"
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          ) : lyrics ? (
            /* Plain styled lyrics view */
            <div className="py-12 px-4 space-y-4 whitespace-pre-line font-medium leading-relaxed text-zinc-200 text-base sm:text-lg">
              {lyrics}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-zinc-500">
              <Icon name="mic" size={32} className="mb-2 opacity-40" />
              <p className="text-sm font-semibold">No lyrics available</p>
              <p className="text-xs text-zinc-600 mt-1">Lyrics for this song have not yet been indexed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

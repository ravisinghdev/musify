"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [activeFontSize, setActiveFontSize] = useState<"compact" | "normal" | "large">(fontSize);

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

    // Phrase-timing fallback for plain lyrics
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

  // Identify current active line index with 350ms lead time
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

  // Smoothly scroll active line directly to container center
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const fontClass =
    activeFontSize === "compact"
      ? "text-sm sm:text-base leading-relaxed"
      : activeFontSize === "large"
      ? "text-xl sm:text-2xl md:text-3xl leading-snug font-bold"
      : "text-base sm:text-lg md:text-xl leading-relaxed font-semibold";

  const displayArt = track.artworkUrl || (track.sourceTrackId ? `https://i.ytimg.com/vi/${track.sourceTrackId}/hqdefault.jpg` : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Song lyrics view"
      className="fixed inset-0 z-50 flex flex-col bg-[#05060b]/95 backdrop-blur-3xl animate-fade-in text-white overflow-hidden select-none pt-[max(env(safe-area-inset-top,0px),24px)] pb-[calc(100px+max(env(safe-area-inset-bottom,0px),16px))]"
    >
      {/* Dynamic Ambient Background Blur */}
      {displayArt && (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25 blur-[100px] scale-125 transition-all duration-1000"
          style={{
            backgroundImage: `url(${displayArt})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-0" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-3 border-b border-white/[0.08] max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3.5 min-w-0 pr-4">
          {displayArt && (
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-zinc-800 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayArt} alt={track.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base sm:text-lg font-bold text-white tracking-tight">
              {track.title}
            </h2>
            <p className="truncate text-xs text-zinc-400 mt-0.5">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Font Size Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveFontSize("compact")}
              className={`px-2 py-0.5 rounded-lg transition ${
                activeFontSize === "compact" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setActiveFontSize("normal")}
              className={`px-2 py-0.5 rounded-lg transition ${
                activeFontSize === "normal" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setActiveFontSize("large")}
              className={`px-2 py-0.5 rounded-lg transition ${
                activeFontSize === "large" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lyrics"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      {/* Main Lyrics Scroll View with Apple Music-Style Fading Edges */}
      <div
        ref={containerRef}
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
        className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-12 text-center max-w-3xl w-full mx-auto"
      >
        {isLoading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <p className="text-sm text-zinc-400 font-medium">Fetching real-time synced lyrics...</p>
          </div>
        ) : parsedLyrics && parsedLyrics.length > 0 ? (
          <div className="py-32 space-y-4 sm:space-y-6">
            {parsedLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={`${line.timeSeconds}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek && onSeek(line.timeSeconds)}
                  className={`group cursor-pointer transition-all duration-300 rounded-2xl px-4 py-2 ${
                    isActive
                      ? "scale-105 text-white font-extrabold drop-shadow-[0_0_24px_rgba(255,255,255,0.7)]"
                      : isPast
                      ? "text-zinc-500 opacity-60 hover:opacity-100 hover:text-zinc-200"
                      : "text-zinc-400 opacity-70 hover:opacity-100 hover:text-zinc-200"
                  }`}
                >
                  <p className={fontClass}>{line.text}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-500">
              <Icon name="mic" size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Lyrics Not Available</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              We couldn&apos;t find synchronized lyrics for &ldquo;{track.title}&rdquo;. You can still listen and control playback normally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

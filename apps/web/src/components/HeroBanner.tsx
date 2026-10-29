"use client";

import React from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

export interface HeroBannerProps {
  greeting?: string;
  title?: string;
  subtitle?: string;
  currentTrack?: Track | null;
  isPlaying?: boolean;
  onPlayHero?: () => void;
  onOpenAI?: () => void;
  backgroundImageUrl?: string;
  className?: string;
}

export function HeroBanner({
  greeting = "GOOD EVENING",
  title = "Music for a better you.",
  subtitle = "Discover new sounds, rediscover old favorites, and let the music take you further.",
  currentTrack,
  isPlaying = false,
  onPlayHero,
  onOpenAI,
  backgroundImageUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  className = "",
}: HeroBannerProps) {
  const bgImage = currentTrack?.artworkUrl || backgroundImageUrl;

  return (
    <div
      className={`relative mt-6 overflow-hidden rounded-3xl border border-white/10 p-8 shadow-2xl transition-all duration-500 lg:p-10 select-none ${className}`}
    >
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgImage}
          alt={title}
          className="h-full w-full object-cover object-center brightness-[0.4] contrast-[1.1] transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-400">
          {greeting}
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-zinc-300 sm:text-sm">
          {subtitle}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {onPlayHero && (
            <button
              onClick={onPlayHero}
              className="flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-xs font-bold text-black shadow-lg shadow-white/20 transition hover:scale-105 active:scale-95 sm:text-sm"
            >
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={16}
                className="text-black"
              />
              <span>{isPlaying ? "Pause music" : "Play something"}</span>
            </button>
          )}

          {onOpenAI && (
            <button
              onClick={onOpenAI}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95 sm:text-sm"
            >
              <Icon name="compass" size={15} className="text-indigo-400" />
              <span>✨ AI Smart Mix</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


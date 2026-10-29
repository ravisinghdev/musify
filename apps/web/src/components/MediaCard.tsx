"use client";

import React from "react";
import { Icon } from "./Icons";

export interface MediaCardProps {
  id: string;
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  badge?: string;
  isPlaying?: boolean;
  isCurrent?: boolean;
  aspectRatio?: "square" | "video";
  onClick: () => void;
  onPlay?: (e: React.MouseEvent) => void;
  className?: string;
}

export function MediaCard({
  id,
  title,
  subtitle,
  artworkUrl,
  badge,
  isPlaying = false,
  isCurrent = false,
  aspectRatio = "square",
  onClick,
  onPlay,
  className = "",
}: MediaCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const aspectClass = aspectRatio === "video" ? "aspect-[16/10]" : "aspect-square";

  const cleanId = id ? id.replace(/^yt_/, "") : "";
  const ytFallback = cleanId && cleanId.length === 11
    ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
    : undefined;
  const displayArt = imgError ? ytFallback : artworkUrl || ytFallback;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#0c0e15]/70 p-3 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#121520] hover:shadow-2xl cursor-pointer select-none ${className}`}
    >
      {/* Artwork Box */}
      <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-800 ${aspectClass}`}>
        {displayArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayArt}
            alt={title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <Icon name="music" size={32} />
          </div>
        )}

        {/* Dynamic Badge (e.g. "Playlist • 50 tracks") */}
        {badge && (
          <span className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            {badge}
          </span>
        )}

        {/* Live Equalizer if currently playing */}
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
            <div className="flex items-end gap-[3px] h-5">
              <span className="w-[3px] bg-white rounded-full equalizer-bar-1" />
              <span className="w-[3px] bg-white rounded-full equalizer-bar-2" />
              <span className="w-[3px] bg-white rounded-full equalizer-bar-3" />
              <span className="w-[3px] bg-white rounded-full equalizer-bar-4" />
            </div>
          </div>
        )}

        {/* Hover Play Button */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(e);
            }}
            aria-label={`Play ${title}`}
            className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-xl shadow-black/60 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95"
          >
            <Icon name={isCurrent && isPlaying ? "pause" : "play"} size={16} />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3 min-w-0">
        <h4 className="truncate text-xs font-bold text-white group-hover:text-white tracking-tight sm:text-sm">
          {title}
        </h4>
        {subtitle && (
          <p className="truncate text-[11px] text-zinc-400 mt-0.5 sm:text-xs">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}


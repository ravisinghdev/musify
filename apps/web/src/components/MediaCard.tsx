"use client";

import React from "react";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import { api } from "../lib/api";

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
    : "https://i.ytimg.com/vi/DlFXDl_ROAM/hqdefault.jpg";
  const displayArt = imgError ? ytFallback : artworkUrl || ytFallback;

  return (
    <div
      onClick={() => {
        onClick();
      }}
      onMouseEnter={() => {
        if (cleanId && cleanId.length === 11) {
          api.getPlayback(cleanId).catch(() => {});
        }
      }}
      className={`group relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#12141C]/80 p-3 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#A5A9FF]/30 hover:bg-[#1A1D28]/90 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] active:scale-[0.98] cursor-pointer select-none ${className}`}
    >
      {/* Artwork Box */}
      <div className={`relative w-full overflow-hidden rounded-xl bg-[#1A1D28] border border-white/[0.06] ${aspectClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayArt}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (!imgError) {
              setImgError(true);
            } else {
              (e.currentTarget as HTMLImageElement).src =
                "https://i.ytimg.com/vi/DlFXDl_ROAM/hqdefault.jpg";
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dynamic Badge (e.g. "Playlist • 50 tracks") */}
        {badge && (
          <span className="absolute top-2 left-2 rounded-full bg-[#090A0F]/80 border border-white/10 px-2.5 py-0.5 text-[9px] font-semibold text-[#A5A9FF] backdrop-blur-md">
            {badge}
          </span>
        )}

        {/* Live Equalizer if currently playing */}
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#090A0F]/65 backdrop-blur-[2px]">
            <div className="flex items-end gap-[3px] h-5">
              <span className="w-[3px] bg-[#A5A9FF] rounded-full equalizer-bar-1 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
              <span className="w-[3px] bg-[#A5A9FF] rounded-full equalizer-bar-2 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
              <span className="w-[3px] bg-[#A5A9FF] rounded-full equalizer-bar-3 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
              <span className="w-[3px] bg-[#A5A9FF] rounded-full equalizer-bar-4 shadow-[0_0_6px_rgba(165,169,255,0.8)]" />
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
            className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F7] text-[#090A0F] shadow-[0_4px_18px_rgba(165,169,255,0.4)] opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95"
          >
            <Icon name={isCurrent && isPlaying ? "pause" : "play"} size={16} />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2.5 min-w-0">
        <h4 className="line-clamp-2 text-xs font-bold text-[#F5F5F7] group-hover:text-white tracking-tight sm:text-sm leading-snug" title={title}>
          {title}
        </h4>
        {subtitle && (
          <p className="line-clamp-1 text-[11px] text-[#A1A4B2] mt-1 sm:text-xs" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}


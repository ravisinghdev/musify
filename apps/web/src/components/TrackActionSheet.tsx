"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Track } from "../types/music";
import {
  Play,
  ListPlus,
  Heart,
  Sparkles,
  Share2,
  FolderPlus,
  X,
  Disc3,
  Copy,
  Check,
} from "lucide-react";
import { haptics } from "../lib/haptics";

interface TrackActionSheetProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  onAskAI?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

export function TrackActionSheet({
  track,
  isOpen,
  onClose,
  onPlay,
  onPlayNext,
  onAddToQueue,
  isLiked,
  onToggleLike,
  onAskAI,
  onAddToPlaylist,
}: TrackActionSheetProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        haptics.light();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  const artistsText = track.artists?.map((a) => a.name).join(", ") || "";
  const durationSec = track.durationMs ? track.durationMs / 1000 : 0;

  const handleShare = async () => {
    haptics.medium();
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?track=${encodeURIComponent(track.id)}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Listen to ${track.title} by ${artistsText} on Musify`,
          url: shareUrl,
        });
        haptics.success();
        onClose();
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl || track.title);
        setCopied(true);
        haptics.success();
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard write failed
      }
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => {
          haptics.light();
          onClose();
        }}
      />

      {/* Sheet Content */}
      <div className="relative w-full sm:max-w-md bg-[#0e111a] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto overscroll-contain animate-slide-up">
        {/* Android drag handle indicator */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header track card */}
        <div className="flex items-center gap-3.5 pb-4 mb-3 border-b border-white/10">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0 shadow-md">
            {track.artworkUrl ? (
              <Image
                src={track.artworkUrl}
                alt={track.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/40">
                <Disc3 className="w-6 h-6 animate-spin-slow" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base font-semibold text-white truncate leading-tight">
              {track.title}
            </h3>
            <p className="text-xs text-white/60 truncate mt-1">
              {artistsText} {durationSec ? `• ${formatDuration(durationSec)}` : ""}
            </p>
          </div>

          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close options"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action list */}
        <div className="space-y-1">
          {/* Play Now */}
          <button
            onClick={() => {
              haptics.medium();
              onPlay(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <span className="text-sm font-medium text-white block">Play Now</span>
              <span className="text-[11px] text-white/50 block">Start playback immediately</span>
            </div>
          </button>

          {/* Play Next */}
          <button
            onClick={() => {
              haptics.success();
              onPlayNext(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-white block">Play Next</span>
              <span className="text-[11px] text-white/50 block">Queue to play right after current track</span>
            </div>
          </button>

          {/* Add to Queue */}
          <button
            onClick={() => {
              haptics.success();
              onAddToQueue(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-white block">Add to Queue</span>
              <span className="text-[11px] text-white/50 block">Append to the end of queue</span>
            </div>
          </button>

          {/* Like / Unlike */}
          <button
            onClick={() => {
              haptics.medium();
              onToggleLike(track);
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
          >
            <div className={`w-9 h-9 rounded-xl ${isLiked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
            </div>
            <div>
              <span className="text-sm font-medium text-white block">
                {isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              </span>
              <span className="text-[11px] text-white/50 block">
                {isLiked ? "Remove from your favorite music library" : "Save to your favorites"}
              </span>
            </div>
          </button>

          {/* Ask AI / Explain Song */}
          {onAskAI && (
            <button
              onClick={() => {
                haptics.medium();
                onAskAI(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-white block">Ask Musify AI</span>
                <span className="text-[11px] text-white/50 block">Explore meaning, mood & smart recommendations</span>
              </div>
            </button>
          )}

          {/* Add to Playlist */}
          {onAddToPlaylist && (
            <button
              onClick={() => {
                haptics.light();
                onAddToPlaylist(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-white block">Add to Playlist</span>
                <span className="text-[11px] text-white/50 block">Save in custom playlist collection</span>
              </div>
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-sm font-medium text-white block">
                {copied ? "Link Copied to Clipboard!" : "Share Track"}
              </span>
              <span className="text-[11px] text-white/50 block">
                {copied ? "Ready to paste anywhere" : "Send track link to friends"}
              </span>
            </div>
          </button>
        </div>

        {/* Safe padding for Android navigation bar */}
        <div className="h-4" />
      </div>
    </div>
  );
}
export default TrackActionSheet;

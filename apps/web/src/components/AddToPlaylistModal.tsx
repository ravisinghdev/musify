"use client";

import React, { useEffect } from "react";
import type { Track } from "../types/music";
import type { CustomPlaylist } from "../lib/store";
import { Icon } from "./Icons";

export interface AddToPlaylistModalProps {
  isOpen: boolean;
  track: Track | null;
  playlists: CustomPlaylist[];
  onClose: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  onCreateNewPlaylist?: () => void;
}

export function AddToPlaylistModal({
  isOpen,
  track,
  playlists,
  onClose,
  onSelectPlaylist,
  onCreateNewPlaylist,
}: AddToPlaylistModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !track) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to playlist"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            Add to Playlist
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-500 hover:text-white transition"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <p className="truncate text-xs text-zinc-400 mt-1">
          Select a playlist to add &ldquo;{track.title}&rdquo;
        </p>

        {onCreateNewPlaylist && (
          <button
            onClick={() => {
              onClose();
              onCreateNewPlaylist();
            }}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 text-left text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon name="plus" size={16} />
            </div>
            <span>Create New Playlist</span>
          </button>
        )}

        <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left text-zinc-200 transition hover:bg-white/[0.08] hover:text-white group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pl.artwork}
                alt={pl.name}
                className="h-10 w-10 rounded-xl object-cover border border-white/5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold group-hover:text-white">
                  {pl.name}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {pl.tracks.length} tracks
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


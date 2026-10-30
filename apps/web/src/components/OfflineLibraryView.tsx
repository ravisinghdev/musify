"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";
import { TrackRow } from "./TrackRow";
import { offlineStore } from "../lib/offlineStore";

export interface OfflineLibraryViewProps {
  currentTrackId?: string;
  isPlaying?: boolean;
  favoritesIds: Set<string>;
  onPlayTrack: (track: Track, queue: Track[], targetIndex?: number) => void;
  onToggleLike: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onBack: () => void;
  onShowToast?: (title: string, message?: string, type?: "success" | "info" | "heart") => void;
  className?: string;
}

export function OfflineLibraryView({
  currentTrackId,
  isPlaying,
  favoritesIds,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onBack,
  onShowToast,
  className = "",
}: OfflineLibraryViewProps) {
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOfflineTracks = async () => {
    setIsLoading(true);
    try {
      const list = await offlineStore.getAllTracks();
      setDownloadedTracks(list);
    } catch {
      setDownloadedTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineTracks();
  }, []);

  const handleRemoveDownloaded = async (track: Track) => {
    await offlineStore.removeTrack(track.id);
    setDownloadedTracks((prev) => prev.filter((t) => t.id !== track.id));
    onShowToast?.("Removed Download", `"${track.title}" removed from offline storage`, "info");
  };

  const handlePlayAll = () => {
    if (downloadedTracks.length > 0) {
      onPlayTrack(downloadedTracks[0], downloadedTracks, 0);
    }
  };

  const handleShufflePlay = () => {
    if (downloadedTracks.length > 0) {
      const shuffled = [...downloadedTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className={`space-y-8 animate-fade-in pb-24 ${className}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
          aria-label="Back"
        >
          <Icon name="chevron-left" size={18} />
        </button>

        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
          Offline Mode Ready
        </span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 shadow-lg">
              <Icon name="download" size={32} />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Downloaded Music
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300">
                {downloadedTracks.length} {downloadedTracks.length === 1 ? "track" : "tracks"} cached locally for offline playback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePlayAll}
              disabled={downloadedTracks.length === 0}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition active:scale-95 shadow-lg disabled:opacity-40"
            >
              <Icon name="play" size={14} />
              <span>Play All</span>
            </button>
            <button
              onClick={handleShufflePlay}
              disabled={downloadedTracks.length === 0}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition active:scale-95 disabled:opacity-40"
            >
              <Icon name="shuffle" size={14} />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-white/[0.03] border border-white/5"
              />
            ))}
          </div>
        ) : downloadedTracks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-white/5 text-zinc-500">
              <Icon name="download" size={24} />
            </div>
            <h3 className="text-base font-bold text-white">No downloaded songs yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Click the download icon on any song or playlist to save it for listening offline without internet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 backdrop-blur-xl">
            {downloadedTracks.map((track, idx) => (
              <div key={track.id} className="flex items-center">
                <span className="w-8 text-center text-xs font-mono font-semibold text-zinc-500 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={idx}
                    isCurrent={isPlaying && currentTrackId === track.id}
                    isLiked={favoritesIds.has(track.id)}
                    onPlay={() => onPlayTrack(track, downloadedTracks, idx)}
                    onToggleLike={() => onToggleLike(track)}
                    onAddToPlaylist={() => onAddToPlaylist(track)}
                    onRemove={() => handleRemoveDownloaded(track)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


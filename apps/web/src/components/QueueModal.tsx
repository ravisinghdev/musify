"use client";

import React, { useEffect, useMemo } from "react";
import type { Track } from "../types/music";
import { Icon } from "./Icons";

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex?: number;
  onPlayTrack: (track: Track, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onMoveQueueItem: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
}

function formatDuration(ms?: number): string {
  if (!ms) return "3:30";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function QueueModal({
  isOpen,
  onClose,
  currentTrack,
  queue,
  queueIndex,
  onPlayTrack,
  onRemoveFromQueue,
  onMoveQueueItem,
  onClearQueue,
}: QueueModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Keep track of each item's actual original index in the source queue
  const upcomingItems = useMemo(() => {
    const list: { track: Track; originalIndex: number }[] = [];
    queue.forEach((track, idx) => {
      if (queueIndex !== undefined && queueIndex >= 0) {
        if (idx !== queueIndex) {
          list.push({ track, originalIndex: idx });
        }
      } else if (!currentTrack || track.id !== currentTrack.id) {
        list.push({ track, originalIndex: idx });
      }
    });
    return list;
  }, [queue, currentTrack, queueIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Play queue"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-[#0d1017]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-7"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon name="queue" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Play Queue</h2>
              <p className="text-xs text-zinc-400">
                {upcomingItems.length} song{upcomingItems.length === 1 ? "" : "s"} up next
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {upcomingItems.length > 0 && (
              <button
                onClick={onClearQueue}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition"
              >
                Clear Queue
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close queue"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Content: Currently Playing + Up Next */}
        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {/* Now Playing Section */}
          {currentTrack && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500 mb-2">
                Now Playing
              </p>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                    {currentTrack.artworkUrl || currentTrack.sourceTrackId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          currentTrack.artworkUrl ||
                          `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`
                        }
                        alt={currentTrack.title}
                        onError={(e) => {
                          if (currentTrack.sourceTrackId) {
                            (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`;
                          }
                        }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <Icon name="music" size={18} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="flex items-end gap-[2px] h-3.5">
                        <span className="w-[2.5px] bg-white rounded-full equalizer-bar-1" />
                        <span className="w-[2.5px] bg-white rounded-full equalizer-bar-2" />
                        <span className="w-[2.5px] bg-white rounded-full equalizer-bar-3" />
                        <span className="w-[2.5px] bg-white rounded-full equalizer-bar-4" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {currentTrack.title}
                    </p>
                    <p className="truncate text-xs text-indigo-200/80">
                      {currentTrack.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-400">
                  {formatDuration(currentTrack.durationMs)}
                </span>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500 mb-2">
              Next in Queue
            </p>

            {upcomingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                <Icon name="queue" size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Queue is empty</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Add tracks using the &ldquo;+&rdquo; button or play a playlist.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcomingItems.map((item, displayIdx) => (
                  <div
                    key={`${item.track.id}-${item.originalIndex}`}
                    className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.06] select-none"
                  >
                    <div
                      onClick={() => onPlayTrack(item.track, item.originalIndex)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-white">
                        {displayIdx + 1}
                      </span>

                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-zinc-800">
                        {item.track.artworkUrl || item.track.sourceTrackId ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.track.artworkUrl ||
                              `https://i.ytimg.com/vi/${item.track.sourceTrackId}/hqdefault.jpg`
                            }
                            alt={item.track.title}
                            onError={(e) => {
                              if (item.track.sourceTrackId) {
                                (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${item.track.sourceTrackId}/hqdefault.jpg`;
                              }
                            }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-500">
                            <Icon name="music" size={14} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-200 group-hover:text-white">
                          {item.track.title}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500">
                          {item.track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reorder Buttons */}
                      {displayIdx > 0 && (
                        <button
                          onClick={() =>
                            onMoveQueueItem(
                              item.originalIndex,
                              upcomingItems[displayIdx - 1].originalIndex,
                            )
                          }
                          title="Move up"
                          className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        </button>
                      )}
                      {displayIdx < upcomingItems.length - 1 && (
                        <button
                          onClick={() =>
                            onMoveQueueItem(
                              item.originalIndex,
                              upcomingItems[displayIdx + 1].originalIndex,
                            )
                          }
                          title="Move down"
                          className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                      )}

                      <span className="w-12 text-right text-xs font-mono text-zinc-500 tabular-nums">
                        {formatDuration(item.track.durationMs)}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFromQueue(item.originalIndex)}
                        title="Remove from queue"
                        className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition ml-1"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

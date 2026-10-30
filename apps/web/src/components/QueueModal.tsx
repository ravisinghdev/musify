"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Track, AISuggestionItem } from "../types/music";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import { TrackActionSheet } from "./TrackActionSheet";

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
  aiSuggestions?: AISuggestionItem[];
  isLoadingAISuggestions?: boolean;
  onAddTrackToQueue?: (track: Track) => void;
  onAddAllAIToQueue?: () => void;
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
  aiSuggestions = [],
  isLoadingAISuggestions = false,
  onAddTrackToQueue,
  onAddAllAIToQueue,
}: QueueModalProps) {
  const [showAISection, setShowAISection] = useState(true);
  const [draggedOriginalIndex, setDraggedOriginalIndex] = useState<number | null>(null);
  const [dragOverOriginalIndex, setDragOverOriginalIndex] = useState<number | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [selectedActionTrack, setSelectedActionTrack] = useState<Track | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Keep track of each upcoming item's actual original index in the source queue
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

  const handleAddWithFeedback = (track: Track) => {
    if (!onAddTrackToQueue) return;
    onAddTrackToQueue(track);
    setRecentlyAddedIds((prev) => new Set(prev).add(track.id));
    setTimeout(() => {
      setRecentlyAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }, 1800);
  };

  const handleAddAllWithFeedback = () => {
    if (!onAddAllAIToQueue) return;
    onAddAllAIToQueue();
    const allIds = new Set(aiSuggestions.map((s) => s.track.id));
    setRecentlyAddedIds(allIds);
    setTimeout(() => {
      setRecentlyAddedIds(new Set());
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Play queue"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
    >
      {/* Background ambient lighting reflection */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] sm:max-h-[85vh] w-full max-w-xl flex-col rounded-t-[32px] sm:rounded-[28px] border border-white/[0.08] bg-[#090b11]/95 sm:bg-[#090b11]/90 p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all duration-300 pb-[max(env(safe-area-inset-bottom,0px),20px)]"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden -mt-2 pb-3 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Queue Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-white shadow-sm">
              <Icon name="queue" size={17} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                Play Queue
              </h2>
              <p className="text-xs text-zinc-400">
                {upcomingItems.length} {upcomingItems.length === 1 ? "track" : "tracks"} up next
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {upcomingItems.length > 0 && (
              <button
                onClick={() => {
                  haptics.warning();
                  onClearQueue();
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition active:scale-95"
              >
                Clear Queue
              </button>
            )}
            <button
              onClick={() => {
                haptics.light();
                onClose();
              }}
              aria-label="Close queue"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 space-y-5">
          {/* Section: Currently Playing Track */}
          {currentTrack && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500 mb-2 px-1">
                Now Playing
              </p>
              <div className="group relative flex items-center justify-between gap-3 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent p-3 shadow-inner backdrop-blur-xl">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-zinc-900 shadow-md">
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
                            (e.currentTarget as HTMLImageElement).src =
                              `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`;
                          }
                        }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <Icon name="music" size={18} />
                      </div>
                    )}
                    {/* Animated Equalizer Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
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
                    <p className="truncate text-xs text-purple-200/80 mt-0.5">
                      {currentTrack.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-400 tabular-nums shrink-0">
                  {formatDuration(currentTrack.durationMs)}
                </span>
              </div>
            </div>
          )}

          {/* Section: Upcoming Tracks */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500">
                Up Next
              </p>
              {upcomingItems.length > 0 && (
                <span className="text-[11px] text-zinc-500">
                  Drag to reorder
                </span>
              )}
            </div>

            {upcomingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600 mb-2">
                  <Icon name="queue" size={24} />
                </div>
                <p className="text-sm font-medium text-zinc-400">Queue is empty</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Add tracks from search, your favorites, or the AI recommendations below.
                </p>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-white/[0.06]">
                {upcomingItems.map((item, displayIdx) => {
                  const isDragging = draggedOriginalIndex === item.originalIndex;
                  const isDragOver = dragOverOriginalIndex === item.originalIndex;

                  return (
                    <div
                      key={`${item.track.id}-${item.originalIndex}`}
                      draggable
                      onDragStart={(e) => {
                        haptics.light();
                        e.dataTransfer.setData("text/plain", String(item.originalIndex));
                        setDraggedOriginalIndex(item.originalIndex);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverOriginalIndex !== item.originalIndex) {
                          setDragOverOriginalIndex(item.originalIndex);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverOriginalIndex === item.originalIndex) {
                          setDragOverOriginalIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIdx = Number(e.dataTransfer.getData("text/plain"));
                        if (!isNaN(fromIdx) && fromIdx !== item.originalIndex) {
                          haptics.medium();
                          onMoveQueueItem(fromIdx, item.originalIndex);
                        }
                        setDraggedOriginalIndex(null);
                        setDragOverOriginalIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedOriginalIndex(null);
                        setDragOverOriginalIndex(null);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        haptics.heavy();
                        setSelectedActionTrack(item.track);
                      }}
                      className={`group flex items-center justify-between gap-3 rounded-2xl p-2.5 transition-all select-none border-b border-white/[0.06] last:border-b-0 ${
                        isDragOver
                          ? "border-purple-500/60 bg-purple-500/10 scale-[1.01]"
                          : isDragging
                            ? "opacity-40 border-white/10 bg-white/[0.02]"
                            : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        onClick={() => {
                          haptics.medium();
                          onPlayTrack(item.track, item.originalIndex);
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        {/* Numbering */}
                        <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:text-zinc-300">
                          {displayIdx + 1 < 10 ? `0${displayIdx + 1}` : displayIdx + 1}
                        </span>

                        {/* Track Artwork */}
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm">
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
                                  (e.currentTarget as HTMLImageElement).src =
                                    `https://i.ytimg.com/vi/${item.track.sourceTrackId}/hqdefault.jpg`;
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

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white">
                            {item.track.title}
                          </p>
                          <p className="truncate text-[11px] text-zinc-400 mt-0.5">
                            {item.track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                      </div>

                      {/* Right Actions & Duration */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick Up/Down Move on mobile/touch */}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition sm:flex">
                          {displayIdx > 0 && (
                            <button
                              onClick={() => {
                                haptics.selection();
                                onMoveQueueItem(
                                  item.originalIndex,
                                  upcomingItems[displayIdx - 1].originalIndex,
                                );
                              }}
                              title="Move Up"
                              className="p-1 text-zinc-500 hover:text-white transition active:scale-90"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="m18 15-6-6-6 6" />
                              </svg>
                            </button>
                          )}
                          {displayIdx < upcomingItems.length - 1 && (
                            <button
                              onClick={() => {
                                haptics.selection();
                                onMoveQueueItem(
                                  item.originalIndex,
                                  upcomingItems[displayIdx + 1].originalIndex,
                                );
                              }}
                              title="Move Down"
                              className="p-1 text-zinc-500 hover:text-white transition active:scale-90"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Duration */}
                        <span className="w-11 text-right text-xs font-mono text-zinc-500 tabular-nums">
                          {formatDuration(item.track.durationMs)}
                        </span>

                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            haptics.light();
                            onRemoveFromQueue(item.originalIndex);
                          }}
                          title="Remove from queue"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-90 opacity-80 sm:opacity-0 group-hover:opacity-100"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: AI DJ Recommendations */}
          <div className="pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[1.5px] text-purple-300">
                  <Icon name="sparkles" size={14} className="text-purple-400" />
                  AI DJ Recommendations
                </span>
                {aiSuggestions.length > 0 && (
                  <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.2 text-[9px] font-bold">
                    {aiSuggestions.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {aiSuggestions.length > 0 && onAddAllAIToQueue && showAISection && (
                  <button
                    onClick={handleAddAllWithFeedback}
                    className="rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 px-3 py-1 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1"
                  >
                    <span>+ Add all</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAISection(!showAISection)}
                  className="text-xs text-zinc-400 hover:text-white transition px-2 py-1"
                >
                  {showAISection ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {showAISection && (
              <div>
                {isLoadingAISuggestions ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={`ai-skeleton-${n}`}
                        className="flex items-center justify-between gap-3 rounded-2xl p-2.5 bg-white/[0.02] border border-white/[0.04] animate-pulse"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-white/5" />
                          <div className="space-y-1.5 flex-1 max-w-[200px]">
                            <div className="h-3 rounded bg-white/10 w-3/4" />
                            <div className="h-2 rounded bg-white/5 w-1/2" />
                          </div>
                        </div>
                        <div className="h-7 w-7 rounded-lg bg-white/5" />
                      </div>
                    ))}
                  </div>
                ) : aiSuggestions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-3 text-center">
                    No recommendations available right now.
                  </p>
                ) : (
                  <div className="space-y-1.5 divide-y divide-white/[0.06] max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {aiSuggestions.map((item, idx) => {
                      const isAdded = recentlyAddedIds.has(item.track.id);

                      return (
                        <div
                          key={`queue-ai-${item.track.id}-${idx}`}
                          className="group flex items-center justify-between gap-3 rounded-2xl p-2.5 transition-all bg-white/[0.02] hover:bg-white/[0.05] border-b border-white/[0.06] last:border-b-0"
                        >
                          <div
                            onClick={() => {
                              onPlayTrack(item.track, -1);
                              onClose();
                            }}
                            className="flex min-w-0 items-center gap-3 flex-1 cursor-pointer"
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm">
                              {item.track.artworkUrl || item.track.sourceTrackId ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    item.track.artworkUrl ||
                                    `https://i.ytimg.com/vi/${(item.track.sourceTrackId || item.track.id).replace(/^yt_/, "")}/hqdefault.jpg`
                                  }
                                  alt={item.track.title}
                                  onError={(e) => {
                                    const cleanId = (
                                      item.track.sourceTrackId ||
                                      item.track.id ||
                                      ""
                                    ).replace(/^yt_/, "");
                                    (e.currentTarget as HTMLImageElement).src =
                                      cleanId
                                        ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
                                        : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60";
                                  }}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                  <Icon name="music" size={14} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white">
                                {item.track.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="truncate text-[11px] text-zinc-400">
                                  {item.track.artists.map((a) => a.name).join(", ")}
                                </span>
                                <span className="shrink-0 text-[9px] font-semibold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/25">
                                  {item.badge || item.reason || "Vibe Harmony"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {onAddTrackToQueue && (
                            <button
                              onClick={() => handleAddWithFeedback(item.track)}
                              title={isAdded ? "Added to queue" : "Add to queue"}
                              aria-label="Add to queue"
                              disabled={isAdded}
                              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 shrink-0 ${
                                isAdded
                                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                  : "bg-white/[0.04] border-white/10 text-zinc-400 hover:bg-purple-600 hover:text-white hover:border-purple-500 shadow-sm"
                              }`}
                            >
                              {isAdded ? (
                                <Icon name="check" size={14} />
                              ) : (
                                <Icon name="plus" size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Track Action Sheet on long-press */}
      {selectedActionTrack && (
        <TrackActionSheet
          track={selectedActionTrack}
          isOpen={Boolean(selectedActionTrack)}
          onClose={() => setSelectedActionTrack(null)}
          onPlay={(t) => {
            onPlayTrack(t, -1);
            onClose();
          }}
          onPlayNext={(t) => {
            onAddTrackToQueue?.(t);
          }}
          onAddToQueue={(t) => {
            onAddTrackToQueue?.(t);
          }}
          isLiked={false}
          onToggleLike={() => {
            haptics.medium();
          }}
        />
      )}
    </div>
  );
}

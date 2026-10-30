"use client";

import React, { useState } from "react";
import type { Track, AISuggestionItem } from "../types/music";
import { Icon } from "./Icons";

interface NowPlayingPanelProps {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onPlayTrack: (track: Track, index?: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
  onClose?: () => void;
  onExpandVisualizer?: () => void;
  onOpenQueueModal?: () => void;
  aiSuggestions?: AISuggestionItem[];
  isLoadingAISuggestions?: boolean;
  onAddTrackToQueue?: (track: Track) => void;
  onAddAllAIToQueue?: () => void;
  activeMood?: string;
  onMoodChange?: (mood: string) => void;
  sleepTimerRemaining?: number | null;
  onOpenSleepTimer?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function getHighResArtworkUrl(url?: string, videoId?: string): string {
  if (!url) {
    if (videoId) {
      const clean = videoId.replace(/^yt_/, "");
      return `https://i.ytimg.com/vi/${clean}/hqdefault.jpg`;
    }
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60";
  }
  // Upgrade Google user content dimension parameters safely to w544 (official YouTube Music size)
  let clean = url.replace(/=w\d+-h\d+.*$/, "=w544-h544-l90-rj");
  // Upgrade YouTube i.ytimg.com default.jpg to hqdefault.jpg
  clean = clean.replace("/default.jpg", "/hqdefault.jpg");
  return clean;
}

export function NowPlayingPanel({
  currentTrack,
  queue,
  queueIndex,
  isLiked = false,
  onToggleLike,
  onPlayTrack,
  isPlaying = false,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  onSeek,
  onNext,
  onPrev,
  isShuffle = false,
  onToggleShuffle,
  isRepeat = false,
  onToggleRepeat,
  onExpandVisualizer,
  onOpenQueueModal,
  aiSuggestions = [],
  isLoadingAISuggestions = false,
  onAddTrackToQueue,
  onAddAllAIToQueue,
  activeMood = "smart",
  onMoodChange,
  sleepTimerRemaining,
  onOpenSleepTimer,
}: NowPlayingPanelProps) {
  const [imgError, setImgError] = React.useState(false);
  const [panelTab, setPanelTab] = useState<"queue" | "ai">("queue");
  const [mediaMode, setMediaMode] = useState<"audio" | "video">("audio");

  const hasTrack = Boolean(currentTrack);
  const trackTitle = currentTrack?.title || "No Track Selected";
  const artistsText =
    currentTrack?.artists && currentTrack.artists.length > 0
      ? currentTrack.artists.map((a) => a.name).join(", ")
      : "Select any song to start listening";

  const fallbackArt = currentTrack?.sourceTrackId
    ? `https://i.ytimg.com/vi/${currentTrack.sourceTrackId}/hqdefault.jpg`
    : undefined;
  const rawArt = imgError
    ? fallbackArt
    : currentTrack?.artworkUrl || fallbackArt;
  const artworkUrl = getHighResArtworkUrl(rawArt);

  const upNextItems = React.useMemo(() => {
    if (!queue || queue.length === 0) return [];
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
    return list.slice(0, 5);
  }, [queue, currentTrack, queueIndex]);

  const effectiveDuration = hasTrack
    ? duration ||
      (currentTrack?.durationMs ? currentTrack.durationMs / 1000 : 0)
    : 0;
  const progressPercent = effectiveDuration
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  return (
    <aside className="hidden w-[340px] shrink-0 h-ful overflow-y-auto custom-scrollbar border-l border-white/8 p-5 backdrop-blur-2xl xl:flex xl:flex-col select-none">
      {/* Audio / Video Switcher Pill */}
      {hasTrack && currentTrack?.sourceTrackId && (
        <div className="mb-3 flex items-center justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5 backdrop-blur-xl">
            <button
              onClick={() => setMediaMode("audio")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                mediaMode === "audio"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon name="music" size={12} />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setMediaMode("video")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                mediaMode === "video"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon name="play" size={12} />
              <span>Video</span>
            </button>
          </div>
        </div>
      )}

      {/* Big Square Artwork / Video Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {mediaMode === "video" && currentTrack?.sourceTrackId ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentTrack.sourceTrackId}?autoplay=1&modestbranding=1&playsinline=1`}
            title={trackTitle}
            className="h-full w-full rounded-2xl"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artworkUrl}
            alt={trackTitle}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-zinc-900">
            <Icon name="music" size={48} />
          </div>
        )}

        {hasTrack && mediaMode === "audio" && (
          <button
            onClick={onExpandVisualizer}
            aria-label="Expand artwork into visualizer"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 hover:scale-105"
          >
            <Icon name="maximize" size={13} />
          </button>
        )}
      </div>

      {/* Track Title, Artist, & Like Button */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white tracking-tight">
            {trackTitle}
          </h3>
          <p className="truncate text-xs text-zinc-400 mt-0.5">{artistsText}</p>
        </div>

        {hasTrack && (
          <button
            onClick={onToggleLike}
            aria-label={isLiked ? "Unlike" : "Like"}
            className="text-zinc-400 transition hover:text-white p-1"
          >
            <Icon
              name={isLiked ? "heart-filled" : "heart"}
              size={20}
              className={isLiked ? "text-rose-500" : ""}
            />
          </button>
        )}
      </div>

      {/* Seek Bar & Timers */}
      <div className="mt-5 space-y-1.5">
        <div className="relative flex items-center group">
          <div className="h-1 w-full rounded-full bg-white/10 relative overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            value={currentTime}
            onChange={(e) => onSeek && onSeek(Number(e.target.value))}
            aria-label="Seek track in right panel"
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Playback Controls Row */}
      <div className="mt-3 flex items-center justify-between px-2">
        <button
          onClick={onToggleShuffle}
          disabled={!hasTrack}
          aria-label="Toggle Shuffle"
          className={`transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
            isShuffle
              ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Icon name="shuffle" size={16} />
          {isShuffle && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
          )}
        </button>

        <button
          onClick={onPrev}
          disabled={!hasTrack}
          aria-label="Previous track"
          className="text-zinc-400 transition hover:text-white hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="skip-back" size={20} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={!hasTrack}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/20 transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name={isPlaying ? "pause" : "play"} size={17} />
        </button>

        <button
          onClick={onNext}
          disabled={!hasTrack}
          aria-label="Next track"
          className="text-zinc-400 transition hover:text-white hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="skip-forward" size={20} />
        </button>

        <button
          onClick={onToggleRepeat}
          disabled={!hasTrack}
          aria-label="Toggle Repeat / Loop"
          className={`transition hover:scale-110 p-1 relative disabled:opacity-40 disabled:cursor-not-allowed ${
            isRepeat
              ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Icon name="repeat" size={16} />
          {isRepeat && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
          )}
        </button>
      </div>

      {/* Up Next & AI Queue Section */}
      <div className="mt-6 flex-1 min-h-0 flex flex-col">
        {/* Tab Controls */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelTab("queue")}
              className={`text-xs font-semibold uppercase tracking-[1px] transition ${
                panelTab === "queue"
                  ? "text-white border-b-2 border-indigo-400 pb-0.5"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Up Next ({upNextItems.length})
            </button>
            <button
              onClick={() => setPanelTab("ai")}
              className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[1px] transition ${
                panelTab === "ai"
                  ? "text-indigo-300 border-b-2 border-indigo-400 pb-0.5"
                  : "text-zinc-500 hover:text-indigo-400"
              }`}
            >
              <span>✨ AI DJ</span>
              {aiSuggestions.length > 0 && (
                <span className="flex h-4 min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-indigo-300">
                  {aiSuggestions.length}
                </span>
              )}
            </button>
          </div>

          {panelTab === "queue" ? (
            <div className="flex items-center gap-2">
              {onOpenSleepTimer && (
                <button
                  onClick={onOpenSleepTimer}
                  title={
                    sleepTimerRemaining
                      ? `Sleep Timer: ${sleepTimerRemaining}m remaining`
                      : "Sleep Timer"
                  }
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                    sleepTimerRemaining
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <span>🌙</span>
                  {sleepTimerRemaining && <span>{sleepTimerRemaining}m</span>}
                </button>
              )}
              <span
                onClick={onOpenQueueModal}
                className="text-[11px] font-medium text-zinc-500 hover:text-white transition cursor-pointer"
              >
                See all
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onOpenSleepTimer && (
                <button
                  onClick={onOpenSleepTimer}
                  title={
                    sleepTimerRemaining
                      ? `Sleep Timer: ${sleepTimerRemaining}m remaining`
                      : "Sleep Timer"
                  }
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                    sleepTimerRemaining
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <span>🌙</span>
                  {sleepTimerRemaining && <span>{sleepTimerRemaining}m</span>}
                </button>
              )}
              {onAddAllAIToQueue && aiSuggestions.length > 0 && (
                <button
                  onClick={onAddAllAIToQueue}
                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition hover:underline"
                >
                  + Add all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        {panelTab === "queue" ? (
          <div className="mt-3 space-y-1 flex-1 min-h-0 custom-scrollbar pr-1">
            {upNextItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                <Icon name="queue" size={24} className="mb-2 opacity-40" />
                <p className="text-xs">Queue is empty</p>
                <button
                  onClick={() => setPanelTab("ai")}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  ✨ View AI Recommendations
                </button>
              </div>
            ) : (
              upNextItems.map((item) => (
                <div
                  key={`${item.track.id}-${item.originalIndex}`}
                  onClick={() => onPlayTrack(item.track, item.originalIndex)}
                  className="group flex items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-white/[0.05] cursor-pointer"
                >
                  <div className="flex min-w-0 items-center gap-3 flex-1">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/5 bg-zinc-800">
                      {item.track.artworkUrl || item.track.sourceTrackId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getHighResArtworkUrl(item.track.artworkUrl, item.track.sourceTrackId || item.track.id)}
                          alt={item.track.title}
                          onError={(e) => {
                            const cleanId = (item.track.sourceTrackId || item.track.id || "").replace(/^yt_/, "");
                            (e.currentTarget as HTMLImageElement).src = cleanId
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
                      <p className="truncate text-xs font-semibold text-zinc-200 group-hover:text-white">
                        {item.track.title}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {item.track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <button
                    aria-label="Options"
                    className="text-zinc-600 transition hover:text-zinc-300 p-1"
                  >
                    <Icon name="more" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ✨ AI Recommendations View */
          <div className="mt-2.5 flex-1 min-h-0 flex flex-col">
            {/* Quick Mood Selector Pills */}
            <div className="flex items-center gap-1.5 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: "smart", label: "⚡ Flow", title: "Balanced smart flow" },
                {
                  id: "chill",
                  label: "🌙 Chill",
                  title: "Lo-Fi, acoustic & ambient",
                },
                {
                  id: "energy",
                  label: "🚀 Energy",
                  title: "Upbeat high tempo",
                },
                {
                  id: "discover",
                  label: "🔍 Discover",
                  title: "Fresh sounds & deep cuts",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMoodChange?.(m.id)}
                  title={m.title}
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                    activeMood === m.id
                      ? "bg-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 flex-1 min-h-0 custom-scrollbar pr-1">
              {isLoadingAISuggestions ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  <p className="text-xs text-zinc-400">
                    ✨ Gemini predicting next songs...
                  </p>
                </div>
              ) : aiSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <span className="text-2xl mb-1">✨</span>
                  <p className="text-xs">
                    Play any song to trigger AI next track predictions
                  </p>
                </div>
              ) : (
                aiSuggestions.map((item, idx) => (
                  <div
                    key={`ai-${item.track.id}-${idx}`}
                    className="group relative flex flex-col gap-1 rounded-xl p-2 transition bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => onPlayTrack(item.track)}
                        className="flex min-w-0 items-center gap-2.5 flex-1 cursor-pointer"
                      >
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800">
                          {item.track.artworkUrl || item.track.sourceTrackId ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getHighResArtworkUrl(item.track.artworkUrl, item.track.sourceTrackId || item.track.id)}
                              alt={item.track.title}
                              onError={(e) => {
                                const cleanId = (item.track.sourceTrackId || item.track.id || "").replace(/^yt_/, "");
                                (e.currentTarget as HTMLImageElement).src = cleanId
                                  ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
                                  : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60";
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-600">
                              <Icon name="music" size={12} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                            {item.track.title}
                          </p>
                          <p className="truncate text-[10px] text-zinc-400">
                            {item.track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onAddTrackToQueue && (
                          <button
                            onClick={() => onAddTrackToQueue(item.track)}
                            title="Add to Up Next Queue"
                            aria-label="Add track to queue"
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-indigo-500 hover:text-white transition"
                          >
                            <span className="text-sm leading-none">+</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI reason & badge */}
                    <div className="flex items-center justify-between gap-2 pt-0.5 px-0.5">
                      <span className="truncate text-[10px] text-zinc-400 italic">
                        {item.reason}
                      </span>
                      <span className="shrink-0 text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

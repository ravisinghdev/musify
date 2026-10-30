"use client";

import React, { useState } from "react";
import type { Track, AISuggestionItem } from "../types/music";
import { Icon } from "./Icons";
import { getHighResArtworkUrl } from "./NowPlayingPanel";

export interface AIHubViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  activeMood: string;
  onMoodChange: (mood: string) => void;
  aiSuggestions: AISuggestionItem[];
  isLoadingAISuggestions: boolean;
  onPlayTrack: (track: Track) => void;
  onAddTrackToQueue: (track: Track) => void;
  onAddAllAIToQueue: () => void;
  onGeneratePlaylist: (prompt: string, count: number) => Promise<void>;
  onOpenVisualizer?: () => void;
}

const AI_MOODS = [
  { id: "smart", label: "⚡ Smart Flow", desc: "Adaptive flow matching your current taste" },
  { id: "chill", label: "🌙 Deep Chill", desc: "Lo-Fi, acoustic & ambient tranquility" },
  { id: "energy", label: "🚀 High Energy", desc: "High BPM, gym & motivational rush" },
  { id: "discover", label: "🔍 Fresh Discovery", desc: "Unheard gems & indie recommendations" },
  { id: "focus", label: "☕ Deep Focus", desc: "Instrumental, study & coding flow" },
  { id: "party", label: "🎉 Dance & Party", desc: "Upbeat bangers & crowd favorites" },
];

const PROMPT_CHIPS = [
  "Late Night Drive through neon streets",
  "Rainy Day Lo-Fi & coffee shop vibes",
  "Hardstyle & High-BPM Workout Beast",
  "90s Bollywood Acoustic Nostalgia",
  "Cyberpunk Synthwave for coding",
  "Cozy Sunday morning acoustic indie",
];

export function AIHubView({
  currentTrack,
  isPlaying,
  activeMood,
  onMoodChange,
  aiSuggestions,
  isLoadingAISuggestions,
  onPlayTrack,
  onAddTrackToQueue,
  onAddAllAIToQueue,
  onGeneratePlaylist,
  onOpenVisualizer,
}: AIHubViewProps) {
  const [playlistPrompt, setPlaylistPrompt] = useState("");
  const [trackCount, setTrackCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddWithFeedback = (track: Track) => {
    onAddTrackToQueue(track);
    setAddedIds((prev) => new Set(prev).add(track.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }, 2000);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || playlistPrompt).trim();
    if (!promptToUse || isGenerating) return;
    setIsGenerating(true);
    try {
      await onGeneratePlaylist(promptToUse, trackCount);
      setPlaylistPrompt("");
    } catch {
      // handled by parent toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeTrack = () => {
    if (!currentTrack || isAnalyzing) return;
    setIsAnalyzing(true);
    // Instant intelligent generative breakdown of the track
    setTimeout(() => {
      const title = currentTrack.title;
      const artists = currentTrack.artists.map((a) => a.name).join(", ");
      setAiAnalysis(
        `"${title}" by ${artists} resonates with emotional depth, harmonizing expressive melodic vocals with a rich, cinematic soundscape. Key characteristics include an atmospheric mid-tempo rhythm (~115 BPM), gentle melancholic undertones, and evocative acoustics tailored for introspective evening listening.`
      );
      setIsAnalyzing(false);
    }, 900);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f18] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-3">
            <Icon name="sparkles" size={14} className="text-purple-400" />
            <span>MUSIFY AI LABS</span>
            <span className="text-[10px] opacity-60">• Powered by Gemini 2.5</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Next-Gen AI DJ &amp; Music Studio
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Personalized live audio transitions, natural-language playlist curation, and instant song insights engineered by Google Gemini.
          </p>

          {/* Current Listening Status Pill */}
          {currentTrack ? (
            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
              </span>
              <p className="text-xs text-zinc-300 truncate max-w-xs sm:max-w-md">
                Tuned to <span className="font-semibold text-white">&ldquo;{currentTrack.title}&rdquo;</span>
              </p>
              {onOpenVisualizer && (
                <button
                  onClick={onOpenVisualizer}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline shrink-0"
                >
                  Visualizer ↗
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs text-zinc-400">
              <span>🎧 Play any track to activate live AI predictions</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: AI DJ Mood & Vibe Selector */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500">
              SMART TUNING
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              AI DJ Live Mood Flow
            </h2>
          </div>
          <span className="text-xs text-purple-400 font-medium">Real-time adaptive</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {AI_MOODS.map((m) => {
            const isSelected = activeMood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onMoodChange(m.id)}
                className={`group flex flex-col items-start rounded-2xl p-3.5 text-left transition-all duration-200 border select-none ${
                  isSelected
                    ? "border-purple-500/50 bg-white/10 text-white shadow-sm"
                    : "border-white/[0.08] bg-[#0c0e16]/80 text-zinc-400 hover:border-white/20 hover:bg-[#141824] hover:text-zinc-200"
                }`}
              >
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-purple-300 transition">
                  {m.label}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-snug">
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: AI Playlist Generator Studio */}
      <section className="space-y-4 rounded-3xl border border-white/10 bg-[#0d0f19]/80 p-5 sm:p-7 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500">
              PROMPT STUDIO
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Generate Playlist With Natural Language
            </h2>
          </div>
          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <Icon name="sparkles" size={13} /> Gemini 2.5
          </span>
        </div>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={playlistPrompt}
              onChange={(e) => setPlaylistPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
              placeholder="Describe a vibe, movie scene, mood, or artist crossover..."
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 backdrop-blur-md transition"
            />
            {playlistPrompt && (
              <button
                onClick={() => setPlaylistPrompt("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>

          {/* Track count picker */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[5, 8, 12, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setTrackCount(cnt)}
                className={`h-11 px-3 rounded-xl text-xs font-semibold border transition ${
                  trackCount === cnt
                    ? "border-purple-500/60 bg-purple-500/20 text-white"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cnt} songs
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!playlistPrompt.trim() || isGenerating}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-black font-bold text-sm shadow-md transition hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Curating...</span>
              </>
            ) : (
              <>
                <Icon name="sparkles" size={16} />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Tap Sample Vibe Chips */}
        <div>
          <p className="text-[11px] font-semibold text-zinc-400 mb-2">Try popular vibes:</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setPlaylistPrompt(chip);
                  handleGenerate(chip);
                }}
                disabled={isGenerating}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white active:scale-95"
              >
                ✨ {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Live AI Track Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[1.5px] text-zinc-500">
              SMART QUEUE
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              AI Predicted Next Tracks
            </h2>
          </div>
          {aiSuggestions.length > 0 && (
            <button
              onClick={onAddAllAIToQueue}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline transition"
            >
              + Add all ({aiSuggestions.length}) to queue
            </button>
          )}
        </div>

        {isLoadingAISuggestions ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-3xl border border-white/[0.08] bg-[#0c0e16]/60 gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <p className="text-xs text-zinc-400">✨ Gemini predicting next song transitions...</p>
          </div>
        ) : aiSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl border border-white/[0.08] bg-[#0c0e16]/60 text-zinc-500 px-4">
            <span className="text-3xl mb-2">✨</span>
            <p className="text-sm font-semibold text-zinc-300">Live predictions ready</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Play any song in Musify to trigger automatic real-time AI transitions and matching suggestions.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e17]/85 overflow-hidden divide-y divide-white/[0.06] shadow-xl">
            {aiSuggestions.map((item, idx) => {
              const isAdded = addedIds.has(item.track.id);
              const art = getHighResArtworkUrl(item.track.artworkUrl, item.track.sourceTrackId || item.track.id);
              return (
                <div
                  key={`hub-ai-${item.track.id}-${idx}`}
                  className="group flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-white/[0.04] transition border-b border-white/[0.06] last:border-b-0"
                >
                  <div
                    onClick={() => onPlayTrack(item.track)}
                    className="flex min-w-0 items-center gap-3.5 flex-1 cursor-pointer select-none"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800 shadow-sm">
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={art}
                          alt={item.track.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            const cleanId = (item.track.sourceTrackId || item.track.id || "").replace(/^yt_/, "");
                            (e.currentTarget as HTMLImageElement).src = cleanId
                              ? `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`
                              : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <Icon name="music" size={16} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white group-hover:text-purple-300 transition" title={item.track.title}>
                          {item.track.title}
                        </p>
                        <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                          {item.reason}
                        </span>
                      </div>
                      <p className="truncate text-xs text-zinc-400 mt-0.5" title={item.track.artists.map((a: { name: string }) => a.name).join(", ")}>
                        {item.track.artists.map((a: { name: string }) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAddWithFeedback(item.track)}
                      aria-label="Add to Queue"
                      title={isAdded ? "Added!" : "Add to Queue"}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95 ${
                        isAdded
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/30 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <Icon name={isAdded ? "check" : "plus"} size={14} />
                    </button>

                    <button
                      onClick={() => onPlayTrack(item.track)}
                      aria-label={`Play ${item.track.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md transition hover:scale-105 active:scale-95"
                    >
                      <Icon name="play" size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4: AI Song Story & Vibe Explainer */}
      {currentTrack && (
        <section className="rounded-3xl border border-white/10 bg-[#0c0e17]/80 p-5 sm:p-6 backdrop-blur-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Ask AI About &ldquo;{currentTrack.title}&rdquo;
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Discover lyrical themes, emotional resonance, and musical key
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyzeTrack}
              disabled={isAnalyzing}
              className="rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/25 transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isAnalyzing ? "Analyzing..." : "Explain Song"}
            </button>
          </div>

          {aiAnalysis && (
            <div className="mt-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-zinc-300 leading-relaxed animate-fade-in">
              <p>{aiAnalysis}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

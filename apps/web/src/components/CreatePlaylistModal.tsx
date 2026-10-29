"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "./Icons";

export interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  onGenerateAI?: (prompt: string, count: number) => Promise<void>;
}

const SAMPLE_AI_VIBES = [
  "Late night lofi coding",
  "Bhojpuri energetic dance",
  "Acoustic morning coffee",
  "90s Bollywood romance",
  "High-energy workout hits",
  "Chill monsoon raindrops",
];

export function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreate,
  onGenerateAI,
}: CreatePlaylistModalProps) {
  const [activeTab, setActiveTab] = useState<"custom" | "ai">("custom");
  const [name, setName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [trackCount, setTrackCount] = useState<number>(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    onClose();
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt || isGenerating || !onGenerateAI) return;

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      await onGenerateAI(prompt, trackCount);
      setAiPrompt("");
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to generate playlist. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create new playlist"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1017]/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Create Playlist
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              PostgreSQL
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={isGenerating}
            className="text-zinc-500 hover:text-white transition disabled:opacity-40"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="mt-2 flex rounded-2xl bg-white/5 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            disabled={isGenerating}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === "custom"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon name="list" size={14} />
            <span>Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            disabled={isGenerating}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition ${
              activeTab === "ai"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon name="compass" size={14} />
            <span>AI Smart DJ</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Manual Playlist */}
        {activeTab === "custom" ? (
          <form onSubmit={handleCustomSubmit} className="mt-4">
            <p className="text-xs text-zinc-400">
              Give your playlist a title to start collecting songs.
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Beats, Daily Drive"
              autoFocus
              maxLength={100}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-white/30 placeholder:text-zinc-500"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: AI Smart Playlist with Gemini */
          <form onSubmit={handleAISubmit} className="mt-4">
            <p className="text-xs text-zinc-400">
              Describe your desired vibe, mood, genre, or artist. Gemini 3.6
              Flash will curate and match real streaming tracks into your
              database.
            </p>

            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Upbeat Bhojpuri workout songs, 90s monsoon Hindi songs"
              autoFocus
              maxLength={200}
              disabled={isGenerating}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 placeholder:text-zinc-500 disabled:opacity-50"
            />

            {/* Quick Inspiration Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SAMPLE_AI_VIBES.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setAiPrompt(vibe)}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-400 hover:border-indigo-500/30 hover:bg-white/[0.08] hover:text-zinc-200 transition"
                >
                  {vibe}
                </button>
              ))}
            </div>

            {/* Count Selector */}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
              <span>Track count:</span>
              <div className="flex gap-1.5">
                {[5, 8, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setTrackCount(num)}
                    className={`rounded-lg px-2.5 py-1 font-mono transition ${
                      trackCount === num
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">
                🔒 Server-side isolated
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Curating Tracks...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="compass" size={14} />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

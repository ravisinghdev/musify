"use client";

import React, { useState } from "react";
import { Icon } from "./Icons";
import type { CustomPlaylist } from "../lib/store";
import { api } from "../lib/api";

export interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (playlist: CustomPlaylist) => void;
  onShowToast?: (title: string, message?: string, type?: "success" | "info" | "heart") => void;
}

export function ImportPlaylistModal({
  isOpen,
  onClose,
  onImportSuccess,
  onShowToast,
}: ImportPlaylistModalProps) {
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState("");

  if (!isOpen) return null;

  const handleImport = async () => {
    const lines = inputText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      onShowToast?.("Empty List", "Please enter song titles or paste a playlist link", "info");
      return;
    }

    setIsImporting(true);
    const resolvedTracks = [];
    const name = playlistTitle.trim() || `Imported Mix (${new Date().toLocaleDateString()})`;

    try {
      for (let i = 0; i < Math.min(lines.length, 25); i++) {
        const query = lines[i];
        setProgressText(`Resolving track ${i + 1} of ${Math.min(lines.length, 25)}...`);

        try {
          const res = await api.searchTracks(query);
          if (res?.tracks && res.tracks.length > 0) {
            resolvedTracks.push(res.tracks[0]);
          }
        } catch {
          // Continue resolving remaining tracks
        }
      }

      if (resolvedTracks.length === 0) {
        onShowToast?.("Import Failed", "No songs could be found matching your query", "info");
        return;
      }

      const newPlaylist: CustomPlaylist = {
        id: `pl_${Date.now()}`,
        name,
        artwork:
          resolvedTracks[0]?.artworkUrl ||
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        description: `Imported with ${resolvedTracks.length} tracks via Musify Importer`,
        tracks: resolvedTracks,
        createdAt: new Date().toISOString(),
      };

      onImportSuccess(newPlaylist);
      onShowToast?.(
        "Playlist Imported!",
        `Successfully imported "${name}" with ${resolvedTracks.length} tracks`,
        "success",
      );
      onClose();
    } catch (err: any) {
      onShowToast?.("Import Error", err.message || "Failed to import playlist", "info");
    } finally {
      setIsImporting(false);
      setProgressText("");
    }
  };

  const handleInsertSample = () => {
    setPlaylistTitle("Bollywood Acoustic Hits");
    setInputText("Tum Hi Ho - Arijit Singh\nKesariya - Brahmastra\nApna Bana Le - Bhediya\nRaataan Lambiyan - Shershaah\nChanna Mereya - Arijit Singh");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Import Playlist"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e16]/90 p-6 backdrop-blur-2xl shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Icon name="download" size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Import Playlist</h2>
              <p className="text-[11px] text-zinc-400">Import from Spotify, YouTube, or track list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Playlist Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">Playlist Name</label>
          <input
            type="text"
            value={playlistTitle}
            onChange={(e) => setPlaylistTitle(e.target.value)}
            placeholder="e.g. My Roadtrip Mix"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition"
          />
        </div>

        {/* Text Area for Tracks / Links */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Paste Song List (one per line)
            </label>
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-[11px] font-semibold text-indigo-400 hover:underline"
            >
              Try sample list
            </button>
          </div>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Song Name - Artist Name&#10;Another Song - Artist&#10;Or paste track titles here..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-xs text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition font-mono custom-scrollbar resize-none"
          />
        </div>

        {/* Progress Display */}
        {isImporting && (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent shrink-0" />
            <span className="font-medium">{progressText}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleImport}
            disabled={isImporting || !inputText.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition active:scale-[0.98] shadow-lg disabled:opacity-40"
          >
            <Icon name="download" size={16} />
            <span>{isImporting ? "Importing Tracks..." : "Import to Library"}</span>
          </button>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

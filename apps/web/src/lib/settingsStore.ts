"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "./store";

export type AudioQuality = "lossless" | "high" | "standard" | "saver";
export type AudioFormat = "auto" | "aac" | "opus" | "flac";
export type BufferSize = "normal" | "large";
export type NormalizationLevel = "quiet" | "normal" | "loud";
export type AIPersona = "smart" | "deep_cuts" | "party" | "chill" | "storyteller";
export type LyricsFontSize = "compact" | "normal" | "large";
export type LyricsAlignment = "center" | "left";
export type VisualizerStyle = "bars" | "wave" | "nebula" | "bloom";
export type ThemeMode = "dark" | "oled" | "midnight" | "emerald" | "amber";
export type AccentColor = "dynamic" | "indigo" | "emerald" | "rose" | "cyan" | "amber";
export type PlayerShape = "pill" | "bar";
export type PreferredRegion = "global" | "bollywood" | "western" | "kpop" | "latin" | "lofi";
export type EqualizerPreset =
  | "flat"
  | "bass_boost"
  | "treble_boost"
  | "vocal"
  | "electronic"
  | "rock"
  | "hiphop"
  | "acoustic"
  | "custom";

export interface EqualizerBands {
  60: number;   // Sub-bass (dB: -12 to +12)
  230: number;  // Bass
  910: number;  // Mid
  3600: number; // Upper Mid
  14000: number;// Treble
}

export type LandingPage = "Home" | "Explore" | "Search" | "Your favorites";

export interface MusifySettings {
  // Audio & Quality
  audioQualityWifi: AudioQuality;
  audioQualityCellular: AudioQuality;
  audioFormat: AudioFormat;
  bufferSize: BufferSize;
  volumeNormalization: boolean;
  normalizationLevel: NormalizationLevel;
  crossfadeSeconds: number; // 0 to 12
  gaplessPlayback: boolean;
  automix: boolean;
  monoAudio: boolean;
  rememberVolume: boolean;
  savedVolume: number;
  defaultShuffle: boolean;
  defaultRepeat: boolean;

  // Equalizer & Acoustic Studio
  equalizerEnabled: boolean;
  equalizerPreset: EqualizerPreset;
  equalizerBands: EqualizerBands;
  preAmpDb: number;
  bassBoostStrength: number; // 0 - 100
  virtualizer3D: boolean;

  // Playback & AI DJ
  aiDjAutoplay: boolean;
  aiPersona: AIPersona;
  aiTemperature: number; // 0.2 to 1.0
  preferredRegion: PreferredRegion;
  filterExplicit: boolean;
  skipLearning: boolean;
  sleepTimerFadeOut: boolean;

  // Lyrics & Visuals
  lyricsSync: boolean;
  lyricsFontSize: LyricsFontSize;
  lyricsAlignment: LyricsAlignment;
  lyricsRomanized: boolean;
  lyricsTranslation: boolean;
  ambientGlow: boolean;
  visualizerStyle: VisualizerStyle;

  // Appearance & UI
  theme: ThemeMode;
  accentColor: AccentColor;
  compactMode: boolean;
  playerShape: PlayerShape;
  showSidebarBadges: boolean;
  reduceMotion: boolean;
  landingPage: LandingPage;
  showRecommendations: boolean;
  showRecentlyPlayed: boolean;

  // Storage & Cache
  cacheLimitMb: number;
  autoCacheFavorites: boolean;

  // Privacy & Social
  privateSession: boolean;
  listeningActivity: boolean;

  // Touch & Haptic Interactions
  hapticsEnabled: boolean;
  hapticIntensity: "light" | "standard" | "strong";
  gesturesEnabled: boolean;
  gestureSwipeTracks: boolean;
  gestureSwipeClose: boolean;
  gestureDoubleTapLike: boolean;
  gestureQueueSwipe: boolean;
  gestureLongPress: boolean;
}

export const EQUALIZER_PRESETS: Record<EqualizerPreset, EqualizerBands> = {
  flat: { 60: 0, 230: 0, 910: 0, 3600: 0, 14000: 0 },
  bass_boost: { 60: 7, 230: 5, 910: 1, 3600: 0, 14000: -1 },
  treble_boost: { 60: -2, 230: 0, 910: 2, 3600: 5, 14000: 7 },
  vocal: { 60: -1, 230: 1, 910: 6, 3600: 4, 14000: 1 },
  electronic: { 60: 6, 230: 4, 910: -1, 3600: 3, 14000: 5 },
  rock: { 60: 5, 230: 3, 910: -1, 3600: 4, 14000: 4 },
  hiphop: { 60: 7, 230: 6, 910: 0, 3600: 2, 14000: 3 },
  acoustic: { 60: 3, 230: 2, 910: 3, 3600: 4, 14000: 3 },
  custom: { 60: 0, 230: 0, 910: 0, 3600: 0, 14000: 0 },
};

export const DEFAULT_SETTINGS: MusifySettings = {
  // Audio & Quality
  audioQualityWifi: "lossless",
  audioQualityCellular: "high",
  audioFormat: "auto",
  bufferSize: "normal",
  volumeNormalization: true,
  normalizationLevel: "normal",
  crossfadeSeconds: 3,
  gaplessPlayback: true,
  automix: true,
  monoAudio: false,
  rememberVolume: true,
  savedVolume: 0.8,
  defaultShuffle: false,
  defaultRepeat: false,

  // Equalizer & Acoustic Studio
  equalizerEnabled: false,
  equalizerPreset: "flat",
  equalizerBands: { 60: 0, 230: 0, 910: 0, 3600: 0, 14000: 0 },
  preAmpDb: 0,
  bassBoostStrength: 25,
  virtualizer3D: false,

  // Playback & AI
  aiDjAutoplay: true,
  aiPersona: "smart",
  aiTemperature: 0.7,
  preferredRegion: "global",
  filterExplicit: false,
  skipLearning: true,
  sleepTimerFadeOut: true,

  // Lyrics & Visuals
  lyricsSync: true,
  lyricsFontSize: "normal",
  lyricsAlignment: "center",
  lyricsRomanized: false,
  lyricsTranslation: false,
  ambientGlow: false,
  visualizerStyle: "bars",

  // Appearance
  theme: "dark",
  accentColor: "dynamic",
  compactMode: false,
  playerShape: "pill",
  showSidebarBadges: true,
  reduceMotion: false,
  landingPage: "Home",
  showRecommendations: true,
  showRecentlyPlayed: true,

  // Storage & Cache
  cacheLimitMb: 2000,
  autoCacheFavorites: true,

  // Privacy & Social
  privateSession: false,
  listeningActivity: true,

  // Touch & Haptic Interactions
  hapticsEnabled: true,
  hapticIntensity: "standard",
  gesturesEnabled: true,
  gestureSwipeTracks: true,
  gestureSwipeClose: true,
  gestureDoubleTapLike: true,
  gestureQueueSwipe: true,
  gestureLongPress: true,
};

const SETTINGS_STORAGE_KEY = "musify_app_settings_v3";

function getSessionHeader(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("musify_session_token") || "";
  } catch {
    return "";
  }
}

// Background cross-platform sync with Supabase PostgreSQL
async function syncSettingsToCloud(settings: Partial<MusifySettings>) {
  if (typeof window === "undefined") return;
  const sessionToken = getSessionHeader();
  if (!sessionToken) return;

  try {
    const apiBase = getApiBase();
    await fetch(`${apiBase}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-session-id": sessionToken,
      },
      body: JSON.stringify({ settings }),
    });
  } catch {
    // Non-blocking offline fallback
  }
}

type SettingsListener = (settings: MusifySettings) => void;
const listeners = new Set<SettingsListener>();

export function getStoredSettings(): MusifySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(updates: Partial<MusifySettings>): MusifySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const current = getStoredSettings();
    const next: MusifySettings = { ...current, ...updates };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    listeners.forEach((fn) => fn(next));

    // Upload changes asynchronously to Supabase cloud database
    syncSettingsToCloud(updates);

    return next;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function resetStoredSettings(): MusifySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    listeners.forEach((fn) => fn(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings(): {
  settings: MusifySettings;
  updateSettings: (updates: Partial<MusifySettings>) => void;
  resetSettings: () => void;
} {
  const [settings, setSettings] = useState<MusifySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // 1. Load immediate local copy
    setSettings(getStoredSettings());

    // 2. Hydrate & merge from Supabase PostgreSQL cloud in background
    if (typeof window !== "undefined") {
      const sessionToken = getSessionHeader();
      if (sessionToken) {
        const apiBase = getApiBase();
        fetch(`${apiBase}/settings`, {
          headers: {
            "x-user-session-id": sessionToken,
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.settings && Object.keys(data.settings).length > 0) {
              const current = getStoredSettings();
              const merged = { ...current, ...data.settings };
              localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
              setSettings(merged);
              listeners.forEach((fn) => fn(merged));
            }
          })
          .catch(() => {});
      }
    }

    const handleUpdate: SettingsListener = (next) => {
      setSettings(next);
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const updateSettings = (updates: Partial<MusifySettings>) => {
    const updated = saveStoredSettings(updates);
    setSettings(updated);
  };

  const resetSettings = () => {
    const reset = resetStoredSettings();
    setSettings(reset);
  };

  return { settings, updateSettings, resetSettings };
}

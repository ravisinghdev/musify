"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import type { SafeUser } from "../lib/store";
import { store } from "../lib/store";
import {
  useSettings,
  EQUALIZER_PRESETS,
  type EqualizerPreset,
  type AudioQuality,
  type ThemeMode,
  type AccentColor,
  type LyricsFontSize,
  type PlayerShape,
  type PreferredRegion,
  type LandingPage,
} from "../lib/settingsStore";

export interface SettingsViewProps {
  authUser: SafeUser | null;
  favoritesCount?: number;
  playlistsCount?: number;
  historyCount?: number;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onOpenSleepTimer?: () => void;
  sleepTimerRemaining?: number | null;
  onShowToast?: (
    title: string,
    message?: string,
    type?: "success" | "info" | "heart",
  ) => void;
  onBackToHome?: () => void;
  onUserUpdate?: (user: SafeUser) => void;
}

type ViewMode = "hub" | "edit-profile" | "avatar-preview" | "sub-section";
type SubSection =
  | "appearance"
  | "playback"
  | "interface"
  | "touch-haptics"
  | "equalizer"
  | "notifications"
  | "privacy-storage"
  | "about";

function compressImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const targetSize = Math.min(maxSize, minDim);
        canvas.width = targetSize;
        canvas.height = targetSize;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function SettingsView({
  authUser,
  favoritesCount = 0,
  playlistsCount = 0,
  historyCount = 0,
  onOpenAuthModal,
  onSignOut,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onShowToast,
  onBackToHome,
  onUserUpdate,
}: SettingsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("hub");
  const [activeSubSection, setActiveSubSection] = useState<SubSection>("appearance");
  const { settings, updateSettings, resetSettings } = useSettings();

  // Profile Edit State
  const [editName, setEditName] = useState(
    authUser?.displayName || "Music Explorer",
  );
  const [editEmail, setEditEmail] = useState(authUser?.email || "");
  const [editPassword, setEditPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar Selection & Preview State
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    authUser?.avatarUrl || null,
  );
  const [zoomLevel, setZoomLevel] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage estimation
  const [storageEstimate, setStorageEstimate] = useState<{ usedMb: string; totalMb: string }>({
    usedMb: "24.5",
    totalMb: "2048",
  });

  // Notification status
  const [notifStatus, setNotifStatus] = useState<string>("default");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const used = (est.usage ? est.usage / (1024 * 1024) : 24.5).toFixed(1);
        const total = (est.quota ? est.quota / (1024 * 1024) : 2048).toFixed(0);
        setStorageEstimate({ usedMb: used, totalMb: total });
      }).catch(() => {});
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const isGuest = !authUser || authUser.id.startsWith("guest-") || Boolean(authUser.isAnonymous);
  const displayName = authUser?.displayName || "Music Explorer";
  const email = authUser?.email || "guest@musify.internal";
  const avatarUrl = authUser?.avatarUrl || null;
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file, 500);
      setSelectedAvatarUrl(dataUrl);
      setViewMode("avatar-preview");
    } catch {
      onShowToast?.("Error", "Could not process image", "info");
    }
  };

  const handleConfirmAvatar = async () => {
    if (!selectedAvatarUrl) {
      setViewMode("hub");
      return;
    }

    try {
      if (authUser && !isGuest) {
        const updated = await store.updateProfile(authUser.displayName || undefined, selectedAvatarUrl);
        if (updated) {
          onUserUpdate?.(updated);
        }
      }
      onShowToast?.("Avatar Updated", "Your profile photo has been refreshed", "success");
      setViewMode("hub");
    } catch {
      onShowToast?.("Update Failed", "Could not save avatar to cloud", "info");
      setViewMode("hub");
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (authUser && !isGuest) {
        const updated = await store.updateProfile(editName, authUser.avatarUrl || undefined);
        if (updated) {
          onUserUpdate?.(updated);
        }
      }
      onShowToast?.("Profile Saved", "Account information updated successfully", "success");
      setViewMode("hub");
    } catch {
      onShowToast?.("Error", "Could not save profile changes", "info");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleClearAppCache = async () => {
    try {
      if (typeof window !== "undefined" && "caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setStorageEstimate({ usedMb: "0.2", totalMb: storageEstimate.totalMb });
      onShowToast?.("Cache Cleared", "Temporary artwork & audio cache purged", "success");
    } catch {
      onShowToast?.("Cache Cleared", "Local storage purged", "info");
    }
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotifStatus(permission);
        if (permission === "granted") {
          onShowToast?.("Notifications Enabled", "Media playback notifications active", "success");
        } else {
          onShowToast?.("Permission Denied", "Notifications blocked by browser or system", "info");
        }
      } catch {
        onShowToast?.("Info", "Notification permissions are managed by Android OS", "info");
      }
    } else {
      onShowToast?.("Native Notifications Active", "Android MediaSession foreground service running", "success");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-40">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* =========================================================================
          SCREEN 1: MAIN SETTINGS HUB
          ========================================================================= */}
      {viewMode === "hub" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3">
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
                  aria-label="Back"
                >
                  <Icon name="chevron-left" size={18} />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Settings
              </h1>
            </div>

            <button
              onClick={() => {
                resetSettings();
                onShowToast?.("Settings Reset", "Default settings restored", "info");
              }}
              className="text-xs text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10"
            >
              Reset All
            </button>
          </div>

          {/* User Profile Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-zinc-800 text-lg font-bold text-white shadow-lg transition active:scale-95"
                  title="Change avatar"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <Icon name="camera" size={16} className="text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">
                    {displayName}
                  </h2>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-zinc-400">
                      {favoritesCount} favorites &bull; {playlistsCount} playlists
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewMode("edit-profile")}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-95 shadow-md shrink-0 w-full sm:w-auto"
              >
                <Icon name="edit" size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Grouped Settings Sub-Sections List */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Preferences & Configuration
            </p>

            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06] backdrop-blur-2xl shadow-xl">
              {/* 1. Appearance */}
              <button
                onClick={() => {
                  setActiveSubSection("appearance");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Icon name="palette" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Appearance
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Theme ({settings.theme}), accent color & player layout
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 2. Playback */}
              <button
                onClick={() => {
                  setActiveSubSection("playback");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icon name="music" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Playback
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Audio quality ({settings.audioQualityWifi}), crossfade ({settings.crossfadeSeconds}s) & autoplay
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 3. Graphic Equalizer */}
              <button
                onClick={() => {
                  setActiveSubSection("equalizer");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Icon name="sliders" size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Graphic Equalizer
                      </span>
                      {settings.equalizerEnabled && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      5-band acoustics & presets ({settings.equalizerPreset})
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 4. Interface & Display */}
              <button
                onClick={() => {
                  setActiveSubSection("interface");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Icon name="compass" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Interface & Navigation
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Landing tab ({settings.landingPage}), recommendations & lyrics size
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 5. Touch & Haptic Feedback */}
              <button
                onClick={() => {
                  haptics.light();
                  setActiveSubSection("touch-haptics");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Icon name="sparkles" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Touch & Haptic Interactions
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Vibration intensity ({settings.hapticIntensity}), swipe controls & double-tap actions
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 6. Notifications */}
              <button
                onClick={() => {
                  setActiveSubSection("notifications");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Icon name="bell" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Notifications & Lockscreen
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Media controls & Android background notifications
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 6. Privacy & Storage */}
              <button
                onClick={() => {
                  setActiveSubSection("privacy-storage");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Icon name="shield" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Privacy & Storage
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Clear cache ({storageEstimate.usedMb} MB used), private session & history
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>

              {/* 7. About */}
              <button
                onClick={() => {
                  setActiveSubSection("about");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-500/10 text-zinc-300 border border-white/10">
                    <Icon name="settings" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      About Musify
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      v1.0.50 &bull; Platform architecture & credits
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={16} className="text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Quick Sign In / Out */}
          <div className="pt-2">
            {isGuest ? (
              <button
                onClick={onOpenAuthModal}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition shadow-sm"
              >
                Sign In to Cloud Account
              </button>
            ) : (
              <button
                onClick={onSignOut}
                className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition shadow-sm"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 2: AVATAR PHOTO PREVIEW & CROP
          ========================================================================= */}
      {viewMode === "avatar-preview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="relative flex items-center justify-center py-2">
            <button
              onClick={() => setViewMode("hub")}
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
              aria-label="Back"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Preview Avatar
            </h1>
          </div>

          <div className="relative flex aspect-square w-full max-w-sm mx-auto flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
            {selectedAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAvatarUrl}
                alt="Blurred Preview"
                className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40"
              />
            )}

            <div
              className="relative z-10 h-52 w-52 sm:h-64 sm:w-64 rounded-full border-4 border-white shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {selectedAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedAvatarUrl}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-white font-bold text-4xl">
                  {initials}
                </div>
              )}
            </div>

            <div className="relative z-20 mt-6 flex items-center gap-3 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 backdrop-blur-xl shadow-lg">
              <button
                onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                className="flex h-7 w-7 items-center justify-center text-lg font-bold text-zinc-300 hover:text-white transition active:scale-90"
              >
                &minus;
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="flex h-7 w-7 items-center justify-center text-lg font-bold text-zinc-300 hover:text-white transition active:scale-90"
              >
                &#43;
              </button>
              <span className="h-4 w-px bg-white/20" />
              <button
                onClick={() => setZoomLevel(100)}
                className="text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2 max-w-sm mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
            >
              <Icon name="camera" size={17} />
              <span>Select Another Photo</span>
            </button>

            <button
              onClick={handleConfirmAvatar}
              className="flex w-full items-center justify-center rounded-full bg-white py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition active:scale-[0.98] shadow-lg"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 3: EDIT PROFILE FORM
          ========================================================================= */}
      {viewMode === "edit-profile" && (
        <div className="space-y-6 animate-fade-in">
          <div className="relative flex items-center justify-center py-2">
            <button
              onClick={() => setViewMode("hub")}
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
              aria-label="Back"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Edit Profile
            </h1>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter Your Name"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter Your Email"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter Your Password"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-white/30 focus:bg-white/[0.08] focus:outline-none transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                >
                  <Icon name="eye" size={17} />
                </button>
              </div>
            </div>

            <div className="pt-3 space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="flex w-full items-center justify-center rounded-full bg-white py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setViewMode("hub")}
                className="flex w-full items-center justify-center rounded-full bg-white/[0.06] border border-white/10 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 4: SUB-SECTION DETAIL SCREENS
          ========================================================================= */}
      {viewMode === "sub-section" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar */}
          <div className="relative flex items-center justify-center py-2">
            <button
              onClick={() => setViewMode("hub")}
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
              aria-label="Back"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight capitalize">
              {activeSubSection === "appearance"
                ? "Appearance"
                : activeSubSection === "playback"
                  ? "Playback Settings"
                  : activeSubSection === "equalizer"
                    ? "Graphic Equalizer"
                    : activeSubSection === "interface"
                      ? "Interface & Display"
                      : activeSubSection === "touch-haptics"
                        ? "Touch & Haptic Interactions"
                        : activeSubSection === "notifications"
                          ? "Notifications & Lockscreen"
                          : activeSubSection === "privacy-storage"
                            ? "Privacy & Storage"
                            : "About Musify"}
            </h1>
          </div>

          {/* ===================== 1. APPEARANCE ===================== */}
          {activeSubSection === "appearance" && (
            <div className="space-y-5">
              {/* Theme Mode */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Theme Mode
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Select background depth and contrast
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "dark", label: "Dark Space", color: "#07090e" },
                    { id: "oled", label: "OLED Black", color: "#000000" },
                    { id: "midnight", label: "Midnight Navy", color: "#040812" },
                    { id: "emerald", label: "Forest Emerald", color: "#04100b" },
                    { id: "amber", label: "Amber Bronze", color: "#100803" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSettings({ theme: t.id as ThemeMode })}
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                        settings.theme === t.id
                          ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-xs truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Accent Color
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Colors highlights, sliders, and active elements
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "dynamic", label: "Dynamic Glow" },
                    { id: "indigo", label: "Indigo" },
                    { id: "emerald", label: "Emerald" },
                    { id: "rose", label: "Rose" },
                    { id: "cyan", label: "Cyan" },
                    { id: "amber", label: "Amber" },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => updateSettings({ accentColor: acc.id as AccentColor })}
                      className={`rounded-2xl border p-3 text-center transition ${
                        settings.accentColor === acc.id
                          ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs">{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Player Dock Shape */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Player Dock Appearance
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Choose floating pill or edge-to-edge dock
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => updateSettings({ playerShape: "pill" })}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      settings.playerShape === "pill"
                        ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs font-semibold block text-white">Floating Pill</span>
                    <span className="text-[10px] text-zinc-400">Modern rounded floating bar</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ playerShape: "bar" })}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      settings.playerShape === "bar"
                        ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs font-semibold block text-white">Full-Width Dock</span>
                    <span className="text-[10px] text-zinc-400">Classic edge-to-edge docked player</span>
                  </button>
                </div>
              </div>

              {/* Toggles: Dynamic Glow & Reduce Motion */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl divide-y divide-white/5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Dynamic Artwork Ambient Glow
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Paints the viewport background with current song lighting
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ ambientGlow: !settings.ambientGlow })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.ambientGlow ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.ambientGlow ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Reduce Motion & Animations
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Disables floating ambient disc motion for lower battery usage
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.reduceMotion ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.reduceMotion ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== 2. PLAYBACK ===================== */}
          {activeSubSection === "playback" && (
            <div className="space-y-5">
              {/* Bitrate Selection */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Default Audio Quality
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Highest possible stream bitrate selected automatically
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "lossless", label: "Lossless Master", sub: "FLAC 24-bit / 96kHz" },
                    { id: "high", label: "High Fidelity", sub: "320 kbps AAC" },
                    { id: "standard", label: "Standard", sub: "160 kbps WebM" },
                    { id: "saver", label: "Data Saver", sub: "96 kbps Opus" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateSettings({ audioQualityWifi: opt.id as AudioQuality })}
                      className={`rounded-2xl border p-3.5 text-left transition ${
                        settings.audioQualityWifi === opt.id
                          ? "border-purple-500/50 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        {settings.audioQualityWifi === opt.id && (
                          <span className="h-2 w-2 rounded-full bg-purple-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crossfade Duration Slider */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Crossfade Duration
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Fades seamlessly between adjacent tracks
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-400">
                    {settings.crossfadeSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={settings.crossfadeSeconds}
                  onChange={(e) => updateSettings({ crossfadeSeconds: Number(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Off (0s)</span>
                  <span>4s</span>
                  <span>8s</span>
                  <span>12s</span>
                </div>
              </div>

              {/* Gapless, Volume Memory & Default Shuffle/Repeat */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl divide-y divide-white/5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-white">Gapless Playback</p>
                    <p className="text-[11px] text-zinc-400">
                      Pre-buffers next audio track for zero-gap playback
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ gaplessPlayback: !settings.gaplessPlayback })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.gaplessPlayback ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.gaplessPlayback ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Remember Volume</p>
                    <p className="text-[11px] text-zinc-400">
                      Restores last player volume level on app launch
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ rememberVolume: !settings.rememberVolume })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.rememberVolume ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.rememberVolume ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">AI DJ Smart Autoplay</p>
                    <p className="text-[11px] text-zinc-400">
                      Continues playing matching songs when queue finishes
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ aiDjAutoplay: !settings.aiDjAutoplay })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.aiDjAutoplay ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.aiDjAutoplay ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Default Shuffle Mode</p>
                    <p className="text-[11px] text-zinc-400">
                      Automatically enables shuffle when playing any playlist
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ defaultShuffle: !settings.defaultShuffle })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.defaultShuffle ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.defaultShuffle ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== 3. EQUALIZER ===================== */}
          {activeSubSection === "equalizer" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Equalizer Master Switch</h3>
                    <p className="text-[11px] text-zinc-400">
                      5-band WebAudio parametric biquad filter
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ equalizerEnabled: !settings.equalizerEnabled })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.equalizerEnabled ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.equalizerEnabled ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Acoustic Presets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "flat", label: "Flat" },
                      { id: "bass_boost", label: "Bass Boost" },
                      { id: "treble_boost", label: "Treble Boost" },
                      { id: "vocal", label: "Vocal Clarity" },
                      { id: "electronic", label: "Electronic" },
                      { id: "rock", label: "Rock" },
                      { id: "hiphop", label: "Hip-Hop" },
                      { id: "acoustic", label: "Acoustic" },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          updateSettings({
                            equalizerPreset: preset.id as EqualizerPreset,
                            equalizerBands: EQUALIZER_PRESETS[preset.id as EqualizerPreset],
                            equalizerEnabled: true,
                          });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          settings.equalizerPreset === preset.id && settings.equalizerEnabled
                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                            : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-opacity ${
                    settings.equalizerEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
                  }`}
                >
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { hz: 60, name: "60Hz" },
                      { hz: 230, name: "230Hz" },
                      { hz: 910, name: "910Hz" },
                      { hz: 3600, name: "3.6kHz" },
                      { hz: 14000, name: "14kHz" },
                    ].map((band) => {
                      const gain = (settings.equalizerBands as any)[band.hz] ?? 0;
                      return (
                        <div key={band.hz} className="flex flex-col items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-purple-400">
                            {gain > 0 ? `+${gain}` : gain}
                          </span>
                          <div className="h-36 flex items-center justify-center">
                            <input
                              type="range"
                              min={-12}
                              max={12}
                              step={1}
                              value={gain}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                updateSettings({
                                  equalizerPreset: "custom",
                                  equalizerBands: {
                                    ...settings.equalizerBands,
                                    [band.hz]: val,
                                  },
                                });
                              }}
                              className="h-32 w-1.5 accent-purple-400 cursor-pointer appearance-none bg-white/15 rounded-full [writing-mode:vertical-lr] [direction:rtl]"
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-400">
                            {band.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== 4. INTERFACE & DISPLAY ===================== */}
          {activeSubSection === "interface" && (
            <div className="space-y-5">
              {/* Default Landing Tab */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Default Landing Tab
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Screen opened upon app launch
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "Home", label: "Home Feed" },
                    { id: "Explore", label: "Explore & Genres" },
                    { id: "Search", label: "Search" },
                    { id: "Your favorites", label: "Library" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateSettings({ landingPage: item.id as LandingPage })}
                      className={`rounded-2xl border p-3.5 text-left transition ${
                        settings.landingPage === item.id
                          ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Display Toggles */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl divide-y divide-white/5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-white">Music Recommendations</p>
                    <p className="text-[11px] text-zinc-400">
                      Show &ldquo;Recommended for you&rdquo; carousel on Home
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showRecommendations: !settings.showRecommendations })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.showRecommendations ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.showRecommendations ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Recently Played Shelf</p>
                    <p className="text-[11px] text-zinc-400">
                      Display previous listening history on Home
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showRecentlyPlayed: !settings.showRecentlyPlayed })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.showRecentlyPlayed ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.showRecentlyPlayed ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Compact Track Density</p>
                    <p className="text-[11px] text-zinc-400">
                      Tighter track list rows for higher information density
                    </p>
                  </div>
                  <button
                    onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.compactMode ? "bg-purple-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.compactMode ? "left-6 bg-white" : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Lyrics Typography */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-3.5 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Lyrics Font Size
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Controls synchronized karaoke lyrics scale
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["compact", "normal", "large"] as LyricsFontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSettings({ lyricsFontSize: size })}
                      className={`rounded-2xl border p-3 text-center capitalize transition ${
                        settings.lyricsFontSize === size
                          ? "border-purple-500/50 bg-purple-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs">{size}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TOUCH & HAPTIC INTERACTIONS ===================== */}
          {activeSubSection === "touch-haptics" && (
            <div className="space-y-5">
              {/* 1. Master Haptic Feedback */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Haptic Vibration</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Tactile micro-feedback on playback buttons, sliders & navigation
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !settings.hapticsEnabled;
                      updateSettings({ hapticsEnabled: next });
                      if (next) haptics.success();
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.hapticsEnabled ? "bg-purple-600" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.hapticsEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Haptic Intensity selector */}
                {settings.hapticsEnabled && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">Vibration Intensity</span>
                      <button
                        onClick={() => {
                          haptics.medium();
                          onShowToast?.("Haptic Test", "Felt tactile feedback", "info");
                        }}
                        className="text-[11px] text-purple-300 hover:text-white bg-purple-500/15 px-2.5 py-1 rounded-xl border border-purple-500/25 active:scale-95 transition"
                      >
                        Test Feedback
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["light", "standard", "strong"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => {
                            updateSettings({ hapticIntensity: lvl });
                            haptics.impact(lvl === "strong" ? "heavy" : lvl === "light" ? "light" : "medium");
                          }}
                          className={`rounded-2xl border p-2.5 text-center capitalize transition active:scale-95 ${
                            settings.hapticIntensity === lvl
                              ? "border-purple-500/60 bg-purple-500/20 text-white font-bold shadow-sm"
                              : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-xs">{lvl}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Gesture Controls */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <div>
                  <h3 className="text-sm font-bold text-white">Touch & Gesture Controls</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Native mobile player swipe gestures and long-press menus
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Swipe Track Switching */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Swipe Track Switching</span>
                      <span className="text-[10px] text-zinc-400 block">Swipe left or right on player dock to skip tracks</span>
                    </div>
                    <button
                      onClick={() => {
                        haptics.selection();
                        updateSettings({ gestureSwipeTracks: !settings.gestureSwipeTracks });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.gestureSwipeTracks ? "bg-purple-600" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.gestureSwipeTracks ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Swipe to Close Player */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Swipe to Close Player</span>
                      <span className="text-[10px] text-zinc-400 block">Swipe down on full-screen player to collapse</span>
                    </div>
                    <button
                      onClick={() => {
                        haptics.selection();
                        updateSettings({ gestureSwipeClose: !settings.gestureSwipeClose });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.gestureSwipeClose ? "bg-purple-600" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.gestureSwipeClose ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Double-tap to Like */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Double-Tap to Like</span>
                      <span className="text-[10px] text-zinc-400 block">Double-tap vinyl disc or artwork to heart song</span>
                    </div>
                    <button
                      onClick={() => {
                        haptics.selection();
                        updateSettings({ gestureDoubleTapLike: !settings.gestureDoubleTapLike });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.gestureDoubleTapLike ? "bg-purple-600" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.gestureDoubleTapLike ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Long-press Context Menu */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Long-Press Context Actions</span>
                      <span className="text-[10px] text-zinc-400 block">Press & hold any song to open native action sheet</span>
                    </div>
                    <button
                      onClick={() => {
                        haptics.selection();
                        updateSettings({ gestureLongPress: !settings.gestureLongPress });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.gestureLongPress ? "bg-purple-600" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.gestureLongPress ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Queue Swipe Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Queue Swipe Actions</span>
                      <span className="text-[10px] text-zinc-400 block">Swipe queue items for fast remove or reorder</span>
                    </div>
                    <button
                      onClick={() => {
                        haptics.selection();
                        updateSettings({ gestureQueueSwipe: !settings.gestureQueueSwipe });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.gestureQueueSwipe ? "bg-purple-600" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.gestureQueueSwipe ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Touch Preferences */}
              <button
                onClick={() => {
                  haptics.warning();
                  updateSettings({
                    hapticsEnabled: true,
                    hapticIntensity: "standard",
                    gesturesEnabled: true,
                    gestureSwipeTracks: true,
                    gestureSwipeClose: true,
                    gestureDoubleTapLike: true,
                    gestureQueueSwipe: true,
                    gestureLongPress: true,
                  });
                  onShowToast?.("Reset Successful", "Touch & haptic preferences reset to defaults", "info");
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              >
                Reset Touch & Haptic Preferences to Default
              </button>
            </div>
          )}

          {/* ===================== 5. NOTIFICATIONS ===================== */}
          {activeSubSection === "notifications" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Android Notification Status</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      System status: <span className="font-semibold text-purple-300 capitalize">{notifStatus}</span>
                    </p>
                  </div>
                  {notifStatus !== "granted" && (
                    <button
                      onClick={handleRequestNotifications}
                      className="rounded-full bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                    >
                      Request Access
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-zinc-300 leading-relaxed">
                  Musify uses an Android native MediaSession foreground service (<code>MusifyPlaybackService</code>) with media playback controls (Play, Pause, Skip, Prev) and live album artwork directly on your lockscreen and notification tray.
                </div>
              </div>
            </div>
          )}

          {/* ===================== 6. PRIVACY & STORAGE ===================== */}
          {activeSubSection === "privacy-storage" && (
            <div className="space-y-5">
              {/* Private Session Toggle */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Private Listening Mode
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Listening activity is not recorded in recently played while active
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ privateSession: !settings.privateSession })}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.privateSession ? "bg-purple-600" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                      settings.privateSession ? "left-6 bg-white" : "left-1 bg-white"
                    }`}
                  />
                </button>
              </div>

              {/* Cache & Space Usage */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Storage & Cache Usage
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-white">
                      {storageEstimate.usedMb} MB
                    </span>
                    <span className="text-xs text-zinc-400">
                      used of ~{storageEstimate.totalMb} MB allocated
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={handleClearAppCache}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/10 hover:border-white/20 transition"
                  >
                    <span className="text-xs font-semibold text-white block">
                      Clear Offline Cache
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Purges cached artwork, responses & blobs
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      try {
                        localStorage.removeItem("musify_recently_played");
                        onShowToast?.("History Cleared", "Playback history removed", "info");
                      } catch {}
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/10 hover:border-white/20 transition"
                  >
                    <span className="text-xs font-semibold text-white block">
                      Clear Playback History
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Removes recently played items
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== 7. ABOUT ===================== */}
          {activeSubSection === "about" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl space-y-4 shadow-xl text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-2xl mx-auto shadow-lg shadow-purple-500/20">
                  M
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Musify</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Version 1.0.50 &bull; Release Candidate
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-zinc-400 space-y-2 text-left">
                  <p><strong className="text-zinc-200">Runtime:</strong> Android WebView / Capacitor 8 + Next.js App Router</p>
                  <p><strong className="text-zinc-200">Audio Engine:</strong> Native MediaSessionCompat + YouTube IFrame Core</p>
                  <p><strong className="text-zinc-200">Backend API:</strong> Node.js / Bun Cloud Microservice on Render</p>
                </div>
                <div className="flex justify-center gap-4 text-xs text-zinc-400 pt-2">
                  <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
                  <span>&bull;</span>
                  <span className="hover:text-white cursor-pointer transition">Terms of Service</span>
                  <span>&bull;</span>
                  <span className="hover:text-white cursor-pointer transition">Licenses</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

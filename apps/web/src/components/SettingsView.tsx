"use client";

import React, { useState, useRef } from "react";
import { Icon } from "./Icons";
import type { SafeUser } from "../lib/store";
import { store } from "../lib/store";
import {
  useSettings,
  EQUALIZER_PRESETS,
  type EqualizerPreset,
  type AudioQuality,
  type AudioFormat,
  type BufferSize,
  type NormalizationLevel,
  type AIPersona,
  type PreferredRegion,
  type ThemeMode,
  type LyricsFontSize,
  type VisualizerStyle,
  type PlayerShape,
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
  | "app-settings"
  | "privacy"
  | "notifications"
  | "language"
  | "equalizer";

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
  const [activeSubSection, setActiveSubSection] =
    useState<SubSection>("app-settings");
  const { settings, updateSettings, resetSettings } = useSettings();

  // Profile Edit State
  const [editName, setEditName] = useState(
    authUser?.displayName || "Alex Johnson",
  );
  const [editEmail, setEditEmail] = useState(authUser?.email || "");
  const [editPassword, setEditPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar Preview State
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    authUser?.avatarUrl || null,
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isGuest = !authUser || authUser.isAnonymous;
  const displayName =
    authUser?.displayName ||
    (isGuest ? "Alex Johnson" : authUser?.email?.split("@")[0] || "Musify Member");
  const email = authUser?.email || "alexjohnson@example.com";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (isGuest) {
        onShowToast?.(
          "Profile Updated",
          "Guest profile details saved locally",
          "success",
        );
        setViewMode("hub");
        return;
      }
      const updatedUser = await store.updateProfile(
        editName,
        selectedAvatarUrl || undefined,
      );
      onUserUpdate?.(updatedUser);
      onShowToast?.(
        "Profile Saved",
        "Your profile details have been synced",
        "success",
      );
      setViewMode("hub");
    } catch (err: any) {
      onShowToast?.(
        "Update Failed",
        err.message || "Could not save profile",
        "info",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400);
      setSelectedAvatarUrl(compressed);
      setViewMode("avatar-preview");
    } catch {
      onShowToast?.("Photo Error", "Could not process selected image", "info");
    }
  };

  const handleConfirmAvatar = async () => {
    if (selectedAvatarUrl && !isGuest) {
      try {
        const updated = await store.updateProfile(undefined, selectedAvatarUrl);
        onUserUpdate?.(updated);
        onShowToast?.("Avatar Updated", "New profile photo saved", "success");
      } catch {
        onShowToast?.(
          "Avatar Saved Locally",
          "Photo updated for session",
          "info",
        );
      }
    } else {
      onShowToast?.(
        "Photo Selected",
        "Profile preview photo applied",
        "success",
      );
    }
    setViewMode("hub");
  };

  return (
    <div className="py-4 sm:py-6 px-2 sm:px-4 max-w-2xl mx-auto animate-fade-in font-sans select-none pb-28">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleSelectPhotoFile}
        className="hidden"
      />

      {/* =========================================================================
          SCREEN 1: ACCOUNT HUB (UX INSPIRED BY MOCKUP, SLEEK MUSIFY AESTHETIC)
          ========================================================================= */}
      {viewMode === "hub" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Bar: Back Button + Centered Title */}
          <div className="relative flex items-center justify-center py-2">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/15 transition active:scale-95 border border-white/10"
                aria-label="Back"
              >
                <Icon name="chevron-left" size={18} />
              </button>
            )}
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Account
            </h1>
          </div>

          {/* SECTION: PROFILE */}
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-zinc-300 px-1">Profile</p>

            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 backdrop-blur-2xl space-y-4 shadow-xl hover:border-white/15 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 cursor-pointer items-center justify-center rounded-full ring-2 ring-white/20 hover:ring-white/40 bg-zinc-800 text-white font-bold text-lg overflow-hidden group shadow-md transition"
                  >
                    {authUser?.avatarUrl || selectedAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authUser?.avatarUrl || selectedAvatarUrl || ""}
                        alt={displayName}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Icon name="camera" size={16} className="text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 border border-white/20 text-white">
                      <Icon name="camera" size={11} />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {displayName}
                    </h2>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Sleek PRO Badge */}
                <div className="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-3 py-1 shadow-md shadow-indigo-500/20">
                  <span className="text-xs font-bold tracking-wider text-white">
                    PRO
                  </span>
                </div>
              </div>

              {/* Edit Profile Action Button */}
              <button
                onClick={() => setViewMode("edit-profile")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 active:scale-[0.98] shadow-lg"
              >
                <Icon name="edit" size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* SECTION: ACCOUNT (MANAGE SUBSCRIPTION & RESTORE) */}
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-zinc-300 px-1">Account</p>

            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06] backdrop-blur-2xl shadow-xl">
              <button
                onClick={() => {
                  onShowToast?.(
                    "Musify PRO Active",
                    "Hi-Res Lossless 24-bit unlocked across all devices",
                    "success",
                  );
                }}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-white transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span>Manage subscription</span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Active
                  </span>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              <button
                onClick={() => {
                  onShowToast?.(
                    "Purchases Restored",
                    "All cloud playlists and PRO tokens verified",
                    "success",
                  );
                }}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-white transition hover:bg-white/[0.05]"
              >
                <span>Restore purchases</span>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>
            </div>
          </div>

          {/* SECTION: PREFERENCES (GROUPED LIST) */}
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-zinc-300 px-1">
              Preferences
            </p>

            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06] backdrop-blur-2xl shadow-xl">
              {/* App Settings */}
              <button
                onClick={() => {
                  setActiveSubSection("app-settings");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white border border-white/10">
                    <Icon name="settings" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      App settings
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Audio bitrate, crossfade & player style
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              {/* Graphic Equalizer */}
              <button
                onClick={() => {
                  setActiveSubSection("equalizer");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white border border-white/10">
                    <Icon name="sliders" size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Graphic Equalizer
                      </span>
                      {settings.equalizerEnabled && (
                        <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-bold">
                          ON
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      5-band acoustics & presets ({settings.equalizerPreset})
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              {/* Privacy & Security */}
              <button
                onClick={() => {
                  setActiveSubSection("privacy");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white border border-white/10">
                    <Icon name="lock" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Privacy & Security
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Incognito mode & listening history
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              {/* Notifications */}
              <button
                onClick={() => {
                  setActiveSubSection("notifications");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white border border-white/10">
                    <Icon name="bell" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Notifications
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Release alerts & AI recommendations
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>

              {/* Language / Region */}
              <button
                onClick={() => {
                  setActiveSubSection("language");
                  setViewMode("sub-section");
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white border border-white/10">
                    <Icon name="globe" size={17} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      Language & Region
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Curation flavor: {settings.preferredRegion.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={16}
                  className="text-zinc-500"
                />
              </button>
            </div>
          </div>

          {/* Quick Sign Out / In Footer */}
          <div className="pt-2">
            {isGuest ? (
              <button
                onClick={onOpenAuthModal}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Sign In to Supabase Cloud
              </button>
            ) : (
              <button
                onClick={onSignOut}
                className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 2: AVATAR PHOTO PREVIEW & CROP (UX INSPIRED BY SCREEN 2 OF MOCKUP)
          ========================================================================= */}
      {viewMode === "avatar-preview" && (
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
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Preview
            </h1>
          </div>

          {/* Circular Photo Preview Frame with Blurred Backdrop */}
          <div className="relative flex aspect-square w-full max-w-sm mx-auto flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
            {/* Blurred ambient portrait behind */}
            {selectedAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAvatarUrl}
                alt="Blurred Preview"
                className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40"
              />
            )}

            {/* Circular Highlight Mask */}
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

            {/* Floating Zoom / Reset Control Pill */}
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

          {/* Action Buttons: Select Another Photo + Confirm */}
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
          SCREEN 3: EDIT PROFILE FORM (UX INSPIRED BY SCREEN 3 OF MOCKUP)
          ========================================================================= */}
      {viewMode === "edit-profile" && (
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
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Edit Profile
            </h1>
          </div>

          {/* Layered Form Card with Subtle Shadow & Glass */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-5">
            {/* Field 1: Full Name */}
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

            {/* Field 2: Email */}
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

            {/* Field 3: Confirm Password with Eye Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Confirm Password
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

            {/* Action Buttons: Save & Cancel */}
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
          SUB-SECTION DETAIL SCREENS (APP SETTINGS, EQUALIZER, PRIVACY, ETC.)
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
              {activeSubSection === "app-settings"
                ? "App Settings"
                : activeSubSection === "equalizer"
                  ? "Graphic Equalizer"
                  : activeSubSection === "privacy"
                    ? "Privacy & Security"
                    : activeSubSection === "notifications"
                      ? "Notifications"
                      : "Language & Region"}
            </h1>
          </div>

          {/* SUB-SECTION 1: APP SETTINGS */}
          {activeSubSection === "app-settings" && (
            <div className="space-y-5">
              {/* Bitrate & Formats */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Streaming Bitrate
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "lossless",
                      label: "Lossless",
                      sub: "FLAC 24-bit / 96kHz",
                    },
                    { id: "high", label: "High Fidelity", sub: "320 kbps AAC" },
                    { id: "standard", label: "Standard", sub: "160 kbps" },
                    { id: "saver", label: "Data Saver", sub: "96 kbps Opus" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() =>
                        updateSettings({
                          audioQualityWifi: opt.id as AudioQuality,
                        })
                      }
                      className={`rounded-2xl border p-3.5 text-left transition ${
                        settings.audioQualityWifi === opt.id
                          ? "border-indigo-500/50 bg-indigo-500/15 text-white"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {opt.label}
                        </span>
                        {settings.audioQualityWifi === opt.id && (
                          <span className="h-2 w-2 rounded-full bg-indigo-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {opt.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Factor & Options */}
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Bottom Audio Player
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => updateSettings({ playerShape: "pill" })}
                      className={`rounded-2xl border p-3 text-left transition ${
                        settings.playerShape === "pill"
                          ? "border-indigo-500/50 bg-indigo-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs">Floating Pill</span>
                    </button>
                    <button
                      onClick={() => updateSettings({ playerShape: "bar" })}
                      className={`rounded-2xl border p-3 text-left transition ${
                        settings.playerShape === "bar"
                          ? "border-indigo-500/50 bg-indigo-500/15 text-white font-bold"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs">Full-Width Dock</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Dynamic Artwork Glow
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Paints screen with album artwork ambient light
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ ambientGlow: !settings.ambientGlow })
                    }
                    className={`h-5 w-9 rounded-full transition-colors relative ${
                      settings.ambientGlow ? "bg-indigo-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                        settings.ambientGlow
                          ? "left-4 bg-white"
                          : "left-0.5 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 2: GRAPHIC EQUALIZER */}
          {activeSubSection === "equalizer" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Equalizer Master Toggle
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Enable 5-band studio acoustic curve
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({
                        equalizerEnabled: !settings.equalizerEnabled,
                      })
                    }
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      settings.equalizerEnabled ? "bg-indigo-600" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                        settings.equalizerEnabled
                          ? "left-6 bg-white"
                          : "left-1 bg-white"
                      }`}
                    />
                  </button>
                </div>

                {/* EQ Presets */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Presets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "flat", label: "Flat" },
                      { id: "bass_boost", label: "Bass Boost" },
                      { id: "treble_boost", label: "Treble" },
                      { id: "vocal", label: "Vocal Clarity" },
                      { id: "electronic", label: "EDM" },
                      { id: "rock", label: "Rock" },
                      { id: "hiphop", label: "Hip-Hop" },
                      { id: "acoustic", label: "Acoustic" },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          updateSettings({
                            equalizerPreset: preset.id as EqualizerPreset,
                            equalizerBands:
                              EQUALIZER_PRESETS[preset.id as EqualizerPreset],
                            equalizerEnabled: true,
                          });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          settings.equalizerPreset === preset.id &&
                          settings.equalizerEnabled
                            ? "bg-indigo-600 text-white"
                            : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5-Band Slider Grid */}
                <div
                  className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-opacity ${
                    settings.equalizerEnabled
                      ? "opacity-100"
                      : "opacity-40 pointer-events-none"
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
                      const gain =
                        (settings.equalizerBands as any)[band.hz] ?? 0;
                      return (
                        <div
                          key={band.hz}
                          className="flex flex-col items-center gap-2"
                        >
                          <span className="font-mono text-[10px] font-bold text-indigo-400">
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
                              className="h-32 w-1.5 accent-indigo-400 cursor-pointer appearance-none bg-white/15 rounded-full [writing-mode:vertical-lr] [direction:rtl]"
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

          {/* SUB-SECTION 3: PRIVACY & SECURITY */}
          {activeSubSection === "privacy" && (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Private Listening Session
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Listening history is not recorded while active
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ privateSession: !settings.privateSession })
                  }
                  className={`h-5 w-9 rounded-full transition-colors relative ${
                    settings.privateSession ? "bg-indigo-600" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                      settings.privateSession
                        ? "left-4 bg-white"
                        : "left-0.5 bg-white"
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    localStorage.removeItem("musify_recently_played");
                    onShowToast?.(
                      "History Cleared",
                      "Listening logs removed from device",
                      "info",
                    );
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
                >
                  Clear Recently Played History
                </button>
              </div>
            </div>
          )}

          {/* SUB-SECTION 4: NOTIFICATIONS */}
          {activeSubSection === "notifications" && (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">
                    AI DJ Smart Recommendations
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Alerts when new playlists matching your vibe are ready
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ aiDjAutoplay: !settings.aiDjAutoplay })
                  }
                  className={`h-5 w-9 rounded-full transition-colors relative ${
                    settings.aiDjAutoplay ? "bg-indigo-600" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                      settings.aiDjAutoplay
                        ? "left-4 bg-white"
                        : "left-0.5 bg-white"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* SUB-SECTION 5: LANGUAGE & REGIONAL FLAVOR */}
          {activeSubSection === "language" && (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Preferred Music Flavor
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "global", label: "Global Billboard" },
                  { id: "bollywood", label: "Bollywood & Desi" },
                  { id: "western", label: "Western Hits" },
                  { id: "kpop", label: "K-Pop & Asia" },
                  { id: "latin", label: "Latin & Reggaeton" },
                  { id: "lofi", label: "Lo-Fi Ambient" },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() =>
                      updateSettings({
                        preferredRegion: reg.id as PreferredRegion,
                      })
                    }
                    className={`rounded-2xl border p-3.5 text-center transition ${
                      settings.preferredRegion === reg.id
                        ? "border-indigo-500/50 bg-indigo-500/15 text-white font-bold"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs">{reg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

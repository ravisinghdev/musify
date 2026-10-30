"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icons";
import type { SafeUser } from "../lib/store";
import { store } from "../lib/store";

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onOpenDedicatedSettings?: () => void;
  onUserUpdate?: (user: SafeUser) => void;
}

/**
 * Optimizes and crops user photo to square 400x400 JPEG for crisp display and fast cloud sync
 */
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

export function UserProfileModal({
  isOpen,
  onClose,
  authUser,
  favoritesCount = 0,
  playlistsCount = 0,
  historyCount = 0,
  onOpenAuthModal,
  onSignOut,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onShowToast,
  onOpenDedicatedSettings,
  onUserUpdate,
}: UserProfileModalProps) {
  const isGuest = !authUser || authUser.isAnonymous;
  const initialName =
    authUser?.displayName ||
    (isGuest ? "Musify Member" : authUser?.email?.split("@")[0] || "Musify Member");
  const email = authUser?.email || "Local Guest Session";

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    authUser?.avatarUrl || null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if authUser changes
  useEffect(() => {
    if (authUser) {
      setDisplayName(authUser.displayName || authUser.email?.split("@")[0] || "Musify Member");
      setAvatarPreview(authUser.avatarUrl || null);
    }
  }, [authUser]);

  if (!isOpen) return null;

  const initials = (displayName || "U").slice(0, 2).toUpperCase();

  const handleSelectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400);
      setAvatarPreview(compressed);
      setIsEditing(true);
      onShowToast?.("Photo Ready", "Click Save Changes to update your profile photo", "info");
    } catch {
      onShowToast?.("Photo Error", "Could not process selected image", "info");
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      onShowToast?.("Name Required", "Display name cannot be empty", "info");
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await store.updateProfile(
        displayName.trim(),
        avatarPreview || undefined,
      );
      onUserUpdate?.(updatedUser);
      setIsEditing(false);
      onShowToast?.("Profile Updated", "Your profile changes were saved successfully", "success");
    } catch (err: any) {
      onShowToast?.("Update Failed", err.message || "Could not save profile details", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(initialName);
    setAvatarPreview(authUser?.avatarUrl || null);
    setIsEditing(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="User Profile"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e16]/85 p-6 backdrop-blur-2xl shadow-2xl space-y-6"
      >
        {/* Subtle Ambient Background Light */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-600/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-600/15 blur-[90px]" />

        {/* Hidden File Input for Avatar Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleSelectPhoto}
          className="hidden"
        />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon name="user" size={16} />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Profile
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Profile Card & Avatar */}
        <div className="relative z-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Clickable Avatar Photo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile photo"
              className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full ring-2 ring-white/20 hover:ring-white/50 bg-zinc-800 text-white font-bold text-xl overflow-hidden group shadow-lg transition"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <span>{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                <Icon name="camera" size={16} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 border border-white/20 text-white shadow-sm">
                <Icon name="camera" size={11} />
              </span>
            </div>

            {/* User Info / Edit Input */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none transition"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">
                      {displayName}
                    </h3>
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-sm">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          <div className="mt-3.5 pt-3 border-t border-white/[0.06]">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center rounded-xl bg-white py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition active:scale-[0.98] shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 py-2 text-xs font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 py-2 text-xs font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
              >
                <Icon name="edit" size={13} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Statistics Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl">
            <span className="text-base font-bold text-white block">
              {playlistsCount}
            </span>
            <span className="text-[11px] text-zinc-400">Playlists</span>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl">
            <span className="text-base font-bold text-white block">
              {favoritesCount}
            </span>
            <span className="text-[11px] text-zinc-400">Favorites</span>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl">
            <span className="text-base font-bold text-white block">
              {historyCount}
            </span>
            <span className="text-[11px] text-zinc-400">Played</span>
          </div>
        </div>

        {/* Settings Navigation Option (Primary Option as Requested) */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06] backdrop-blur-xl">
          {onOpenDedicatedSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenDedicatedSettings();
              }}
              className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-white/[0.06] group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition">
                  <Icon name="settings" size={18} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">
                    Settings & Studio
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Acoustics, equalizer, theme & cloud sync
                  </span>
                </div>
              </div>
              <Icon
                name="chevron-right"
                size={16}
                className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition"
              />
            </button>
          )}

          {/* Sleep Timer Option */}
          {onOpenSleepTimer && (
            <button
              onClick={onOpenSleepTimer}
              className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-white/[0.06] group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white border border-white/10 group-hover:scale-105 transition">
                  <Icon name="clock" size={17} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">
                    Sleep Timer
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {sleepTimerRemaining
                      ? `Active (${sleepTimerRemaining}m left)`
                      : "Fade out audio automatically"}
                  </span>
                </div>
              </div>
              <Icon
                name="chevron-right"
                size={16}
                className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition"
              />
            </button>
          )}
        </div>

        {/* Footer: Sign in or Sign out */}
        <div className="relative z-10 pt-1">
          {isGuest ? (
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal?.();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition active:scale-[0.98]"
            >
              <Icon name="user" size={14} />
              <span>Sign In to Cloud Account</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onSignOut?.();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-[0.98]"
            >
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

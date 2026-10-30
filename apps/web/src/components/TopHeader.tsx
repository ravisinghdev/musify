"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import type { SafeUser } from "../lib/store";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

export interface UserProfileInfo {
  name: string;
  email: string;
  avatarUrl: string;
  tier: string;
  qualityBadge: string;
}

export interface TopHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  suggestions?: string[];
  showSuggestions?: boolean;
  onSelectSuggestion?: (q: string) => void;
  onCloseSuggestions?: () => void;
  onClearQuery?: () => void;
  onOpenMobileMenu?: () => void;
  authUser?: SafeUser | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  user?: UserProfileInfo;
  notifications?: NotificationItem[];
  onClearNotifications?: () => void;
  onShowToast?: (
    title: string,
    sub?: string,
    type?: "success" | "info" | "heart",
  ) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

const DEFAULT_USER: UserProfileInfo = {
  name: "Musify Member",
  email: "guest@musify.io",
  avatarUrl: "/icon-192.png",
  tier: "Musify Hi-Fi Lossless",
  qualityBadge: "Lossless",
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New Release: Die With A Smile",
    message: "Lady Gaga & Bruno Mars is trending #1",
    time: "10m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Playlist Refreshed",
    message: "Lo-Fi Beats added 5 new ambient tracks",
    time: "2h ago",
    unread: true,
  },
  {
    id: "3",
    title: "Discover Weekly Ready",
    message: "25 songs tailored to your listening habits",
    time: "Yesterday",
    unread: false,
  },
];

export function TopHeader({
  query,
  onQueryChange,
  suggestions = [],
  showSuggestions = false,
  onSelectSuggestion,
  onCloseSuggestions,
  onClearQuery,
  onOpenMobileMenu,
  authUser,
  onOpenAuthModal,
  onSignOut,
  user = DEFAULT_USER,
  notifications = DEFAULT_NOTIFICATIONS,
  onClearNotifications,
  onShowToast,
  searchInputRef,
  className = "",
}: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Close menus & suggestion box when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        onCloseSuggestions?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCloseSuggestions]);

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <header
      className={`relative flex h-[80px] items-center justify-between gap-2 sm:gap-4 border-b border-white/[0.05] ${className}`}
    >
      {/* Left: Hamburger + Search */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden shrink-0"
          >
            <Icon name="menu" size={20} />
          </button>
        )}
        <div ref={searchBoxRef} className="relative w-full max-w-[520px]">
          <label className="flex w-full items-center gap-3 rounded-full border border-white/[0.08] px-4 py-2.5 shadow-inner backdrop-blur-md transition focus-within:border-white/20 focus-within:backdrop-blur-2xl">
            <Icon name="search" size={16} className="text-zinc-400" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onCloseSuggestions?.();
                }
              }}
              placeholder="Search for songs, artists, albums, or playlists..."
              className="w-full min-w-0 bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
            />
            {query ? (
              <button
                onClick={onClearQuery}
                className="text-xs text-zinc-500 hover:text-white transition"
              >
                <Icon name="close" size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                /
              </kbd>
            )}
          </label>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-1.5 shadow-2xl backdrop-blur-2xl animate-fade-in max-h-72 overflow-y-auto custom-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => onSelectSuggestion && onSelectSuggestion(item)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Icon name="search" size={14} className="text-zinc-500" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Notifications Bell & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition shadow-sm ${
              showNotifications
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/20"
            }`}
          >
            <Icon name="bell" size={17} />
            {hasUnread && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
            )}
          </button>

          {showNotifications && (
            <>
              {/* Mobile overlay backdrop — closes panel on tap outside */}
              <div
                className="fixed inset-0 z-40 sm:hidden"
                onClick={() => setShowNotifications(false)}
              />
              {/* Panel: bottom-sheet on mobile, dropdown on desktop */}
              <div className="fixed bottom-[92px] left-2 right-2 z-50 rounded-2xl border border-white/10 bg-[#0f1117]/95 p-4 shadow-2xl backdrop-blur-2xl animate-fade-in sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearNotifications?.();
                        onShowToast?.(
                          "Notifications cleared",
                          undefined,
                          "info",
                        );
                        setShowNotifications(false);
                      }}
                      className="text-[11px] font-medium text-zinc-400 hover:text-white transition"
                    >
                      Clear all
                    </button>
                    {/* Close button only on mobile */}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="sm:hidden flex items-center justify-center h-5 w-5 rounded-full bg-white/10 text-zinc-400 hover:text-white transition"
                      aria-label="Close notifications"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 max-h-[45vh] sm:max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/5 cursor-pointer"
                    >
                      <div
                        className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                          notif.unread ? "bg-indigo-400" : "bg-zinc-600"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-zinc-600 mt-1 block">
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* PWA / Android Install Trigger */}
        <InstallPwaButton onShowToast={onShowToast} />

        {/* Profile Avatar or Guest Sign In */}
        {!authUser || authUser.isAnonymous ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl transition hover:bg-white/15 hover:border-white/20 active:scale-95"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-zinc-300">
              <Icon name="user" size={13} />
            </div>
            <span>Sign In</span>
          </button>
        ) : (
          <div ref={profileRef} className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Profile & Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border border-white/20 ring-2 ring-white/5 shadow-lg cursor-pointer transition hover:scale-105 bg-indigo-600/40 text-white font-bold text-xs"
            >
              {authUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.displayName || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {(authUser.displayName || authUser.email || "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>

            {showProfileMenu && (
              <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 p-3 shadow-2xl backdrop-blur-2xl animate-fade-in z-50">
                <div className="border-b border-white/[0.06] pb-3 px-2">
                  <p className="text-xs font-bold text-white truncate">
                    {authUser.displayName || "Musify Member"}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {authUser.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Cloud Synced
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onShowToast?.(
                        "Audio Quality",
                        "FLAC 24-bit / 96kHz Lossless Active",
                        "info",
                      );
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <span>Audio Quality</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Lossless
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut?.();
                    }}
                    className="flex w-full items-center rounded-xl px-2.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

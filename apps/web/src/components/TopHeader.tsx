"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import { NotificationPanel } from "./NotificationPanel";
import type { SafeUser } from "../lib/store";
import type { AppNotification } from "../lib/notifications";

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
  notifications?: AppNotification[];
  notificationsLoading?: boolean;
  onClearNotifications?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onShowToast?: (
    title: string,
    sub?: string,
    type?: "success" | "info" | "heart",
  ) => void;
  onOpenProfile?: () => void;
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

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "track",
    title: "New Release: Die With A Smile",
    message: "Lady Gaga & Bruno Mars is trending #1",
    isRead: false,
    isSystem: true,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "playlist",
    title: "Playlist Refreshed",
    message: "Lo-Fi Beats added 5 new ambient tracks",
    isRead: false,
    isSystem: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "info",
    title: "Discover Weekly Ready",
    message: "25 songs tailored to your listening habits",
    isRead: true,
    isSystem: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
  notificationsLoading = false,
  onClearNotifications,
  onMarkAsRead,
  onMarkAllRead,
  onDeleteNotification,
  onShowToast,
  onOpenProfile,
  searchInputRef,
  className = "",
}: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const handleStartVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast?.("Voice Search", "Voice input is not supported in this browser", "info");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          onQueryChange(spoken);
          onShowToast?.("Voice Recognized", `Searching: "${spoken}"`, "success");
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch {
      setIsListening(false);
    }
  };

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  return (
    <header
      className={`relative flex h-[76px] sm:h-[80px] items-center justify-between gap-2.5 sm:gap-4 border-b border-white/[0.06] ${className}`}
    >
      {/* Left: Hamburger + Spacious Responsive Search Box */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 lg:hidden shrink-0 shadow-sm"
          >
            <Icon name="menu" size={20} />
          </button>
        )}

        <div ref={searchBoxRef} className="relative w-full max-w-[540px]">
          <label className="flex w-full items-center gap-2.5 sm:gap-3 rounded-full border border-white/15 px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-inner backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-white/[0.07] focus-within:backdrop-blur-2xl">
            <Icon name="search" size={16} className="text-zinc-400 shrink-0" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onCloseSuggestions?.();
                }
              }}
              placeholder="Search songs, artists, albums..."
              className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleStartVoiceSearch}
                title={isListening ? "Listening... Speak now" : "Search by voice"}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon name="mic" size={14} />
              </button>

              {query ? (
                <button
                  type="button"
                  onClick={onClearQuery}
                  className="text-xs text-zinc-400 hover:text-white transition p-1 rounded-full hover:bg-white/10"
                >
                  <Icon name="close" size={14} />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                  /
                </kbd>
              )}
            </div>
          </label>

          {/* Autocomplete Suggestions — Full-Width Floating Sheet on Mobile, Anchored on Desktop */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="fixed left-3 right-3 top-[76px] sm:absolute sm:left-0 sm:right-0 sm:top-full sm:w-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-white/15 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-3xl animate-fade-in max-h-80 overflow-y-auto custom-scrollbar">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between border-b border-white/5 mb-1">
                <span>Suggestions</span>
                <span className="text-[9px] text-zinc-600">
                  Press Esc to close
                </span>
              </div>
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => onSelectSuggestion && onSelectSuggestion(item)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition shrink-0">
                      <Icon name="search" size={13} />
                    </div>
                    <span className="truncate">{item}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition shrink-0">
                    Search ↵
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Notifications Bell & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition shadow-sm ${
              showNotifications
                ? "border-white/30 text-white"
                : "border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 active:scale-95"
            }`}
          >
            <Icon name="bell" size={17} />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.9)] ring-2 ring-[#07090e]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel
              notifications={notifications}
              isLoading={notificationsLoading}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={(id) => onMarkAsRead?.(id)}
              onMarkAllRead={() => {
                onMarkAllRead?.();
                onShowToast?.("All marked as read", undefined, "info");
              }}
              onDeleteNotification={(id) => onDeleteNotification?.(id)}
              onClearAll={() => {
                onClearNotifications?.();
                onShowToast?.("Notifications cleared", undefined, "info");
                setShowNotifications(false);
              }}
            />
          )}
        </div>

        {/* PWA / Android Install Trigger — Hidden on mobile to keep search bar roomy, available in drawer */}
        <div className="hidden sm:block">
          <InstallPwaButton onShowToast={onShowToast} />
        </div>

        {/* Profile Avatar or Guest Sign In */}
        {!authUser || authUser.isAnonymous ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl transition hover:bg-white/15 hover:border-white/20 active:scale-95"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-300">
              <Icon name="user" size={13} />
            </div>
            <span className="hidden xs:inline">Sign In</span>
          </button>
        ) : (
          <div ref={profileRef} className="relative">
            <div
              onClick={() => (onOpenProfile ? onOpenProfile() : setShowProfileMenu(!showProfileMenu))}
              title="Profile & Preferences"
              className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border border-white/20 ring-2 ring-white/5 shadow-lg cursor-pointer transition hover:scale-105 active:scale-95 bg-indigo-600/40 text-white font-bold text-xs"
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
              <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-black/85 p-3 shadow-2xl backdrop-blur-2xl animate-fade-in z-50">
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

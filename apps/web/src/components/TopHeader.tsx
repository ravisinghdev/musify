"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import { NotificationPanel } from "./NotificationPanel";
import type { SafeUser } from "../lib/store";
import type { AppNotification } from "../lib/notifications";
import { AppLogo } from "./AppLogo";
import { haptics } from "../lib/haptics";

export interface UserProfileInfo {
  name: string;
  email: string;
  avatarUrl: string;
  tier: string;
  qualityBadge: string;
}

export interface TopHeaderProps {
  query?: string;
  onQueryChange?: (q: string) => void;
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
  avatarUrl: "/musify_logo.png",
  tier: "Musify Hi-Fi Lossless",
  qualityBadge: "Lossless",
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

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
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onShowToast?.(
        "Voice Search",
        "Voice input is not supported in this browser",
        "info",
      );
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
          onQueryChange?.(spoken);
          onShowToast?.(
            "Voice Recognized",
            `Searching: "${spoken}"`,
            "success",
          );
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
      className={`sticky top-0 z-30 flex min-h-[72px] sm:min-h-[80px] pt-[max(env(safe-area-inset-top,0px),0px)] items-center justify-between gap-2.5 sm:gap-4 border-b border-white/[0.06] backdrop-blur-2xl bg-[#090A0F]/85 transition-colors -mx-4 sm:-mx-8 lg:-mx-9 px-4 sm:px-8 lg:px-9 ${className}`}
    >
      {/* Left: Hamburger (Mobile) + Brand Logo */}
      <div className="flex min-w-0 items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={() => {
              onOpenMobileMenu();
            }}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 lg:hidden shrink-0 shadow-sm"
          >
            <Icon name="menu" size={20} />
          </button>
        )}

        <AppLogo />
      </div>

      {/* Right Controls: Notifications Bell & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            aria-label="Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition shadow-sm ${
              showNotifications
                ? "border-white/30 text-[#F5F5F7] bg-[#292B4B]/40"
                : "border-white/[0.08] text-[#A1A4B2] hover:text-[#F5F5F7] hover:border-white/20 active:scale-95 bg-[#12141C]/60"
            }`}
          >
            <Icon name="bell" size={17} />
            {mounted && hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A5A9FF] px-1 text-[9px] font-bold text-[#090A0F] shadow-[0_0_8px_rgba(165,169,255,0.7)] ring-2 ring-[#090A0F]">
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

        {/* Direct Download App Button (Android APK / Windows) — Always visible across mobile & desktop */}
        <div className="flex items-center shrink-0">
          <InstallPwaButton onShowToast={onShowToast} />
        </div>

        {/* Profile Avatar or Guest Sign In */}
        <div suppressHydrationWarning className="relative flex items-center">
          {!authUser || authUser.isAnonymous ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 rounded-2xl border border-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#F5F5F7] bg-[#12141C]/80 backdrop-blur-xl transition hover:bg-white/15 hover:border-white/20 active:scale-95"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full text-[#A1A4B2]">
                <Icon name="user" size={13} />
              </div>
              <span className="hidden xs:inline">Sign In</span>
            </button>
          ) : (
            <div ref={profileRef} className="relative">
              <div
                onClick={() =>
                  onOpenProfile
                    ? onOpenProfile()
                    : setShowProfileMenu(!showProfileMenu)
                }
                title="Profile & Preferences"
                className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border border-white/20 ring-2 ring-white/5 shadow-lg cursor-pointer transition hover:scale-105 active:scale-95 bg-[#292B4B] text-[#A5A9FF] font-bold text-xs"
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
                <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-white/[0.10] bg-[#12141C]/95 p-3 shadow-2xl backdrop-blur-2xl animate-fade-in z-50">
                  <div className="border-b border-white/[0.06] pb-3 px-2">
                    <p className="text-xs font-bold text-[#F5F5F7] truncate">
                      {authUser.displayName || "Musify Member"}
                    </p>
                    <p className="text-[11px] text-[#A1A4B2] truncate">
                      {authUser.email}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#70D6A0]/30 bg-[#70D6A0]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#70D6A0]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#70D6A0]" />
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
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs text-[#A1A4B2] hover:bg-white/5 hover:text-[#F5F5F7] transition"
                    >
                      <span>Audio Quality</span>
                      <span className="text-[10px] font-mono text-[#70D6A0]">
                        Lossless
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onSignOut?.();
                      }}
                      className="flex w-full items-center rounded-xl px-2.5 py-2 text-left text-xs text-[#F17D85] hover:bg-[#F17D85]/10 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

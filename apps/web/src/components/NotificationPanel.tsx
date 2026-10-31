"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./Icons";
import type { AppNotification } from "../lib/notifications";

interface NotificationPanelProps {
  notifications: AppNotification[];
  isLoading?: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

const TYPE_EMOJIS: Record<string, string> = {
  track: "🎵",
  playlist: "🎶",
  achievement: "🏆",
  system: "🔔",
  info: "💡",
};

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function NotificationPanel({
  notifications,
  isLoading = false,
  onClose,
  onMarkAsRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAll,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadList = notifications.filter((n) => !n.isRead);
  const unreadCount = unreadList.length;

  const displayedList = activeTab === "unread" ? unreadList : notifications;

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-[2px] sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel container: just below top bar on both mobile & desktop */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notification panel"
        className="fixed top-[84px] left-2 right-2 z-50 rounded-3xl border border-white/[0.10] bg-[#12141C]/95 p-4 shadow-2xl backdrop-blur-2xl animate-fade-in sm:absolute sm:top-full sm:mt-2 sm:right-0 sm:left-auto sm:w-[380px] max-w-[calc(100vw-16px)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5F5F7]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#A5A9FF] px-1.5 text-[10px] font-bold text-[#090A0F] shadow-[0_0_10px_rgba(165,169,255,0.4)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] font-medium text-[#A5A9FF] hover:text-[#888EFF] transition hover:underline"
              >
                Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] font-medium text-[#A1A4B2] hover:text-[#F17D85] transition"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="sm:hidden flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#A1A4B2] hover:text-[#F5F5F7] transition"
              aria-label="Close notifications"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="flex gap-2 pt-2.5 pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition ${
                activeTab === "all"
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/20 shadow-sm"
                  : "bg-white/[0.03] text-[#A1A4B2] hover:bg-white/[0.06] hover:text-[#F5F5F7]"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition ${
                activeTab === "unread"
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/20 shadow-sm"
                  : "bg-white/[0.03] text-[#A1A4B2] hover:bg-white/[0.06] hover:text-[#F5F5F7]"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="mt-2 space-y-1.5 max-h-[min(420px,calc(100vh-220px))] overflow-y-auto custom-scrollbar pr-0.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#A5A9FF] border-t-transparent" />
              <p className="text-xs text-[#686C7B]">Syncing notifications…</p>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl shadow-inner mb-2">
                🔔
              </div>
              <p className="text-xs font-semibold text-[#A1A4B2]">
                {activeTab === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
              <p className="text-[11px] text-[#686C7B] mt-1 max-w-[220px]">
                {activeTab === "unread"
                  ? "You have caught up with all your updates!"
                  : "Activity like saved tracks, playlists, and releases will appear here."}
              </p>
            </div>
          ) : (
            displayedList.map((notif) => {
              const emoji = notif.icon || TYPE_EMOJIS[notif.type] || "🔔";

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) {
                      onMarkAsRead(notif.id);
                    }
                  }}
                  className={`group relative flex items-start gap-3 rounded-2xl p-2.5 transition-all cursor-pointer ${
                    notif.isRead
                      ? "bg-white/[0.02] hover:bg-white/[0.06] text-[#A1A4B2]"
                      : "bg-[#292B4B]/35 hover:bg-[#292B4B]/55 border border-[#A5A9FF]/20 text-[#F5F5F7]"
                  }`}
                >
                  {/* Artwork / Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.artworkUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={notif.artworkUrl}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover border border-white/10 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg shadow-inner">
                        {emoji}
                      </div>
                    )}
                    {!notif.isRead && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#A5A9FF] ring-2 ring-[#090A0F] shadow-[0_0_6px_rgba(165,169,255,0.9)]" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        notif.isRead ? "text-[#F5F5F7]/90" : "text-[#F5F5F7]"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-[#A1A4B2] mt-1 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#686C7B]">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                      {!notif.isRead && (
                        <span className="text-[10px] text-[#A5A9FF] font-medium">
                          • New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button (visible on hover or focus) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(notif.id);
                    }}
                    title="Delete notification"
                    aria-label="Delete notification"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#686C7B] hover:text-[#F17D85] hover:bg-[#F17D85]/10 rounded-lg shrink-0"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { AppLogo } from "./AppLogo";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import type { CustomPlaylist } from "../lib/store";
import { haptics } from "../lib/haptics";

export interface NavItem {
  name: string;
  icon: string;
}

export interface SidebarProps {
  activeNav: string;
  onSelectNav: (name: string) => void;
  playlists: CustomPlaylist[];
  activePlaylistId?: string;
  onSelectPlaylist: (playlist: CustomPlaylist) => void;
  onCreatePlaylist: () => void;
  onImportPlaylist?: () => void;
  onOpenRoom?: () => void;
  favoritesCount?: number;
  recentlyPlayedCount?: number;
  onOpenSettings?: () => void;
  navItems?: NavItem[];
  className?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Home", icon: "home" },
  { name: "Explore", icon: "compass" },
  { name: "AI Hub", icon: "sparkles" },
  { name: "Search", icon: "search" },
];

export function Sidebar({
  activeNav,
  onSelectNav,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onImportPlaylist,
  onOpenRoom,
  favoritesCount = 0,
  recentlyPlayedCount = 0,
  onOpenSettings,
  navItems = DEFAULT_NAV_ITEMS,
  className = "",
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      className={`hidden w-[240px] shrink-0 border-r border-white/[0.08] bg-[#12141C]/80 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col h-full overflow-hidden select-none z-10 overflow-y-auto ${className}`}
    >
      {/* Brand Logo */}
      <div className="mb-8 px-2">
        <AppLogo size="md" onClick={() => onSelectNav("Home")} />
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              onSelectNav(item.name);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
              activeNav === item.name
                ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold shadow-[0_0_12px_rgba(165,169,255,0.12)]"
                : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
            }`}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Library Section */}
      <div className="mb-2 mt-7 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#686C7B]">
          Library
        </p>
      </div>

      <nav className="space-y-1">
        <button
          onClick={() => onSelectNav("Recently played")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Recently played"
              ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold"
              : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
          }`}
        >
          <Icon name="clock" size={18} />
          <span>Recently played</span>
          {mounted && recentlyPlayedCount > 0 && (
            <span className="ml-auto text-[10px] text-[#686C7B] font-mono">
              {recentlyPlayedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectNav("Your favorites")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Your favorites"
              ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold"
              : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
          }`}
        >
          <Icon
            name={mounted && favoritesCount > 0 ? "heart-filled" : "heart"}
            size={18}
            className={mounted && favoritesCount > 0 ? "text-rose-500" : ""}
          />
          <span>Your favorites</span>
          {mounted && favoritesCount > 0 && (
            <span className="ml-auto text-[10px] text-[#686C7B] font-mono">
              {favoritesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectNav("Playlists")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Playlists"
              ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold"
              : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
          }`}
        >
          <Icon name="list" size={18} />
          <span>Playlists</span>
        </button>

        <button
          onClick={() => onSelectNav("Offline")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Offline"
              ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold"
              : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
          }`}
        >
          <Icon name="download" size={18} />
          <span>Downloaded</span>
        </button>

        <button
          onClick={() => onSelectNav("Stats")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Stats"
              ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold"
              : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
          }`}
        >
          <Icon name="sparkles" size={18} />
          <span>Sound Capsule</span>
        </button>

        {onOpenRoom && (
          <button
            onClick={onOpenRoom}
            className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition text-[#A5A9FF] hover:bg-[#292B4B]/40 hover:text-white"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#292B4B] text-[#A5A9FF]">
              <Icon name="sparkles" size={11} />
            </span>
            <span>Listen Together</span>
          </button>
        )}
      </nav>

      {/* Custom Playlists Section */}
      <div className="mb-2 mt-7 flex items-center justify-between px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#686C7B]">
          Playlists
        </p>
        <div className="flex items-center gap-1.5">
          {onImportPlaylist && (
            <button
              onClick={onImportPlaylist}
              aria-label="Import playlist"
              title="Import from Spotify / YouTube"
              className="flex h-5 w-5 items-center justify-center rounded-md text-[#A1A4B2] transition hover:bg-white/10 hover:text-[#F5F5F7]"
            >
              <Icon name="download" size={14} />
            </button>
          )}
          <button
            onClick={onCreatePlaylist}
            aria-label="Create playlist"
            title="Create new playlist"
            className="flex h-5 w-5 items-center justify-center rounded-md text-[#A1A4B2] transition hover:bg-white/10 hover:text-[#F5F5F7]"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Playlists List */}
      <div className="flex-1 min-h-0 space-y-1 pr-1 overflow-y-auto sidebar-scrollbar">
        {mounted && playlists.length > 0 ? (
          playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                activePlaylistId === pl.id && activeNav === "PlaylistDetail"
                  ? "bg-[#292B4B]/60 text-[#A5A9FF] font-semibold"
                  : "text-[#A1A4B2] hover:bg-[#25283A]/40 hover:text-[#F5F5F7]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {pl.artwork ? (
                <img
                  src={pl.artwork}
                  alt={pl.name}
                  className="h-7 w-7 rounded-md object-cover border border-white/5 shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#686C7B]">
                  <Icon name="music" size={12} />
                </div>
              )}
              <span className="truncate flex-1">{pl.name}</span>
              <span className="text-[10px] text-[#686C7B] font-mono">
                {pl.tracks.length}
              </span>
            </button>
          ))
        ) : (
          <button
            onClick={onCreatePlaylist}
            className="w-full text-left px-3 py-2 text-[11px] text-[#686C7B] hover:text-[#A1A4B2] transition flex items-center gap-2 rounded-xl border border-dashed border-white/10 hover:border-white/20"
          >
            <Icon name="plus" size={12} />
            <span>Create your first playlist</span>
          </button>
        )}
      </div>

      {/* Bottom Actions: Settings & PWA */}
      <div className="pt-3 shrink-0 border-t border-white/[0.08] mt-2 space-y-1 bg-transparent">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeNav === "Settings"
                ? "bg-[#292B4B]/70 text-[#A5A9FF] border border-[#A5A9FF]/20 font-semibold shadow-sm"
                : "text-[#A1A4B2] hover:bg-[#25283A]/50 hover:text-[#F5F5F7]"
            }`}
          >
            <Icon
              name="settings"
              size={18}
              className={
                activeNav === "Settings" ? "text-[#A5A9FF]" : "text-[#A1A4B2]"
              }
            />
            <span>Settings</span>
          </button>
        )}
        <InstallPwaButton variant="sidebar" />
      </div>
    </aside>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { AppLogo } from "./AppLogo";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import type { CustomPlaylist } from "../lib/store";
import type { NavItem } from "./Sidebar";

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Home", icon: "home" },
  { name: "Explore", icon: "compass" },
  { name: "AI Hub", icon: "sparkles" },
  { name: "Search", icon: "search" },
];

export function MobileNavDrawer({
  isOpen,
  onClose,
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
}: MobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (name: string) => {
    onSelectNav(name);
    onClose();
  };

  const handlePlaylistClick = (pl: CustomPlaylist) => {
    onSelectPlaylist(pl);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] lg:hidden transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel with smooth slide transition */}
      <aside
        className={`fixed inset-y-0 left-0 w-[300px] max-w-[85vw] border-r border-white/10 px-4 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] flex flex-col shadow-2xl backdrop-blur-3xl z-[100] transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-2 mb-4 shrink-0">
          <AppLogo size="md" onClick={() => handleNavClick("Home")} />

          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Body for all Nav & Playlists */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1 sidebar-scrollbar">
          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.name)}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeNav === item.name
                    ? "bg-white/[0.1] text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Library */}
          <div>
            <div className="mb-2 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
                Library
              </p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick("Recently played")}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeNav === "Recently played"
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon name="clock" size={18} />
                <span>Recently played</span>
                {mounted && recentlyPlayedCount > 0 && (
                  <span className="ml-auto text-[10px] text-zinc-500 font-mono">
                    {recentlyPlayedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick("Your favorites")}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeNav === "Your favorites"
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon
                  name={mounted && favoritesCount > 0 ? "heart-filled" : "heart"}
                  size={18}
                  className={mounted && favoritesCount > 0 ? "text-rose-500" : ""}
                />
                <span>Your favorites</span>
                {mounted && favoritesCount > 0 && (
                  <span className="ml-auto text-[10px] text-zinc-500 font-mono">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick("Playlists")}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeNav === "Playlists"
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon name="list" size={18} />
                <span>Playlists</span>
              </button>

              <button
                onClick={() => handleNavClick("Offline")}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeNav === "Offline"
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon name="download" size={18} />
                <span>Downloaded</span>
              </button>

              <button
                onClick={() => handleNavClick("Stats")}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activeNav === "Stats"
                    ? "bg-white/[0.1] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon name="sparkles" size={18} />
                <span>Sound Capsule</span>
              </button>

              {onOpenRoom && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRoom();
                  }}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/30 text-purple-300">
                    <Icon name="sparkles" size={11} />
                  </span>
                  <span>Listen Together</span>
                </button>
              )}
            </nav>
          </div>

          {/* Playlists */}
          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
                Playlists
              </p>
              <div className="flex items-center gap-1.5">
                {onImportPlaylist && (
                  <button
                    onClick={() => {
                      onImportPlaylist();
                      onClose();
                    }}
                    aria-label="Import playlist"
                    title="Import playlist"
                    className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon name="download" size={14} />
                  </button>
                )}
                <button
                  onClick={() => {
                    onCreatePlaylist();
                    onClose();
                  }}
                  aria-label="Create playlist"
                  className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon name="plus" size={15} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {mounted &&
                playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handlePlaylistClick(pl)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    activePlaylistId === pl.id && activeNav === "PlaylistDetail"
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pl.artwork}
                    alt={pl.name}
                    className="h-7 w-7 rounded-md object-cover border border-white/5 shrink-0"
                  />
                  <span className="truncate flex-1">{pl.name}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {pl.tracks.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions for Mobile (Fixed at bottom of drawer, above screen bottom) */}
        <div className="shrink-0 pt-3 border-t border-white/[0.08] space-y-1.5 mt-2">
          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeNav === "Settings"
                  ? "bg-white/[0.1] text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon
                name="settings"
                size={18}
                className={
                  activeNav === "Settings" ? "text-indigo-400" : "text-zinc-400"
                }
              />
              <span>Settings</span>
            </button>
          )}
          <InstallPwaButton variant="sidebar" />
        </div>
      </aside>
    </div>
  );
}

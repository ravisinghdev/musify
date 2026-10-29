"use client";

import React from "react";
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
  favoritesCount?: number;
  recentlyPlayedCount?: number;
  navItems?: NavItem[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Home", icon: "home" },
  { name: "Explore", icon: "compass" },
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
  favoritesCount = 0,
  recentlyPlayedCount = 0,
  navItems = DEFAULT_NAV_ITEMS,
}: MobileNavDrawerProps) {
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
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel with smooth slide transition */}
      <aside
        className={`fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-[#090c13]/98 border-r border-white/10 px-4 py-5 flex flex-col shadow-2xl backdrop-blur-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-2 mb-6">
          <AppLogo size="md" onClick={() => handleNavClick("Home")} />

          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.name)}
              className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activeNav === item.name
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Library */}
        <div className="mb-2 mt-6 px-3">
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
            {recentlyPlayedCount > 0 && (
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
              name={favoritesCount > 0 ? "heart-filled" : "heart"}
              size={18}
              className={favoritesCount > 0 ? "text-rose-500" : ""}
            />
            <span>Your favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-auto text-[10px] text-zinc-500 font-mono">
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Playlists */}
        <div className="mb-2 mt-6 flex items-center justify-between px-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
            Playlists
          </p>
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

        <div className="flex-1 min-h-0 space-y-1 pr-1 custom-scrollbar">
          {playlists.map((pl) => (
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

        {/* Install App button for mobile */}
        <div className="mt-3 pt-3 border-t border-white/[0.08]">
          <InstallPwaButton variant="sidebar" />
        </div>
      </aside>
    </div>
  );
}

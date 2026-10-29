"use client";

import React from "react";
import { AppLogo } from "./AppLogo";
import { Icon } from "./Icons";
import { InstallPwaButton } from "./InstallPwaButton";
import type { CustomPlaylist } from "../lib/store";

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
  favoritesCount?: number;
  recentlyPlayedCount?: number;
  navItems?: NavItem[];
  className?: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { name: "Home", icon: "home" },
  { name: "Explore", icon: "compass" },
  { name: "Search", icon: "search" },
];

export function Sidebar({
  activeNav,
  onSelectNav,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  favoritesCount = 0,
  recentlyPlayedCount = 0,
  navItems = DEFAULT_NAV_ITEMS,
  className = "",
}: SidebarProps) {
  return (
    <aside
      className={`hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-[#07090e]/60 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col h-full overflow-hidden select-none z-10 ${className}`}
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
            onClick={() => onSelectNav(item.name)}
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

      {/* Library Section */}
      <div className="mb-2 mt-7 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
          Library
        </p>
      </div>

      <nav className="space-y-1">
        <button
          onClick={() => onSelectNav("Recently played")}
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
          onClick={() => onSelectNav("Your favorites")}
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

        <button
          onClick={() => onSelectNav("Playlists")}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            activeNav === "Playlists"
              ? "bg-white/[0.1] text-white"
              : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
          }`}
        >
          <Icon name="list" size={18} />
          <span>Playlists</span>
        </button>
      </nav>

      {/* Custom Playlists Section */}
      <div className="mb-2 mt-7 flex items-center justify-between px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
          Playlists
        </p>
        <button
          onClick={onCreatePlaylist}
          aria-label="Create playlist"
          title="Create new playlist"
          className="flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="plus" size={15} />
        </button>
      </div>

      {/* Scrollable Playlists List */}
      <div className="flex-1 min-h-0 space-y-1 pr-1 custom-scrollbar">
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onSelectPlaylist(pl)}
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

      {/* Install PWA Button */}
      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <InstallPwaButton variant="sidebar" />
      </div>
    </aside>
  );
}

"use client";

import React from "react";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";

export interface MobileBottomNavProps {
  activeNav: string;
  onSelectNav: (name: string) => void;
  hasActiveTrack?: boolean;
}

export function MobileBottomNav({
  activeNav,
  onSelectNav,
  hasActiveTrack = false,
}: MobileBottomNavProps) {
  const tabs = [
    { name: "Home", icon: "home", label: "Home" },
    { name: "Explore", icon: "compass", label: "Explore" },
    { name: "AI Hub", icon: "sparkles", label: "AI" },
    { name: "Search", icon: "search", label: "Search" },
    { name: "Your favorites", icon: "heart", label: "Library" },
  ];

  const isTabActive = (tabName: string) => {
    if (tabName === "Your favorites") {
      return (
        activeNav === "Your favorites" ||
        activeNav === "Playlists" ||
        activeNav === "Recently played" ||
        activeNav === "Downloaded" ||
        activeNav === "PlaylistDetail"
      );
    }
    return activeNav === tabName;
  };

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-[max(env(safe-area-inset-bottom,0px),8px)] left-3 right-3 z-30 lg:hidden max-w-[360px] mx-auto rounded-full border border-white/10 bg-transparent backdrop-blur-xl px-1.5 py-1 select-none transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        {tabs.map((tab) => {
          const active = isTabActive(tab.name);
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => {
                if (!active) haptics.selection();
                onSelectNav(tab.name);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full transition-all duration-200 active:scale-95 ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon
                name={tab.icon}
                size={18}
                className={active ? "text-purple-400" : ""}
              />
              {active && (
                <span className="text-[11px] font-semibold tracking-tight text-white animate-fade-in whitespace-nowrap">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

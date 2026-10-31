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
      className="fixed bottom-[max(env(safe-area-inset-bottom,0px),8px)] left-3 right-3 z-30 lg:hidden max-w-[360px] mx-auto rounded-full border border-white/[0.12] bg-[#12141C]/90 backdrop-blur-2xl px-1.5 py-1 select-none transition-all duration-300 shadow-none"
    >
      <div className="flex items-center justify-between">
        {tabs.map((tab) => {
          const active = isTabActive(tab.name);
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => {
                onSelectNav(tab.name);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-full transition-all duration-200 active:scale-95 ${
                active
                  ? "bg-[#292B4B] text-[#A5A9FF] border border-[#A5A9FF]/25 shadow-[0_0_12px_rgba(165,169,255,0.18)]"
                  : "text-[#A1A4B2] hover:text-[#F5F5F7]"
              }`}
            >
              <Icon
                name={tab.icon}
                size={18}
                className={active ? "text-[#A5A9FF]" : ""}
              />
              {active && (
                <span className="text-[11px] font-semibold tracking-tight text-[#F5F5F7] animate-fade-in whitespace-nowrap">
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

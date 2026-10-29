"use client";

import Image from "next/image";
import React from "react";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AppLogo({
  size = "md",
  showText = true,
  className = "",
  onClick,
}: AppLogoProps) {
  const iconDimensions = {
    sm: { px: 28, class: "w-7 h-7 rounded-lg" },
    md: { px: 36, class: "w-9 h-9 rounded-xl" },
    lg: { px: 48, class: "w-12 h-12 rounded-2xl" },
  }[size];

  const textStyles = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl tracking-tighter",
  }[size];

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group inline-flex items-center gap-3 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* 3D Glassmorphic Emblem */}
      <Image
        src="/image/musify_logo.png"
        alt="Musify Logo"
        width={iconDimensions.px}
        height={iconDimensions.px}
        className="h-full w-full object-cover"
        priority
      />

      {/* Brand Wordmark with signature glowing indigo dot */}
      {showText && (
        <span
          className={`font-bold font-sans text-white transition-colors group-hover:text-zinc-100 ${textStyles}`}
        >
          Musify
          {/* <span className="text-[#818cf8] transition-all duration-300 group-hover:text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]">
            .
          </span> */}
        </span>
      )}
    </div>
  );
}

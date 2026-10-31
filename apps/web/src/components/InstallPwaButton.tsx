"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";

export interface InstallPwaButtonProps {
  variant?: "pill" | "sidebar" | "banner";
  className?: string;
  onShowToast?: (
    title: string,
    sub?: string,
    type?: "success" | "info" | "heart",
  ) => void;
}

export function InstallPwaButton({
  variant = "pill",
  className = "",
}: InstallPwaButtonProps) {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in dedicated .exe (Electron), native .apk (Capacitor), or standalone window
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      const isElectron =
        Boolean((window as any).musifyDesktop?.isDesktop) ||
        /electron/i.test(navigator.userAgent);
      const isCapacitor =
        Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
        Boolean((window as any).Capacitor) ||
        /capacitor/i.test(navigator.userAgent);

      if (isStandalone || isElectron || isCapacitor) {
        setIsInstalled(true);
      }
    }
  }, []);

  // If already running in the dedicated .exe or .apk, hide the button
  if (isInstalled) return null;

  if (variant === "sidebar") {
    return (
      <Link
        href="/download"
        title="Download Musify for Android & Windows"
        className={`flex w-full items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-left text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 hover:border-indigo-500/30 active:scale-98 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300">
            <Icon name="download" size={13} />
          </div>
          <span>Get Native App</span>
        </div>
        <span className="rounded bg-indigo-400/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
          APK / EXE
        </span>
      </Link>
    );
  }

  // Pill variant (used in TopHeader or Mobile menu)
  return (
    <Link
      href="/download"
      title="Download Musify Native Apps (Android APK & Windows EXE)"
      className={`group flex items-center gap-1.5 sm:gap-2 rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-600/30 via-purple-600/25 to-pink-600/25 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur-xl transition hover:border-indigo-400 hover:bg-indigo-500/40 hover:text-white active:scale-95 shadow-md shadow-indigo-500/15 ${className}`}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/40 text-indigo-200 group-hover:scale-110 transition">
        <Icon name="download" size={13} />
      </div>
      <span className="text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap text-white">
        Download App
      </span>
      <span className="hidden md:inline-block rounded bg-indigo-400/25 px-1 py-0.2 text-[9px] font-mono font-bold text-indigo-200 uppercase">
        APK
      </span>
    </Link>
  );
}

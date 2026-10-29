"use client";

import React, { useEffect, useState } from "react";
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
  onShowToast,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA / WebAPK mode
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Detect iOS devices for manual Add-to-Home-Screen prompt
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(iosDevice && !(window.navigator as any).standalone);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        onShowToast?.(
          "Musify Installed",
          "You can now launch Musify directly from your apps",
          "success",
        );
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, [onShowToast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          onShowToast?.(
            "Installing Musify...",
            "Adding standalone app to your device",
            "success",
          );
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn("PWA install error:", err);
      }
      return;
    }

    if (isIOS) {
      onShowToast?.(
        "Install on iPhone/iPad",
        "Tap the Share button in Safari, then 'Add to Home Screen'",
        "info",
      );
      return;
    }

    // Fallback info for Chromium / Android if prompt was already handled or deferred
    onShowToast?.(
      "Install Musify",
      "Tap browser menu (⋮) and select 'Install app' or 'Add to Home screen'",
      "info",
    );
  };

  // If already installed in standalone window, hide button
  if (isInstalled) return null;

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleInstallClick}
        title="Install Musify Android / Web App"
        className={`flex w-full items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-left text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20 hover:border-indigo-500/30 active:scale-98 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <span>Install App</span>
        </div>
        <span className="rounded bg-indigo-400/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
          PWA
        </span>
      </button>
    );
  }

  // Pill variant (used in TopHeader or Mobile menu)
  return (
    <button
      onClick={handleInstallClick}
      title="Install Musify on this device"
      className={`group flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 backdrop-blur-xl transition hover:border-indigo-400/50 hover:bg-indigo-500/30 hover:text-white active:scale-95 shadow-sm shadow-indigo-500/10 ${className}`}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 group-hover:scale-110 transition">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <span className="hidden xs:inline sm:inline">Install App</span>
    </button>
  );
}


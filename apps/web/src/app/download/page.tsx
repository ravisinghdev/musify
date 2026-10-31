"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLogo } from "../../components/AppLogo";
import { Icon } from "../../components/Icons";

export default function DownloadPage() {
  const [downloadingAndroid, setDownloadingAndroid] = useState(false);
  const [downloadingWindows, setDownloadingWindows] = useState(false);

  const handleDownloadAndroid = () => {
    setDownloadingAndroid(true);
    setTimeout(() => setDownloadingAndroid(false), 3000);
  };

  const handleDownloadWindows = () => {
    setDownloadingWindows(true);
    setTimeout(() => setDownloadingWindows(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-[5%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/" className="transition hover:opacity-80">
          <AppLogo size="md" />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="play" size={14} />
          <span>Launch Web Player</span>
        </Link>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center text-center">
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>Musify Official Release v1.0.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
          Your Music Everywhere,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Native & Unbound.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl font-light leading-relaxed">
          Get the dedicated Musify apps for your phone and computer. Enjoy
          seamless background playback, full offline downloads, lock-screen
          controls, and zero ads.
        </p>

        {/* Download Cards Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
          {/* Card 1: Android (APK) */}
          <div className="relative group rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9 backdrop-blur-2xl shadow-2xl transition hover:border-indigo-500/40 hover:bg-white/[0.05] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                  <Icon name="phone" size={28} />
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                  Android 8.0+
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Android App
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Official signed APK for Android phones, tablets, and car
                  units.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-md bg-white/[0.05] border border-white/5 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                  Size: 9.3 MB
                </span>
                <span className="rounded-md bg-white/[0.05] border border-white/5 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                  v2 Release Signed
                </span>
              </div>

              <ul className="space-y-2 pt-3 text-xs text-zinc-300 border-t border-white/[0.06]">
                <li className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>
                    Background lock-screen player with full notifications
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Direct IndexedDB offline song downloads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">&#10003;</span>
                  <span>Smooth audio crossfade and voice search</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href="/downloads/Musify.apk"
                download="Musify.apk"
                onClick={handleDownloadAndroid}
                className="flex items-center justify-center gap-3 w-full rounded-2xl bg-white text-zinc-950 px-6 py-4 text-sm font-bold shadow-lg transition hover:bg-zinc-200 active:scale-98"
              >
                <Icon name="download" size={18} />
                <span>
                  {downloadingAndroid
                    ? "Starting Download..."
                    : "Download Musify.apk"}
                </span>
              </a>
              <p className="text-center text-[10px] text-zinc-500 mt-2.5">
                Direct release download &bull; Verified safe & ad-free
              </p>
            </div>
          </div>

          {/* Card 2: Windows (EXE) */}
          <div className="relative group rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9 backdrop-blur-2xl shadow-2xl transition hover:border-indigo-500/40 hover:bg-white/[0.05] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
                  <Icon name="monitor" size={28} />
                </div>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 text-[11px] font-semibold text-indigo-300">
                  Windows 10 / 11
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Windows Desktop
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Standalone executable for Windows PCs & laptops (64-bit).
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-md bg-white/[0.05] border border-white/5 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                  Size: 75 MB
                </span>
                <span className="rounded-md bg-white/[0.05] border border-white/5 px-2.5 py-1 text-[11px] text-zinc-400 font-mono">
                  Portable / No Install
                </span>
              </div>

              <ul className="space-y-2 pt-3 text-xs text-zinc-300 border-t border-white/[0.06]">
                <li className="flex items-center gap-2.5">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>
                    Global hardware media keys support (Play/Pause/Skip)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>
                    System tray mini-player and background minimization
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-indigo-400 font-bold">&#10003;</span>
                  <span>Zero background audio throttling & stuttering</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href="/downloads/Musify.exe"
                download="Musify.exe"
                onClick={handleDownloadWindows}
                className="flex items-center justify-center gap-3 w-full rounded-2xl bg-white text-zinc-950 px-6 py-4 text-sm font-bold shadow-lg transition hover:bg-zinc-200 active:scale-98"
              >
                <Icon name="download" size={18} />
                <span>
                  {downloadingWindows
                    ? "Starting Download..."
                    : "Download Musify.exe"}
                </span>
              </a>
              <p className="text-center text-[10px] text-zinc-500 mt-2.5">
                Windows 64-bit &bull; Portable single executable
              </p>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="mt-16 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Quick Installation Guide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-300 leading-relaxed">
            <div>
              <p className="font-semibold text-white mb-1">Android Phones:</p>
              <p className="text-zinc-400">
                Tap <strong>Download Musify.apk</strong>. Once downloaded, tap
                the notification or file in Downloads and choose{" "}
                <strong>Install</strong>. If prompted, toggle &quot;Allow
                installation from this source&quot;.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Windows PC:</p>
              <p className="text-zinc-400">
                Click <strong>Download Musify.exe</strong>. It is a completely
                portable standalone application; simply double-click{" "}
                <strong>Musify.exe</strong> to start listening immediately.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto px-6 py-10 border-t border-white/[0.06] text-center text-xs text-zinc-500">
        <p>
          &copy; {new Date().getFullYear()} Musify. Engineered for high-fidelity
          audio.
        </p>
      </footer>
    </div>
  );
}

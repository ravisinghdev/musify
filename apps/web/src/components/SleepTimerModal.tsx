"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "./Icons";

export type SleepTimerDuration = 15 | 30 | 45 | 60 | "end_of_track" | null;

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimer: SleepTimerDuration;
  remainingMinutes?: number | null;
  onSetTimer: (duration: SleepTimerDuration) => void;
}

const TIMER_OPTIONS: Array<{
  label: string;
  value: SleepTimerDuration;
  subtitle: string;
}> = [
  { label: "15 Minutes", value: 15, subtitle: "Quick power nap or relaxation" },
  { label: "30 Minutes", value: 30, subtitle: "Wind down before sleeping" },
  { label: "45 Minutes", value: 45, subtitle: "Deep sleep transition" },
  { label: "1 Hour", value: 60, subtitle: "Extended night listening" },
  {
    label: "End of this song",
    value: "end_of_track",
    subtitle: "Stop cleanly after current track",
  },
];

export function SleepTimerModal({
  isOpen,
  onClose,
  activeTimer,
  remainingMinutes,
  onSetTimer,
}: SleepTimerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sleep timer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-3xl animate-fade-in"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌙</span>
            <div>
              <h3 className="text-sm font-bold text-white">Sleep Timer</h3>
              <p className="text-[11px] text-zinc-400">
                {activeTimer
                  ? `Active: ${
                      activeTimer === "end_of_track"
                        ? "Stops after song"
                        : `${remainingMinutes ?? activeTimer}m remaining`
                    }`
                  : "Music pauses gently when timer ends"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <Icon name="close" size={13} />
          </button>
        </div>

        <div className="mt-3.5 space-y-1.5">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected = activeTimer === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => {
                  onSetTimer(opt.value);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition-all ${
                  isSelected
                    ? "bg-indigo-600/30 border border-indigo-500/40 text-white shadow-md"
                    : "bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {opt.subtitle}
                  </p>
                </div>
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {activeTimer && (
            <button
              onClick={() => {
                onSetTimer(null);
                onClose();
              }}
              className="mt-2 flex w-full items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              Turn Off Timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

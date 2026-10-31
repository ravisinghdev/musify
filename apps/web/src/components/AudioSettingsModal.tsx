"use client";

import React from "react";
import { Icon } from "./Icons";
import { haptics } from "../lib/haptics";
import {
  useSettings,
  EQUALIZER_PRESETS,
  type EqualizerPreset,
  type AudioQuality,
} from "../lib/settingsStore";
import { SlidersHorizontal, Gauge, Sparkles, Volume2, Waves, Radio } from "lucide-react";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  onShowToast?: (title: string, sub?: string, type?: "success" | "info" | "heart") => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const PRESETS: Array<{ id: EqualizerPreset; label: string }> = [
  { id: "flat", label: "Flat" },
  { id: "bass_boost", label: "Bass Boost" },
  { id: "treble_boost", label: "Treble Boost" },
  { id: "vocal", label: "Vocal Clarity" },
  { id: "electronic", label: "Electronic" },
  { id: "rock", label: "Rock" },
  { id: "hiphop", label: "Hip-Hop" },
  { id: "acoustic", label: "Acoustic" },
  { id: "custom", label: "Custom" },
];

const BANDS = [
  { hz: 60, label: "Sub-bass" },
  { hz: 230, label: "Bass" },
  { hz: 910, label: "Mids" },
  { hz: 3600, label: "Upper Mids" },
  { hz: 14000, label: "Treble" },
] as const;

export function AudioSettingsModal({
  isOpen,
  onClose,
  playbackSpeed,
  onPlaybackSpeedChange,
  onShowToast,
}: AudioSettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full sm:max-w-xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-white/[0.10] bg-[#12141C] text-[#F5F5F7] shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#1A1D28]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#292B4B] text-[#A5A9FF]">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7] tracking-tight">
                Audio Studio & Equalizer
              </h3>
              <p className="text-[11px] text-[#A1A4B2]">
                Acoustic tuning, playback speed & DSP processing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close audio settings"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#A1A4B2] hover:bg-white/10 hover:text-[#F5F5F7] transition"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* 1. Playback Speed */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[#A5A9FF]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A4B2]">
                  Playback Speed
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-[#A5A9FF]">
                {playbackSpeed === 1.0 ? "1.0x (Normal)" : `${playbackSpeed}x`}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {SPEED_OPTIONS.map((spd) => {
                const isActive = playbackSpeed === spd;
                return (
                  <button
                    key={spd}
                    onClick={() => {
                      haptics.selection();
                      onPlaybackSpeedChange(spd);
                      onShowToast?.("Playback Speed", `${spd}x speed active`, "info");
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-semibold transition active:scale-95 ${
                      isActive
                        ? "bg-[#A5A9FF] text-[#090A0F] shadow-md shadow-[#A5A9FF]/20"
                        : "text-[#A1A4B2] hover:text-[#F5F5F7] hover:bg-white/5"
                    }`}
                  >
                    {spd}x
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Equalizer & Presets */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-[#A5A9FF]" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A4B2]">
                    5-Band Equalizer
                  </h4>
                  <p className="text-[10px] text-[#686C7B]">
                    Hardware-calibrated acoustic frequency shaping
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.light();
                  updateSettings({ equalizerEnabled: !settings.equalizerEnabled });
                }}
                className={`h-6 w-11 rounded-full transition-colors relative ${
                  settings.equalizerEnabled ? "bg-[#A5A9FF]" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                    settings.equalizerEnabled
                      ? "left-6 bg-[#090A0F]"
                      : "left-1 bg-white"
                  }`}
                />
              </button>
            </div>

            {/* Equalizer Presets Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const isActive =
                  settings.equalizerEnabled && settings.equalizerPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      haptics.selection();
                      updateSettings({
                        equalizerEnabled: true,
                        equalizerPreset: p.id,
                        equalizerBands:
                          p.id === "custom"
                            ? settings.equalizerBands
                            : EQUALIZER_PRESETS[p.id],
                      });
                      onShowToast?.("Equalizer Preset", `${p.label} profile active`, "info");
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition active:scale-95 ${
                      isActive
                        ? "bg-[#A5A9FF] text-[#090A0F] font-bold shadow-sm"
                        : "bg-white/[0.04] border border-white/[0.08] text-[#A1A4B2] hover:text-[#F5F5F7] hover:bg-white/[0.08]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Frequency Response Curve Canvas */}
            {settings.equalizerEnabled && (
              <div className="relative h-20 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090A0F]/60 p-2">
                <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none opacity-20">
                  <div className="w-full border-b border-dashed border-white/40" />
                </div>
                <div className="absolute top-1.5 left-3 text-[9px] font-mono text-[#686C7B]">
                  0 dB Baseline
                </div>
                {(() => {
                  const b60 = (settings.equalizerBands as any)[60] ?? 0;
                  const b230 = (settings.equalizerBands as any)[230] ?? 0;
                  const b910 = (settings.equalizerBands as any)[910] ?? 0;
                  const b3600 = (settings.equalizerBands as any)[3600] ?? 0;
                  const b14000 = (settings.equalizerBands as any)[14000] ?? 0;
                  const getY = (g: number) => 38 - (g / 12) * 26;
                  const y0 = getY(b60);
                  const y1 = getY(b230);
                  const y2 = getY(b910);
                  const y3 = getY(b3600);
                  const y4 = getY(b14000);
                  const pathD = `M 0,${y0} Q 40,${y0} 70,${(y0 + y1) / 2} T 140,${y1} Q 175,${y1} 210,${(y1 + y2) / 2} T 280,${y2} Q 315,${y2} 350,${(y2 + y3) / 2} T 420,${y3} Q 455,${y3} 490,${(y3 + y4) / 2} T 560,${y4} L 600,${y4}`;
                  const areaD = `${pathD} L 600,76 L 0,76 Z`;

                  return (
                    <svg viewBox="0 0 600 76" preserveAspectRatio="none" className="h-full w-full">
                      <defs>
                        <linearGradient id="eqGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A5A9FF" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#A5A9FF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={areaD} fill="url(#eqGlow)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#A5A9FF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                      <circle cx="70" cy={y0} r="3" fill="#F5F5F7" className="shadow-[0_0_8px_#A5A9FF]" />
                      <circle cx="140" cy={y1} r="3" fill="#F5F5F7" className="shadow-[0_0_8px_#A5A9FF]" />
                      <circle cx="280" cy={y2} r="3" fill="#F5F5F7" className="shadow-[0_0_8px_#A5A9FF]" />
                      <circle cx="420" cy={y3} r="3" fill="#F5F5F7" className="shadow-[0_0_8px_#A5A9FF]" />
                      <circle cx="560" cy={y4} r="3" fill="#F5F5F7" className="shadow-[0_0_8px_#A5A9FF]" />
                    </svg>
                  );
                })()}
              </div>
            )}

            {/* 5-Band Vertical Sliders */}
            <div
              className={`p-4 rounded-2xl border border-white/[0.08] bg-[#1A1D28]/40 transition-opacity ${
                settings.equalizerEnabled ? "opacity-100" : "opacity-35 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-5 gap-3 text-center">
                {BANDS.map((band) => {
                  const gain = (settings.equalizerBands as any)[band.hz] ?? 0;
                  return (
                    <div key={band.hz} className="flex flex-col items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#A5A9FF]">
                        {gain > 0 ? `+${gain}` : gain} dB
                      </span>
                      <div className="relative flex h-28 w-6 items-center justify-center">
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={1}
                          value={gain}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateSettings({
                              equalizerPreset: "custom",
                              equalizerBands: {
                                ...settings.equalizerBands,
                                [band.hz]: val,
                              },
                            });
                          }}
                          className="h-24 w-2 -rotate-90 appearance-none rounded-full bg-white/10 accent-[#A5A9FF] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-[#A1A4B2]">
                        {band.label}
                      </span>
                      <span className="font-mono text-[9px] text-[#686C7B]">
                        {band.hz >= 1000 ? `${band.hz / 1000}k` : `${band.hz}`}Hz
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Bass Boost & Pre-Amp */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#A5A9FF]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A4B2]">
                  Bass Boost & Acoustic Enhancer
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-[#A5A9FF]">
                {settings.bassBoostStrength || 0}%
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#1A1D28]/40 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#686C7B] uppercase font-bold">Sub</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.bassBoostStrength || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateSettings({ bassBoostStrength: val });
                  }}
                  className="flex-1 h-2 appearance-none rounded-full bg-white/10 accent-[#A5A9FF] cursor-pointer"
                />
                <span className="text-[10px] text-[#686C7B] uppercase font-bold">Max</span>
              </div>
              <p className="text-[11px] text-[#686C7B]">
                Enriches sub-bass depth dynamically without clipping vocals or acoustic transients.
              </p>
            </div>
          </section>

          {/* 4. Crossfade & Audio Normalization */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-[#A5A9FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A4B2]">
                Seamless Playback & Dynamics
              </h4>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#1A1D28]/40 space-y-4">
              {/* Crossfade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F5F5F7]">
                    Track Crossfade
                  </span>
                  <span className="font-mono text-xs text-[#A5A9FF]">
                    {settings.crossfadeSeconds > 0
                      ? `${settings.crossfadeSeconds}s`
                      : "Off (Gapless)"}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={settings.crossfadeSeconds}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateSettings({ crossfadeSeconds: val });
                  }}
                  className="w-full h-2 appearance-none rounded-full bg-white/10 accent-[#A5A9FF] cursor-pointer"
                />
              </div>

              {/* Volume Normalization */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-xs font-semibold text-[#F5F5F7]">
                    Audio Normalization
                  </p>
                  <p className="text-[10px] text-[#686C7B]">
                    Maintains consistent volume across songs
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    updateSettings({
                      volumeNormalization: !settings.volumeNormalization,
                    });
                  }}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.volumeNormalization ? "bg-[#A5A9FF]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${
                      settings.volumeNormalization
                        ? "left-6 bg-[#090A0F]"
                        : "left-1 bg-white"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* 5. Stream Quality & Engine Status */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#A5A9FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A4B2]">
                Stream Architecture & Output
              </h4>
            </div>

            <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#1A1D28]/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A4B2]">Active Codec</span>
                <span className="font-mono text-[#F5F5F7] font-semibold">
                  Opus / AAC 24-bit 48kHz
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A4B2]">Routing Pipeline</span>
                <span className="font-mono text-[#70D6A0] font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#70D6A0]" />
                  MediaSession Hardware Engine
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A4B2]">Background Keep-Alive</span>
                <span className="font-mono text-[#A5A9FF] font-semibold">
                  Foreground Audio Lock Active
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#1A1D28]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F5F5F7] text-[#090A0F] font-bold text-xs hover:bg-white active:scale-95 transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AudioSettingsModal;


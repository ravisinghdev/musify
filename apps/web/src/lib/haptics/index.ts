"use client";

import { HapticIntensity, HapticPreset, HapticService } from "./types";
import { NativeHaptics } from "./native";
import { WebHaptics } from "./web";

const SETTINGS_KEY = "musify_app_settings_v3";

class CentralHapticsEngine implements HapticService {
  private throttles: Map<string, number> = new Map();

  isSupported(): boolean {
    return NativeHaptics.isAvailable() || WebHaptics.isAvailable();
  }

  isNative(): boolean {
    return NativeHaptics.isAvailable();
  }

  private getSettings(): { enabled: boolean; intensity: HapticIntensity } {
    if (typeof window === "undefined") {
      return { enabled: true, intensity: "standard" };
    }
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { enabled: true, intensity: "standard" };
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.hapticsEnabled !== false,
        intensity: (parsed.hapticIntensity as HapticIntensity) || "standard",
      };
    } catch {
      return { enabled: true, intensity: "standard" };
    }
  }

  private async dispatch(preset: HapticPreset): Promise<void> {
    const { enabled, intensity } = this.getSettings();
    if (!enabled) return;

    if (NativeHaptics.isAvailable()) {
      await NativeHaptics.trigger(preset, intensity);
    } else if (WebHaptics.isAvailable()) {
      WebHaptics.trigger(preset, intensity);
    }
  }

  /**
   * Subtle tick for tab switches, opening menus, button taps, closing sheets
   */
  async light(): Promise<void> {
    await this.dispatch("light");
  }

  /**
   * Definite tactile feedback for Play/Pause, Next/Prev, Like toggle
   */
  async medium(): Promise<void> {
    await this.dispatch("medium");
  }

  /**
   * Firm impact for Long-press triggers and major modal activations
   */
  async heavy(): Promise<void> {
    await this.dispatch("heavy");
  }

  /**
   * Micro-tick for selection changes, dropdowns, segmented controls
   */
  async selection(): Promise<void> {
    await this.dispatch("selection");
  }

  /**
   * Positive pattern for Add to Queue, Liked track, Saved settings
   */
  async success(): Promise<void> {
    await this.dispatch("success");
  }

  /**
   * Cautionary pattern for Clear Queue, Reset settings, Remove operations
   */
  async warning(): Promise<void> {
    await this.dispatch("warning");
  }

  /**
   * Error pattern for playback failure, network loss, validation errors
   */
  async error(): Promise<void> {
    await this.dispatch("error");
  }

  /**
   * General impact with explicit style
   */
  async impact(style: "light" | "medium" | "heavy" = "medium"): Promise<void> {
    await this.dispatch(style);
  }

  /**
   * Custom vibration pattern in ms
   */
  async custom(pattern: number | number[]): Promise<void> {
    const { enabled } = this.getSettings();
    if (!enabled) return;

    if (NativeHaptics.isAvailable()) {
      const duration = Array.isArray(pattern) ? pattern[0] || 20 : pattern;
      await NativeHaptics.vibrate(duration);
    } else if (WebHaptics.isAvailable()) {
      WebHaptics.vibrate(pattern);
    }
  }

  /**
   * Throttled tick for continuous interactions like sliders or scrubbing
   */
  tick(id = "default", intervalMs = 90): void {
    const now = Date.now();
    const last = this.throttles.get(id) || 0;
    if (now - last >= intervalMs) {
      this.throttles.set(id, now);
      this.selection();
    }
  }
}

export const haptics = new CentralHapticsEngine();
export * from "./types";
export * from "./presets";
export default haptics;


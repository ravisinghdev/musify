import { HapticIntensity, HapticPreset } from "./types";
import { WEB_PRESETS } from "./presets";

export class WebHaptics {
  static isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "vibrate" in navigator &&
      typeof navigator.vibrate === "function"
    );
  }

  static trigger(preset: HapticPreset, intensity: HapticIntensity): void {
    if (!this.isAvailable()) return;
    try {
      const pattern = WEB_PRESETS[intensity]?.[preset] ?? WEB_PRESETS.standard[preset];
      navigator.vibrate(pattern);
    } catch {
      // Ignore web vibration errors
    }
  }

  static vibrate(pattern: number | number[]): void {
    if (!this.isAvailable()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore
    }
  }
}


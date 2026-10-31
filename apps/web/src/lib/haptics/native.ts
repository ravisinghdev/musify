import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { HapticIntensity, HapticPreset } from "./types";

export class NativeHaptics {
  static isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor;
    return !!cap?.isNativePlatform?.();
  }

  static async trigger(preset: HapticPreset, intensity: HapticIntensity): Promise<void> {
    try {
      // Mild, premium native tactile feedback:
      // Uses subtle ImpactStyle.Light or selectionChanged. Never uses loud buzzing notifications.
      if (intensity === "strong") {
        if (preset === "heavy" || preset === "error" || preset === "warning") {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } else {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      } else {
        // Standard & Light: Subtle, tactile micro-tap
        if (preset === "selection") {
          await Haptics.selectionChanged();
        } else {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
      }
    } catch {
      // Ignore native vibration errors gracefully
    }
  }

  static async vibrate(durationMs: number): Promise<void> {
    try {
      // Keep vibration duration capped to a maximum of 20ms to avoid phone rattle
      await Haptics.vibrate({ duration: Math.min(20, Math.max(5, durationMs)) });
    } catch {
      // Ignore
    }
  }
}


import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { HapticIntensity, HapticPreset } from "./types";

export class NativeHaptics {
  static isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor;
    return !!cap?.isNativePlatform?.();
  }

  static async trigger(preset: HapticPreset, intensity: HapticIntensity): Promise<void> {
    try {
      switch (preset) {
        case "light":
          if (intensity === "strong") {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } else {
            await Haptics.impact({ style: ImpactStyle.Light });
          }
          break;

        case "medium":
          if (intensity === "light") {
            await Haptics.impact({ style: ImpactStyle.Light });
          } else if (intensity === "strong") {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          } else {
            await Haptics.impact({ style: ImpactStyle.Medium });
          }
          break;

        case "heavy":
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;

        case "selection":
          await Haptics.selectionChanged();
          break;

        case "success":
          await Haptics.notification({ type: NotificationType.Success });
          break;

        case "warning":
          await Haptics.notification({ type: NotificationType.Warning });
          break;

        case "error":
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch {
      // Ignore native vibration errors gracefully
    }
  }

  static async vibrate(durationMs: number): Promise<void> {
    try {
      await Haptics.vibrate({ duration: durationMs });
    } catch {
      // Ignore
    }
  }
}


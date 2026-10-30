import { HapticIntensity, HapticPreset } from "./types";

/**
 * Vibration patterns (in ms) for web navigator.vibrate fallback, scaled by intensity
 */
export const WEB_PRESETS: Record<HapticIntensity, Record<HapticPreset, number | number[]>> = {
  light: {
    light: 6,
    medium: 12,
    heavy: 20,
    selection: 4,
    success: [8, 30, 12],
    warning: [15, 25, 15],
    error: [25, 20, 25, 20, 35],
  },
  standard: {
    light: 10,
    medium: 22,
    heavy: 35,
    selection: 6,
    success: [12, 35, 18],
    warning: [25, 30, 25],
    error: [35, 25, 35, 25, 50],
  },
  strong: {
    light: 18,
    medium: 35,
    heavy: 55,
    selection: 10,
    success: [20, 40, 30],
    warning: [35, 35, 35],
    error: [50, 30, 50, 30, 70],
  },
};


import { HapticIntensity, HapticPreset } from "./types";

/**
 * Vibration patterns (in ms) for web navigator.vibrate fallback, scaled by intensity
 */
export const WEB_PRESETS: Record<HapticIntensity, Record<HapticPreset, number | number[]>> = {
  light: {
    light: 2,
    medium: 4,
    heavy: 8,
    selection: 2,
    success: 4,
    warning: 6,
    error: 8,
  },
  standard: {
    light: 4,
    medium: 6,
    heavy: 10,
    selection: 3,
    success: 6,
    warning: 8,
    error: 12,
  },
  strong: {
    light: 6,
    medium: 10,
    heavy: 16,
    selection: 4,
    success: 10,
    warning: 14,
    error: 18,
  },
};


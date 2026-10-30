export type HapticIntensity = "light" | "standard" | "strong";

export type HapticPreset =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

export interface HapticService {
  isSupported(): boolean;
  isNative(): boolean;
  light(): Promise<void>;
  medium(): Promise<void>;
  heavy(): Promise<void>;
  selection(): Promise<void>;
  success(): Promise<void>;
  warning(): Promise<void>;
  error(): Promise<void>;
  impact(style?: "light" | "medium" | "heavy"): Promise<void>;
  custom(pattern: number | number[]): Promise<void>;
  tick(id?: string, intervalMs?: number): void;
}


import type { RoundConfig, RoundType, UiPreferences } from "@/lib/domain/types";

export const DEFAULT_ROUND_CONFIG: RoundConfig = {
  fw: true,
  gir: true,
  ob: true,
  bunker: false,
  puttUnknown: true,
};

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  highContrast: false,
  haptics: true,
  celebration: true,
  swipeSensitivity: "medium",
  fontScale: "normal",
  distanceUnit: "yard",
};

export const PAR_TEMPLATES: Record<RoundType, number[]> = {
  FULL_18: [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5],
  HALF_9: [4, 4, 3, 5, 4, 3, 4, 5, 4],
  SHORT: [3, 3, 3, 3, 3, 3, 3, 3, 3],
};

export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  FULL_18: "18H",
  HALF_9: "9H",
  SHORT: "ショート",
};

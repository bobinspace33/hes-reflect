import type { ThemeColor } from "@/types";

/**
 * Pastel PDF marker hues aligned with theme pills (readable on parchment).
 */
export function themeMarkerColor(theme: ThemeColor): string {
  return THEME_PALETTE[theme].marker;
}

export const THEME_COLOR_ORDER: ThemeColor[] = [
  "yellow",
  "green",
  "purple",
  "pink",
  "blue",
];

export const THEME_PALETTE: Record<
  ThemeColor,
  { glow: string; accent: string; soft: string; marker: string }
> = {
  yellow: {
    glow: "rgba(234, 200, 90, 0.55)",
    accent: "#d4ba74",
    soft: "rgba(254, 240, 138, 0.18)",
    marker: "rgba(254, 240, 180, 0.58)",
  },
  green: {
    glow: "rgba(134, 195, 152, 0.55)",
    accent: "#86c398",
    soft: "rgba(187, 247, 208, 0.18)",
    marker: "rgba(196, 236, 210, 0.58)",
  },
  purple: {
    glow: "rgba(167, 156, 220, 0.55)",
    accent: "#a79cdc",
    soft: "rgba(221, 214, 254, 0.2)",
    marker: "rgba(218, 210, 252, 0.58)",
  },
  pink: {
    glow: "rgba(216, 162, 184, 0.55)",
    accent: "#d8a2b8",
    soft: "rgba(251, 207, 232, 0.18)",
    marker: "rgba(248, 210, 230, 0.58)",
  },
  blue: {
    glow: "rgba(140, 175, 218, 0.55)",
    accent: "#8cafda",
    soft: "rgba(191, 219, 254, 0.18)",
    marker: "rgba(200, 224, 252, 0.58)",
  },
};

export function colorForIndex(i: number): ThemeColor {
  return THEME_COLOR_ORDER[i % THEME_COLOR_ORDER.length];
}

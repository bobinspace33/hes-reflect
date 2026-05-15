import type { ThemeColor } from "@/types";

export const THEME_COLOR_ORDER: ThemeColor[] = [
  "yellow",
  "green",
  "purple",
  "pink",
  "blue",
];

export const THEME_PALETTE: Record<
  ThemeColor,
  { highlight: string; glow: string; accent: string; soft: string }
> = {
  yellow: {
    highlight: "rgba(254, 240, 138, 0.72)",
    glow: "rgba(234, 200, 90, 0.55)",
    accent: "#d4ba74",
    soft: "rgba(254, 240, 138, 0.18)",
  },
  green: {
    highlight: "rgba(187, 247, 208, 0.7)",
    glow: "rgba(134, 195, 152, 0.55)",
    accent: "#86c398",
    soft: "rgba(187, 247, 208, 0.18)",
  },
  purple: {
    highlight: "rgba(221, 214, 254, 0.75)",
    glow: "rgba(167, 156, 220, 0.55)",
    accent: "#a79cdc",
    soft: "rgba(221, 214, 254, 0.2)",
  },
  pink: {
    highlight: "rgba(251, 207, 232, 0.72)",
    glow: "rgba(216, 162, 184, 0.55)",
    accent: "#d8a2b8",
    soft: "rgba(251, 207, 232, 0.18)",
  },
  blue: {
    highlight: "rgba(191, 219, 254, 0.7)",
    glow: "rgba(140, 175, 218, 0.55)",
    accent: "#8cafda",
    soft: "rgba(191, 219, 254, 0.18)",
  },
};

export function colorForIndex(i: number): ThemeColor {
  return THEME_COLOR_ORDER[i % THEME_COLOR_ORDER.length];
}

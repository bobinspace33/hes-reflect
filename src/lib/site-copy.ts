/** `site_strings.key` for home-page Introduction modal — editable via Admin API. */
export const SITE_INTRODUCTION_KEY = "introduction" as const;

/** `site_strings.key` for home-page Closing commentary modal — same pattern as introduction. */
export const SITE_CLOSING_COMMENTARY_KEY = "closing_commentary" as const;

/** Walls tied to introduction / closing modals (distinct from per-theme reflections). */
export const SITE_WALL_KEYS = [
  SITE_INTRODUCTION_KEY,
  SITE_CLOSING_COMMENTARY_KEY,
] as const;

export type SiteWallKey = (typeof SITE_WALL_KEYS)[number];

export function isSiteWallKey(k: string): k is SiteWallKey {
  return (SITE_WALL_KEYS as readonly string[]).includes(k);
}

/** Vercel Blob URL for full-page background — set via Admin upload or cleared to use defaults. */
export const SITE_BACKGROUND_IMAGE_KEY = "background_image" as const;

/** Same-origin route that streams the background (required when Blob store is private). */
export const SITE_BACKGROUND_IMAGE_PROXY_PATH = "/api/site/background-image" as const;

export type SiteStringKey =
  | typeof SITE_INTRODUCTION_KEY
  | typeof SITE_CLOSING_COMMENTARY_KEY
  | typeof SITE_BACKGROUND_IMAGE_KEY;

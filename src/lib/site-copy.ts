/** `site_strings.key` for home-page Introduction modal — editable via Admin API. */
export const SITE_INTRODUCTION_KEY = "introduction" as const;

/** `site_strings.key` for home-page Closing commentary modal — same pattern as introduction. */
export const SITE_CLOSING_COMMENTARY_KEY = "closing_commentary" as const;

/** Vercel Blob URL for full-page background — set via Admin upload or cleared to use defaults. */
export const SITE_BACKGROUND_IMAGE_KEY = "background_image" as const;

export type SiteStringKey =
  | typeof SITE_INTRODUCTION_KEY
  | typeof SITE_CLOSING_COMMENTARY_KEY
  | typeof SITE_BACKGROUND_IMAGE_KEY;

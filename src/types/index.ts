export type DocumentRecord = {
  id: string;
  slug: string;
  title: string;
  pdfUrl: string;
  pageCount: number;
  order: number;
  visible: boolean;
  /** plain text per page (1-indexed by position in array) */
  pageTexts: string[];
};

export type ThemeColor =
  | "yellow"
  | "green"
  | "purple"
  | "pink"
  | "blue";

export type ThemeRecord = {
  id: string;
  label: string;
  color: ThemeColor;
  order: number;
  personalReflection: string;
};

export type ThemeSource = {
  id: string;
  themeId: string;
  documentId: string;
  pageNumber: number;
  quote: string;
  /** Preserved when re-running theme analysis; `analysis` rows are replaced each run. */
  origin: "analysis" | "manual";
};

export type ReflectionRecord = {
  id: string;
  themeId: string;
  name: string | null;
  body: string;
  createdAt: string;
};

export type HighlightHit = {
  documentId: string;
  pageNumber: number;
  quote: string;
};

export type ThemeWithSources = ThemeRecord & {
  sources: ThemeSource[];
};

export type PublicData = {
  documents: DocumentRecord[];
  themes: ThemeWithSources[];
};

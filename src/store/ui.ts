"use client";

import { create } from "zustand";
import type { HighlightHit } from "@/types";

type Mode =
  | { kind: "browse" }
  | { kind: "focus"; documentId: string; pageNumber: number; scale: number };

type UIState = {
  mode: Mode;
  activeThemeId: string | null;
  /** ad-hoc highlights from search (rendered alongside theme highlights when no theme active) */
  searchHits: HighlightHit[];
  searchQuery: string;
  searching: boolean;
  /** controls visibility of the reflection modal */
  reflectionOpen: boolean;
  introductionOpen: boolean;
  closingCommentaryOpen: boolean;

  setMode: (m: Mode) => void;
  setActiveTheme: (id: string | null) => void;
  setSearchHits: (hits: HighlightHit[], query: string) => void;
  setSearching: (b: boolean) => void;
  setReflectionOpen: (b: boolean) => void;
  setIntroductionOpen: (b: boolean) => void;
  setClosingCommentaryOpen: (b: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  mode: { kind: "browse" },
  activeThemeId: null,
  searchHits: [],
  searchQuery: "",
  searching: false,
  reflectionOpen: false,
  introductionOpen: false,
  closingCommentaryOpen: false,
  setMode: (mode) => set({ mode }),
  setActiveTheme: (id) =>
    set((s) => ({
      activeThemeId: id,
      reflectionOpen: id === null ? false : s.reflectionOpen,
      searchHits: id ? [] : s.searchHits,
      searchQuery: id ? "" : s.searchQuery,
    })),
  setSearchHits: (searchHits, query) =>
    set({ searchHits, searchQuery: query, activeThemeId: null }),
  setSearching: (searching) => set({ searching }),
  setReflectionOpen: (reflectionOpen) => set({ reflectionOpen }),
  setIntroductionOpen: (introductionOpen) => set({ introductionOpen }),
  setClosingCommentaryOpen: (closingCommentaryOpen) => set({ closingCommentaryOpen }),
}));

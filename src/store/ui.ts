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
  /** transient: order of documentIds for drag-reorder (only used to override server order locally) */
  localOrder: string[] | null;
  /** controls visibility of the reflection modal */
  reflectionOpen: boolean;

  setMode: (m: Mode) => void;
  setActiveTheme: (id: string | null) => void;
  setSearchHits: (hits: HighlightHit[], query: string) => void;
  setSearching: (b: boolean) => void;
  setLocalOrder: (ids: string[] | null) => void;
  setReflectionOpen: (b: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  mode: { kind: "browse" },
  activeThemeId: null,
  searchHits: [],
  searchQuery: "",
  searching: false,
  localOrder: null,
  reflectionOpen: false,
  setMode: (mode) => set({ mode }),
  setActiveTheme: (id) =>
    set((s) => ({
      activeThemeId: id,
      // selecting a new theme implicitly closes a stale modal until re-trigger
      reflectionOpen: id === null ? false : s.reflectionOpen,
      // clear search highlights when theme is selected
      searchHits: id ? [] : s.searchHits,
      searchQuery: id ? "" : s.searchQuery,
    })),
  setSearchHits: (searchHits, query) =>
    set({ searchHits, searchQuery: query, activeThemeId: null }),
  setSearching: (searching) => set({ searching }),
  setLocalOrder: (localOrder) => set({ localOrder }),
  setReflectionOpen: (reflectionOpen) => set({ reflectionOpen }),
}));

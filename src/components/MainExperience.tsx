"use client";

import { useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useUI } from "@/store/ui";
import { DocumentArray, getDocumentHighlightsFn } from "@/components/DocumentArray";
import { FocusOverlay } from "@/components/FocusOverlay";
import { ThemeButtons } from "@/components/ThemeButtons";
import { SearchBar } from "@/components/SearchBar";
import { ReflectionModal } from "@/components/ReflectionModal";
import { IntroductionModal } from "@/components/IntroductionModal";
import { ClosingCommentaryModal } from "@/components/ClosingCommentaryModal";
import type { DocumentRecord, ThemeWithSources } from "@/types";

export function MainExperience({
  documents,
  themes,
  introduction,
  closingCommentary,
  dbError,
  demoMode = false,
}: {
  documents: DocumentRecord[];
  themes: ThemeWithSources[];
  /** Homepage introduction — edited in Admin. */
  introduction: string;
  /** Homepage closing commentary — edited in Admin. */
  closingCommentary: string;
  dbError: string | null;
  demoMode?: boolean;
}) {
  const activeThemeId = useUI((s) => s.activeThemeId);
  const searchHits = useUI((s) => s.searchHits);
  const setIntroductionOpen = useUI((s) => s.setIntroductionOpen);
  const setClosingCommentaryOpen = useUI((s) => s.setClosingCommentaryOpen);
  const setActiveTheme = useUI((s) => s.setActiveTheme);

  const activeTheme = useMemo(
    () => themes.find((t) => t.id === activeThemeId) ?? null,
    [themes, activeThemeId],
  );

  const emphasizedIds = useMemo(() => {
    const set = new Set<string>();
    if (activeTheme) {
      for (const s of activeTheme.sources) set.add(s.documentId);
    }
    for (const h of searchHits) set.add(h.documentId);
    return set;
  }, [activeTheme, searchHits]);

  /** Matches `spreadTheme` in DocumentArray — cited-docs strip with theme highlights. */
  const spreadTheme = !!(activeTheme && emphasizedIds.size > 0 && searchHits.length === 0);

  const exitThemeView = useCallback(() => {
    setActiveTheme(null);
  }, [setActiveTheme]);

  useEffect(() => {
    if (!spreadTheme) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useUI.getState();
      if (s.mode.kind === "focus") return;
      if (s.introductionOpen) {
        e.preventDefault();
        s.setIntroductionOpen(false);
        return;
      }
      if (s.closingCommentaryOpen) {
        e.preventDefault();
        s.setClosingCommentaryOpen(false);
        return;
      }
      e.preventDefault();
      s.setActiveTheme(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spreadTheme]);
  const highlightsFor = useMemo(
    () => getDocumentHighlightsFn(themes, activeThemeId, searchHits),
    [themes, activeThemeId, searchHits],
  );

  if (dbError) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md frosted-dark rounded-2xl p-6 text-silver-100 font-mono text-sm leading-relaxed">
          <div className="text-gold-300 uppercase tracking-[0.18em] text-xs mb-2">
            Database not configured
          </div>
          <p className="text-silver-200/85 mb-3">
            The site couldn't reach Postgres. Set <code className="text-gold-200">POSTGRES_URL</code>{" "}
            in <code>.env.local</code>, then run:
          </p>
          <pre className="text-[12px] bg-black/40 p-3 rounded-md whitespace-pre-wrap">
            npm run db:init{"\n"}npm run ingest{"\n"}npm run db:seed
          </pre>
          <p className="text-silver-300/55 text-xs mt-3 break-words">{dbError}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md frosted-dark rounded-2xl p-6 text-silver-100 font-mono text-sm leading-relaxed text-center">
          <div className="text-gold-300 uppercase tracking-[0.18em] text-xs mb-2">
            No documents yet
          </div>
          <p>
            Run <code className="text-gold-200">npm run ingest</code> then{" "}
            <code className="text-gold-200">npm run db:seed</code> to add the
            documents in <code>/documents</code>.
          </p>
        </div>
      </div>
    );
  }

  const spreadExitBandClass =
    "flex-1 basis-0 min-w-10 shrink-0 self-stretch z-[12] cursor-pointer bg-transparent hover:bg-white/[0.035] border-0 p-0 focus-visible:outline focus-visible:ring-2 focus-visible:ring-gold-400/30";

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      <header className="pt-5 pb-1 shrink-0 select-none">
        {!demoMode && spreadTheme ? (
          <div className="flex flex-row items-stretch w-full min-w-0 px-2 sm:px-3">
            <button
              type="button"
              onClick={exitThemeView}
              aria-label="Exit theme view"
              className={spreadExitBandClass}
            />
            <div className="flex-1 min-w-0 flex flex-col items-center text-center px-1">
              <h1 className="text-silver-100 text-lg sm:text-xl md:text-2xl font-light tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em] uppercase">
                DGMD-E57 <span className="text-gold-300">Reflection</span>
                <span className="text-silver-200"> • </span>
                Bob Kelly
              </h1>
              <p className="text-silver-100/72 font-mono text-[10px] tracking-[0.22em] uppercase mt-1.5">
                read and search course assignments · select theme to view reflection highlights
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 px-2">
                <motion.button
                  type="button"
                  onClick={() => setIntroductionOpen(true)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="frosted rounded-full px-5 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-silver-200 hover:text-silver-50 transition-colors"
                >
                  Introduction
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setClosingCommentaryOpen(true)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="frosted rounded-full px-5 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-silver-200 hover:text-silver-50 transition-colors"
                >
                  Closing commentary
                </motion.button>
              </div>
            </div>
            <button
              type="button"
              onClick={exitThemeView}
              aria-label="Exit theme view"
              className={spreadExitBandClass}
            />
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-silver-100 text-lg sm:text-xl md:text-2xl font-light tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em] uppercase">
              DGMD-E57 <span className="text-gold-300">Reflection</span>
              <span className="text-silver-200"> • </span>
              Bob Kelly
            </h1>
            <p className="text-silver-100/72 font-mono text-[10px] tracking-[0.22em] uppercase mt-1.5">
              read and search course assignments · select theme to view reflection highlights
            </p>
            {!demoMode ? (
              <div className="mt-2 flex flex-wrap justify-center gap-2 px-4">
                <motion.button
                  type="button"
                  onClick={() => setIntroductionOpen(true)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="frosted rounded-full px-5 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-silver-200 hover:text-silver-50 transition-colors"
                >
                  Introduction
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setClosingCommentaryOpen(true)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="frosted rounded-full px-5 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-silver-200 hover:text-silver-50 transition-colors"
                >
                  Closing commentary
                </motion.button>
              </div>
            ) : null}
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 flex flex-col px-4 pt-0 min-w-0">
        {!demoMode ? (
          <div
            className={
              "flex flex-1 min-h-0 min-w-0 " +
              (spreadTheme ? "flex-row items-stretch" : "flex-col")
            }
          >
            {spreadTheme ? (
              <button
                type="button"
                onClick={exitThemeView}
                aria-label="Exit theme view"
                className={spreadExitBandClass}
              />
            ) : null}
            <div className="flex flex-1 flex-col min-h-0 min-w-0 max-w-xl w-full mx-auto">
              <div className="flex-1 min-h-0" aria-hidden />
              <div className="shrink-0 w-full">
                <SearchBar />
              </div>
              <div className="flex-1 min-h-0" aria-hidden />
            </div>
            {spreadTheme ? (
              <button
                type="button"
                onClick={exitThemeView}
                aria-label="Exit theme view"
                className={spreadExitBandClass}
              />
            ) : null}
          </div>
        ) : null}
        <section
          className={
            "min-h-0 flex items-center justify-center pt-0 pb-2 " +
            (demoMode ? "flex-1" : "flex-[5]")
          }
        >
          <DocumentArray documents={documents} themes={themes} />
        </section>
      </div>

      <footer className="pb-20 pt-2 flex flex-col items-center gap-3 px-4 shrink-0">
        {themes.length > 0 ? (
          <ThemeButtons themes={themes} />
        ) : (
          <div className="frosted-dark px-5 py-2.5 rounded-full text-silver-200/85 font-mono text-xs tracking-wider max-w-md text-center">
            {demoMode ? (
              <>Demo mode — configure Postgres + visit <code className="text-gold-200">/admin</code> to generate themes.</>
            ) : (
              <>Themes haven't been generated yet. Sign in to <code className="text-gold-200">/admin</code> and run analysis.</>
            )}
          </div>
        )}
      </footer>

      <FocusOverlay documents={documents} highlightsFor={highlightsFor} />
      <ReflectionModal themes={themes} />
      <IntroductionModal body={introduction} />
      <ClosingCommentaryModal body={closingCommentary} />
    </div>
  );
}

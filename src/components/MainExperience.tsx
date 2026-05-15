"use client";

import { useMemo } from "react";
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

  return (
    <div className="fixed inset-0 z-10 flex flex-col overflow-hidden">
      <header className="pt-5 pb-1 text-center select-none shrink-0">
        <h1 className="text-silver-100 text-lg sm:text-xl md:text-2xl font-light tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em] uppercase">
          DGMD-E57 <span className="text-gold-300">Reflection</span>
          <span className="text-silver-200"> • </span>
          Bob Kelly
        </h1>
        <p className="text-silver-700 font-mono text-[10px] tracking-[0.22em] uppercase mt-1.5">
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
      </header>

      <div className="flex-1 min-h-0 flex flex-col px-4 pt-0 min-w-0">
        {!demoMode ? (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0" aria-hidden />
            <div className="shrink-0 w-full max-w-xl mx-auto">
              <SearchBar />
            </div>
            <div className="flex-1 min-h-0" aria-hidden />
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

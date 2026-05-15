"use client";

import { useEffect, useMemo } from "react";
import { useUI } from "@/store/ui";
import { DocumentArray, getDocumentHighlightsFn } from "@/components/DocumentArray";
import { FocusOverlay } from "@/components/FocusOverlay";
import { ThemeButtons } from "@/components/ThemeButtons";
import { SearchBar } from "@/components/SearchBar";
import { ReflectionModal } from "@/components/ReflectionModal";
import type { DocumentRecord, ThemeWithSources } from "@/types";

export function MainExperience({
  documents,
  themes,
  dbError,
  demoMode = false,
}: {
  documents: DocumentRecord[];
  themes: ThemeWithSources[];
  dbError: string | null;
  demoMode?: boolean;
}) {
  const activeThemeId = useUI((s) => s.activeThemeId);
  const searchHits = useUI((s) => s.searchHits);
  const localOrder = useUI((s) => s.localOrder);
  const setLocalOrder = useUI((s) => s.setLocalOrder);

  // Initialize localOrder from documents on first load
  useEffect(() => {
    if (localOrder === null && documents.length > 0) {
      setLocalOrder(documents.map((d) => d.id));
    }
  }, [documents, localOrder, setLocalOrder]);

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
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <header className="pt-5 pb-3 text-center select-none shrink-0">
        <h1 className="text-silver-100 text-xl md:text-2xl font-light tracking-[0.18em] uppercase">
          HES <span className="text-gold-300">Reflection</span>
        </h1>
        <p className="text-silver-300/55 text-[10px] font-mono tracking-[0.22em] uppercase mt-1.5">
          A reading in process · click · drag · scroll-zoom
        </p>
      </header>

      <section className="flex-1 min-h-0 flex items-center justify-center px-4 py-2">
        <DocumentArray documents={documents} themes={themes} />
      </section>

      <footer className="pb-5 pt-3 flex flex-col items-center gap-3 px-4 shrink-0">
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
        {!demoMode ? <SearchBar /> : null}
      </footer>

      <FocusOverlay documents={documents} highlightsFor={highlightsFor} />
      <ReflectionModal themes={themes} />
    </div>
  );
}

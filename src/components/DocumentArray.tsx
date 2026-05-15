"use client";

import { Reorder } from "framer-motion";
import { useMemo } from "react";
import { useUI } from "@/store/ui";
import { DocumentCard } from "@/components/DocumentCard";
import { useFitLayout } from "@/lib/useFitLayout";
import type { DocumentRecord, ThemeWithSources, HighlightHit } from "@/types";
import type { Highlight } from "@/components/PdfPage";
import { THEME_PALETTE } from "@/lib/colors";

export function DocumentArray({
  documents,
  themes,
}: {
  documents: DocumentRecord[];
  themes: ThemeWithSources[];
}) {
  const { containerRef, layout } = useFitLayout(documents.length);
  const cardWidth = layout.cardWidth;
  const localOrder = useUI((s) => s.localOrder);
  const setLocalOrder = useUI((s) => s.setLocalOrder);
  const activeThemeId = useUI((s) => s.activeThemeId);
  const searchHits = useUI((s) => s.searchHits);

  const orderedIds = localOrder ?? documents.map((d) => d.id);
  const byId = useMemo(
    () => new Map(documents.map((d) => [d.id, d])),
    [documents],
  );

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null;

  /** Source-document ids that should be emphasized */
  const emphasizedIds = useMemo(() => {
    const set = new Set<string>();
    if (activeTheme) {
      for (const s of activeTheme.sources) set.add(s.documentId);
    }
    for (const h of searchHits) set.add(h.documentId);
    return set;
  }, [activeTheme, searchHits]);

  /** Get highlight objects for a document/page combo */
  const highlightsFor = (documentId: string, page: number): Highlight[] => {
    const result: Highlight[] = [];
    if (activeTheme) {
      const color = THEME_PALETTE[activeTheme.color].highlight;
      for (const s of activeTheme.sources) {
        if (s.documentId === documentId && s.pageNumber === page) {
          result.push({ quote: s.quote, color });
        }
      }
    }
    if (searchHits.length > 0 && !activeTheme) {
      const color = THEME_PALETTE.yellow.highlight;
      for (const h of searchHits) {
        if (h.documentId === documentId && h.pageNumber === page) {
          result.push({ quote: h.quote, color });
        }
      }
    }
    return result;
  };

  const anyEmphasized = emphasizedIds.size > 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center px-4"
    >
      <Reorder.Group
        axis="x"
        values={orderedIds}
        onReorder={(next) => setLocalOrder(next as string[])}
        className="flex flex-wrap items-end justify-center gap-x-6 gap-y-7 max-w-full"
        as="div"
      >
        {orderedIds.map((id, idx) => {
          const doc = byId.get(id);
          if (!doc) return null;
          return (
            <DocumentCard
              key={id}
              doc={doc}
              index={idx}
              cardWidth={cardWidth}
              emphasized={emphasizedIds.has(id)}
              dimmed={anyEmphasized && !emphasizedIds.has(id)}
              highlightsForPage={(page) => highlightsFor(doc.id, page)}
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
}

export function getDocumentHighlightsFn(
  themes: ThemeWithSources[],
  activeThemeId: string | null,
  searchHits: HighlightHit[],
) {
  return (documentId: string, page: number): Highlight[] => {
    const result: Highlight[] = [];
    const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null;
    if (activeTheme) {
      const color = THEME_PALETTE[activeTheme.color].highlight;
      for (const s of activeTheme.sources) {
        if (s.documentId === documentId && s.pageNumber === page) {
          result.push({ quote: s.quote, color });
        }
      }
    }
    if (searchHits.length > 0 && !activeTheme) {
      const color = THEME_PALETTE.yellow.highlight;
      for (const h of searchHits) {
        if (h.documentId === documentId && h.pageNumber === page) {
          result.push({ quote: h.quote, color });
        }
      }
    }
    return result;
  };
}

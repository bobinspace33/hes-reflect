"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useUI } from "@/store/ui";
import { DocumentCard } from "@/components/DocumentCard";
import { useCarouselLayout } from "@/lib/useFitLayout";
import type { DocumentRecord, ThemeWithSources, HighlightHit } from "@/types";
import type { Highlight } from "@/components/PdfPage";
import { THEME_PALETTE } from "@/lib/colors";

const EDGE_ZONE_VW = 0.16; // fraction of viewport width per side
const EDGE_MAX_PX = 140;
const SCROLL_PX_PER_SEC = 420;

export function DocumentArray({
  documents,
  themes,
}: {
  documents: DocumentRecord[];
  themes: ThemeWithSources[];
}) {
  const { containerRef, layout } = useCarouselLayout();
  const { cardWidth, overlap } = layout;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useRef(0); // -1 left, 0 stop, +1 right
  const activeThemeId = useUI((s) => s.activeThemeId);
  const searchHits = useUI((s) => s.searchHits);

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null;

  const docIdsKey = useMemo(() => documents.map((d) => d.id).join("|"), [documents]);

  const emphasizedIds = useMemo(() => {
    const set = new Set<string>();
    if (activeTheme) {
      for (const s of activeTheme.sources) set.add(s.documentId);
    }
    for (const h of searchHits) set.add(h.documentId);
    return set;
  }, [activeTheme, searchHits]);

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

  // Continuous edge-hover autoscroll
  useEffect(() => {
    let running = true;
    let rafId = 0;
    let last = performance.now();

    function tick(now: number) {
      if (!running) return;
      const el = scrollRef.current;
      const dir = scrollDir.current;
      if (el && dir !== 0) {
        const dt = Math.min(0.05, (now - last) / 1000);
        el.scrollLeft += dir * SCROLL_PX_PER_SEC * dt;
      }
      last = now;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Center horizontally when dimensions or document lineup change (not theme highlights)
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || documents.length === 0) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max > 0) el.scrollLeft = max / 2;
  }, [docIdsKey, cardWidth, overlap]);

  const setEdgeDir = useCallback((dir: number) => {
    scrollDir.current = dir;
  }, []);

  const edgeWidth = `min(${Math.round(EDGE_ZONE_VW * 100)}vw, ${EDGE_MAX_PX}px)`;

  const onCarouselWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const dy = e.deltaY;
    const dx = e.deltaX;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      e.preventDefault();
      el.scrollLeft += dx;
      return;
    }
    if (e.shiftKey) {
      e.preventDefault();
      el.scrollLeft += dy;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 flex flex-col justify-center"
      role="presentation"
    >
      <div className="relative flex-1 min-h-0 w-full min-w-0">
        {/* Left autoscroll zone (mouse hover only; does not steal focus / tab order) */}
        <div
          role="presentation"
          aria-hidden
          className="absolute left-0 top-0 bottom-0 z-[25] cursor-w-resize bg-gradient-to-r from-black/55 via-black/25 to-transparent"
          style={{ width: edgeWidth }}
          onMouseEnter={() => setEdgeDir(-1)}
          onMouseLeave={() => setEdgeDir(0)}
        />

        {/* Right autoscroll zone */}
        <div
          role="presentation"
          aria-hidden
          className="absolute right-0 top-0 bottom-0 z-[25] cursor-e-resize bg-gradient-to-l from-black/55 via-black/25 to-transparent"
          style={{ width: edgeWidth }}
          onMouseEnter={() => setEdgeDir(1)}
          onMouseLeave={() => setEdgeDir(0)}
        />

        <div
          ref={scrollRef}
          className="h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain carousel-hide-scrollbar touch-pan-x"
          onWheel={onCarouselWheel}
        >
          <div
            className="flex flex-row items-end justify-center min-h-full py-1"
            style={{
              width: "max-content",
              marginLeft: "auto",
              marginRight: "auto",
              paddingLeft: "max(8vw, 2rem)",
              paddingRight: "max(8vw, 2rem)",
            }}
          >
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="relative flex-shrink-0"
                style={{
                  marginLeft: idx > 0 ? -overlap : 0,
                  zIndex: idx + 1,
                }}
              >
                <DocumentCard
                  doc={doc}
                  index={idx}
                  cardWidth={cardWidth}
                  emphasized={emphasizedIds.has(doc.id)}
                  dimmed={anyEmphasized && !emphasizedIds.has(doc.id)}
                  highlightsForPage={(page) => highlightsFor(doc.id, page)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
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

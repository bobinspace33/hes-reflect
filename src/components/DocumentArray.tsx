"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { useUI } from "@/store/ui";
import { DocumentCard } from "@/components/DocumentCard";
import { useCarouselLayout } from "@/lib/useFitLayout";
import type { DocumentRecord, ThemeWithSources, HighlightHit } from "@/types";
import type { Highlight } from "@/components/PdfPage";
import { THEME_PALETTE, themeMarkerColor } from "@/lib/colors";

const EDGE_ZONE_VW = 0.16; // fraction of viewport width per side
const EDGE_MAX_PX = 140;
const SCROLL_PX_PER_SEC = 420;
const CARD_MIN_SPREAD = 120;
const CARD_MAX_SPREAD = 300;
const SPREAD_GAP_PX = 40;
/** Letter page visual height multiplier (aligned with PdfPage/PageSkeleton proportion). */
const PHANTOM_PAGE_RATIO = 1.294134;

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
  /** Defer clearing hover so moving between overlapping cards doesn't flicker z-index. */
  const carouselHoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredCarouselDocId, setHoveredCarouselDocId] = useState<string | null>(null);
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

  /** Lowest page cited for each document in the active theme (highlights attach per page). */
  const themeLandingPageByDoc = useMemo(() => {
    const m = new Map<string, number>();
    if (!activeTheme) return m;
    for (const s of activeTheme.sources) {
      const prev = m.get(s.documentId);
      if (prev === undefined || s.pageNumber < prev) {
        m.set(s.documentId, s.pageNumber);
      }
    }
    return m;
  }, [activeTheme]);

  const emphasisGlow = useMemo(() => {
    if (activeTheme) return THEME_PALETTE[activeTheme.color].glow;
    if (searchHits.length > 0) return THEME_PALETTE.yellow.glow;
    return "rgba(212, 186, 116, 0.35)";
  }, [activeTheme, searchHits.length]);

  /** Theme picker: cite-only row, centered strip with gaps (no fan overlap). */
  const spreadTheme =
    !!(activeTheme && emphasizedIds.size > 0 && searchHits.length === 0);

  const emphasizedOrdered = useMemo(
    () => documents.filter((d) => emphasizedIds.has(d.id)),
    [documents, emphasizedIds],
  );

  const [containerInnerWidth, setContainerInnerWidth] = useState(1024);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = () =>
      setContainerInnerWidth(Math.max(0, Math.floor(node.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const spreadCardWidth = useMemo(() => {
    const n = emphasizedOrdered.length;
    if (n <= 0) return cardWidth;
    const horizonPad = 56;
    const avail = Math.max(240, containerInnerWidth - horizonPad);
    const gaps = SPREAD_GAP_PX * Math.max(0, n - 1);
    const per = Math.floor((avail - gaps) / n);
    return Math.min(
      CARD_MAX_SPREAD,
      Math.max(CARD_MIN_SPREAD, Math.max(per, Math.round(cardWidth * 1.08))),
    );
  }, [emphasizedOrdered.length, containerInnerWidth, cardWidth]);

  const cardAnchorsRef = useRef(new Map<string, HTMLDivElement | null>());

  const highlightsFor = (documentId: string, page: number): Highlight[] => {
    const result: Highlight[] = [];
    if (activeTheme) {
      const color = themeMarkerColor(activeTheme.color);
      for (const s of activeTheme.sources) {
        if (s.documentId === documentId && s.pageNumber === page) {
          result.push({ quote: s.quote, color });
        }
      }
    }
    if (searchHits.length > 0 && !activeTheme) {
      const color = themeMarkerColor("yellow");
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

  useEffect(() => {
    return () => {
      if (carouselHoverClearTimer.current != null) {
        clearTimeout(carouselHoverClearTimer.current);
      }
    };
  }, []);

  // Center carousel strip (backdrop fan). When spreading theme, cites move to overlay but phantom row keeps geometry.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || documents.length === 0) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max > 0) el.scrollLeft = max / 2;
  }, [docIdsKey, cardWidth, overlap, spreadTheme]);

  // When a theme is chosen, gently bring the first cited document toward center view (carousel only).
  useLayoutEffect(() => {
    if (spreadTheme || !activeTheme || activeTheme.sources.length === 0) return;
    const cited = new Set(activeTheme.sources.map((s) => s.documentId));
    const anchorDoc = documents.find((d) => cited.has(d.id));
    if (!anchorDoc) return;
    const el = cardAnchorsRef.current.get(anchorDoc.id);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }, [activeThemeId, activeTheme, documents, docIdsKey, spreadTheme]);

  const setEdgeDir = useCallback((dir: number) => {
    scrollDir.current = dir;
  }, []);

  const carouselCardEnter = useCallback((id: string) => {
    if (carouselHoverClearTimer.current != null) {
      clearTimeout(carouselHoverClearTimer.current);
      carouselHoverClearTimer.current = null;
    }
    setHoveredCarouselDocId(id);
  }, []);

  const carouselCardLeave = useCallback((id: string) => {
    carouselHoverClearTimer.current = setTimeout(() => {
      setHoveredCarouselDocId((cur) => (cur === id ? null : cur));
      carouselHoverClearTimer.current = null;
    }, 0);
  }, []);

  const highlightedCarouselZ = documents.length + 50;

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
        {/* Edge-hover autoscroll — works for blurred fan beneath theme cites too */}
        <div
          role="presentation"
          aria-hidden
          className="absolute left-0 top-0 bottom-0 z-[25] cursor-w-resize bg-transparent"
          style={{ width: edgeWidth }}
          onMouseEnter={() => setEdgeDir(-1)}
          onMouseLeave={() => setEdgeDir(0)}
        />
        <div
          role="presentation"
          aria-hidden
          className="absolute right-0 top-0 bottom-0 z-[25] cursor-e-resize bg-transparent"
          style={{ width: edgeWidth }}
          onMouseEnter={() => setEdgeDir(1)}
          onMouseLeave={() => setEdgeDir(0)}
        />

        {/* Backdrop: full carousel order; cites become ghost slots so neighbors stay overlapped */}
        <div
          ref={scrollRef}
          className="relative z-10 h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain carousel-hide-scrollbar touch-pan-x"
          onWheel={onCarouselWheel}
        >
          <LayoutGroup id="documents-stage">
            <motion.div
              layoutRoot
              className="flex min-h-full flex-row items-end justify-center px-2 pb-9 pt-20"
              style={{
                width: "max-content",
                marginLeft: "auto",
                marginRight: "auto",
                paddingLeft: "max(8vw, 2rem)",
                paddingRight: "max(8vw, 2rem)",
              }}
              transition={{
                layout: { type: "spring", stiffness: 340, damping: 34 },
              }}
            >
              {documents.map((doc, idx) => {
                const globalIndex = idx;
                const cw = cardWidth;
                const isCitedSpot = spreadTheme && emphasizedIds.has(doc.id);

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    transition={{
                      layout: { type: "spring", stiffness: 340, damping: 34 },
                    }}
                    ref={(node) => {
                      if (isCitedSpot) {
                        cardAnchorsRef.current.delete(doc.id);
                        return;
                      }
                      if (node) cardAnchorsRef.current.set(doc.id, node);
                      else cardAnchorsRef.current.delete(doc.id);
                    }}
                    className={
                      "relative shrink-0 " + (isCitedSpot ? "pointer-events-none" : "")
                    }
                    onMouseEnter={
                      isCitedSpot ? undefined : () => carouselCardEnter(doc.id)
                    }
                    onMouseLeave={
                      isCitedSpot ? undefined : () => carouselCardLeave(doc.id)
                    }
                    style={{
                      marginLeft: idx > 0 ? -overlap : 0,
                      zIndex:
                        !isCitedSpot && hoveredCarouselDocId === doc.id
                          ? highlightedCarouselZ
                          : globalIndex + 1,
                    }}
                  >
                    {isCitedSpot ? (
                      <motion.div
                        layout
                        className="rounded-none border border-black/14 bg-gradient-to-b from-paper/85 to-black/55 shadow-page"
                        aria-hidden
                        style={{
                          width: cw,
                          height: Math.round(cw * PHANTOM_PAGE_RATIO),
                          filter: "blur(5px)",
                          opacity: 0.45,
                          boxShadow:
                            "0 18px 40px -14px rgba(20,14,4,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                      />
                    ) : (
                      <DocumentCard
                        doc={doc}
                        index={globalIndex}
                        cardWidth={cw}
                        spreadLayout={false}
                        emphasized={!spreadTheme && emphasizedIds.has(doc.id)}
                        dimmed={
                          spreadTheme
                            ? !emphasizedIds.has(doc.id)
                            : anyEmphasized && !emphasizedIds.has(doc.id)
                        }
                        highlightsForPage={(page) => highlightsFor(doc.id, page)}
                        themeRevealSignal={activeThemeId}
                        themeLandingPage={
                          activeTheme ? (themeLandingPageByDoc.get(doc.id) ?? null) : null
                        }
                        emphasisGlow={emphasisGlow}
                      />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </LayoutGroup>
        </div>

        {/* Foreground: cited artifacts centered, enlarged, gaps — singles source of Pdf for each */}
        {spreadTheme ? (
          <div className="pointer-events-none absolute inset-0 z-[38] flex items-end justify-center pb-14 pt-[4.5rem]">
            <motion.div
              layout
              className="flex flex-row flex-wrap items-end justify-center px-6"
              style={{
                gap: SPREAD_GAP_PX,
              }}
              transition={{
                layout: { type: "spring", stiffness: 340, damping: 34 },
              }}
            >
              {emphasizedOrdered.map((doc) => {
                const globalIndex = documents.findIndex((d) => d.id === doc.id);
                const idxForAnim = globalIndex >= 0 ? globalIndex : 0;
                return (
                  <motion.div
                    key={`spread-${doc.id}`}
                    layout
                    transition={{
                      layout: { type: "spring", stiffness: 340, damping: 34 },
                    }}
                    className="pointer-events-auto shrink-0"
                    style={{
                      zIndex: Math.max(documents.length, 40) + idxForAnim + 2,
                    }}
                  >
                    <DocumentCard
                      doc={doc}
                      index={idxForAnim}
                      cardWidth={spreadCardWidth}
                      spreadLayout
                      emphasized
                      dimmed={false}
                      highlightsForPage={(page) => highlightsFor(doc.id, page)}
                      themeRevealSignal={activeThemeId}
                      themeLandingPage={
                        activeTheme ? (themeLandingPageByDoc.get(doc.id) ?? null) : null
                      }
                      emphasisGlow={emphasisGlow}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ) : null}
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
      const color = themeMarkerColor(activeTheme.color);
      for (const s of activeTheme.sources) {
        if (s.documentId === documentId && s.pageNumber === page) {
          result.push({ quote: s.quote, color });
        }
      }
    }
    if (searchHits.length > 0 && !activeTheme) {
      const color = themeMarkerColor("yellow");
      for (const h of searchHits) {
        if (h.documentId === documentId && h.pageNumber === page) {
          result.push({ quote: h.quote, color });
        }
      }
    }
    return result;
  };
}

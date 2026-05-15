"use client";

import { useEffect, useRef, useState } from "react";

const LETTER_ASPECT = 8.5 / 11; // width / height = 0.7727

const GAP_X = 24;
const GAP_Y = 28;
const META_HEIGHT = 30; // title strip + shadow plate below the page
const CARD_MIN = 110;
const CARD_MAX = 360;

export type FitLayout = {
  cardWidth: number;
  rows: number;
  perRow: number;
};

/**
 * Returns a ref to attach to the documents *container* + a layout that
 * sizes cards so all of them fit inside that container without scrolling.
 *
 * Strategy: try every plausible row count, pick the one that maximizes
 * the resulting card width (constrained by both width-per-row and
 * height-per-row).
 */
export function useFitLayout(docCount: number): {
  containerRef: React.RefObject<HTMLDivElement>;
  layout: FitLayout;
} {
  const containerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>;
  const [layout, setLayout] = useState<FitLayout>({
    cardWidth: 220,
    rows: 2,
    perRow: Math.max(1, Math.ceil(docCount / 2)),
  });

  useEffect(() => {
    if (docCount === 0) return;
    const node = containerRef.current;
    if (!node) return;

    function compute() {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const W = Math.max(0, rect.width);
      const H = Math.max(0, rect.height);
      if (W < 20 || H < 20) return;

      let best: (FitLayout & { score: number }) | null = null;

      // Try every row count from 1..docCount (capped at something reasonable)
      const maxRows = Math.min(docCount, 5);
      for (let rows = 1; rows <= maxRows; rows++) {
        const perRow = Math.ceil(docCount / rows);

        const widthFromW = (W - (perRow - 1) * GAP_X) / perRow;
        const rowHeight = (H - (rows - 1) * GAP_Y) / rows;
        const widthFromH = Math.max(0, rowHeight - META_HEIGHT) * LETTER_ASPECT;

        let cardWidth = Math.min(widthFromW, widthFromH);
        cardWidth = Math.max(0, Math.min(CARD_MAX, cardWidth));

        if (cardWidth <= 0) continue;
        const score = cardWidth;
        if (!best || score > best.score) {
          best = { cardWidth: Math.floor(cardWidth), rows, perRow, score };
        }
      }

      if (!best) {
        setLayout({ cardWidth: CARD_MIN, rows: 1, perRow: docCount });
        return;
      }

      const cardWidth = Math.max(CARD_MIN, best.cardWidth);
      setLayout({ cardWidth, rows: best.rows, perRow: best.perRow });
    }

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(node);
    return () => ro.disconnect();
  }, [docCount]);

  return { containerRef, layout };
}

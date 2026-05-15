"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const LETTER_ASPECT = 8.5 / 11; // width / height = 0.7727
const META_HEIGHT = 34; // title strip + shadow under page
const CARD_MIN = 120;
const CARD_MAX = 300;

export type CarouselLayout = {
  cardWidth: number;
  /** horizontal overlap between adjacent cards (each card after the first uses -marginLeft) */
  overlap: number;
};

/**
 * Single-row carousel: size each page from the container height only.
 * Overlap scales with card width so the fan stays readable.
 */
export function useCarouselLayout(): {
  containerRef: RefObject<HTMLDivElement>;
  layout: CarouselLayout;
} {
  const containerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const [layout, setLayout] = useState<CarouselLayout>({
    cardWidth: 200,
    overlap: 36,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function compute() {
      if (!node) return;
      const H = Math.max(0, node.getBoundingClientRect().height);
      if (H < 40) return;

      const raw = Math.floor((H - META_HEIGHT) * LETTER_ASPECT);
      const cardWidth = Math.min(CARD_MAX, Math.max(CARD_MIN, raw));
      const overlap = Math.min(64, Math.max(24, Math.round(cardWidth * 0.15)));
      setLayout({ cardWidth, overlap });
    }

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return { containerRef, layout };
}

"use client";

import { useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  // Use unpkg's worker so we don't have to ship the worker file separately
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export type Highlight = {
  /** A verbatim substring on this page to highlight. Matching is case-insensitive. */
  quote: string;
  /** CSS color for the highlight background. */
  color: string;
};

export function PdfPage({
  url,
  pageNumber,
  width,
  highlights = [],
  onPageRendered,
  showTextLayer = true,
}: {
  url: string;
  pageNumber: number;
  width: number;
  highlights?: Highlight[];
  onPageRendered?: () => void;
  showTextLayer?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Apply highlights to the rendered text layer after each render
  useEffect(() => {
    if (!containerRef.current) return;
    const layer = containerRef.current.querySelector<HTMLElement>(
      ".react-pdf__Page__textContent",
    );
    if (!layer) return;
    applyHighlights(layer, highlights);
  }, [highlights, pageNumber, url, width]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <Document file={url} loading={<PageSkeleton width={width} />} error={<PageError />}>
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={showTextLayer}
          renderAnnotationLayer={false}
          onRenderSuccess={() => {
            if (containerRef.current) {
              const layer = containerRef.current.querySelector<HTMLElement>(
                ".react-pdf__Page__textContent",
              );
              if (layer) applyHighlights(layer, highlights);
            }
            onPageRendered?.();
          }}
        />
      </Document>
    </div>
  );
}

function PageSkeleton({ width }: { width: number }) {
  return (
    <div
      className="bg-paper rounded-sm shadow-page animate-pulse"
      style={{ width, height: width * 1.294, opacity: 0.55 }}
    />
  );
}

function PageError() {
  return (
    <div className="bg-paper text-ink p-4 rounded-sm text-xs">
      Couldn't render this page.
    </div>
  );
}

/**
 * Walk the text layer spans and wrap any matching substring (across spans) in
 * a styled <mark>. We do this by reading each span's textContent, finding
 * matches, and splitting the span at the match boundaries.
 *
 * pdf.js text layer spans correspond to runs of text positioned on the page;
 * a "quote" may span multiple spans because of font/style changes or rotations,
 * so we first concatenate, find the match in the flat text, then map back to
 * span ranges.
 */
function applyHighlights(layer: HTMLElement, highlights: Highlight[]) {
  // Reset: remove existing marks
  layer.querySelectorAll("mark.hl-mark").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });

  if (highlights.length === 0) return;

  // pdf.js text layer is a collection of <span> children (text runs).
  const spans = Array.from(layer.querySelectorAll<HTMLSpanElement>("span")).filter(
    (s) => !s.classList.contains("markedContent") && s.textContent !== null,
  );

  // Build a flat string + index map [{spanIdx, offsetInSpan}, ...]
  type Loc = { spanIdx: number; offset: number };
  const locs: Loc[] = [];
  let flat = "";
  spans.forEach((sp, spanIdx) => {
    const text = sp.textContent || "";
    for (let i = 0; i < text.length; i++) {
      locs.push({ spanIdx, offset: i });
      flat += text[i];
    }
    // Add a synthetic space between spans (pdf.js sometimes drops trailing spaces),
    // matching against flatLower with the same logic.
    locs.push({ spanIdx, offset: text.length });
    flat += " ";
  });

  const flatLower = flat.toLowerCase();

  for (const hl of highlights) {
    const needle = normalizeNeedle(hl.quote);
    if (!needle) continue;
    const needleLower = needle.toLowerCase();
    let from = 0;
    while (from < flatLower.length) {
      const idx = findFuzzy(flatLower, needleLower, from);
      if (idx === -1) break;
      const start = locs[idx];
      const endIdx = idx + needleLower.length;
      // Walk back from endIdx if it points past the array
      const end = locs[Math.min(endIdx, locs.length - 1)];
      if (start && end) {
        wrapRange(spans, start, end, hl.color);
      }
      from = idx + needleLower.length;
    }
  }
}

function normalizeNeedle(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Like indexOf, but treats any run of whitespace in the haystack as equivalent
 * to a single space (needle is already normalized). This is important because
 * pdf.js text-layer text can contain extra spaces between runs.
 */
function findFuzzy(haystack: string, needle: string, from: number): number {
  if (!needle) return -1;
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    let hi = i;
    let ni = 0;
    while (ni < needle.length) {
      const hc = haystack[hi];
      const nc = needle[ni];
      if (/\s/.test(hc) && /\s/.test(nc)) {
        // skip whitespace runs on the haystack side
        while (hi < haystack.length && /\s/.test(haystack[hi])) hi++;
        ni++;
        continue;
      }
      if (hc !== nc) continue outer;
      hi++;
      ni++;
    }
    return i;
  }
  return -1;
}

/**
 * Wrap the text between Loc start and Loc end (inclusive of start, exclusive of end)
 * across span boundaries with <mark class="hl-mark"> elements.
 */
function wrapRange(
  spans: HTMLSpanElement[],
  start: { spanIdx: number; offset: number },
  end: { spanIdx: number; offset: number },
  color: string,
) {
  for (let i = start.spanIdx; i <= end.spanIdx; i++) {
    const span = spans[i];
    if (!span) continue;
    const text = span.textContent ?? "";
    const localStart = i === start.spanIdx ? start.offset : 0;
    const localEnd = i === end.spanIdx ? Math.min(end.offset, text.length) : text.length;
    if (localStart >= localEnd) continue;

    const before = text.slice(0, localStart);
    const middle = text.slice(localStart, localEnd);
    const after = text.slice(localEnd);

    span.textContent = "";
    if (before) span.appendChild(document.createTextNode(before));
    const mark = document.createElement("mark");
    mark.className = "hl-mark";
    mark.style.setProperty("--hl-color", color);
    mark.textContent = middle;
    span.appendChild(mark);
    if (after) span.appendChild(document.createTextNode(after));
  }
}

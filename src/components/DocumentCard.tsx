"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUI } from "@/store/ui";
import { PdfPage, type Highlight } from "@/components/PdfPage";
import type { DocumentRecord } from "@/types";

export function DocumentCard({
  doc,
  highlightsForPage,
  emphasized,
  dimmed,
  index,
  cardWidth,
  spreadLayout = false,
  themeRevealSignal,
  themeLandingPage,
  emphasisGlow,
}: {
  doc: DocumentRecord;
  highlightsForPage: (page: number) => Highlight[];
  emphasized: boolean;
  dimmed: boolean;
  index: number;
  cardWidth: number;
  spreadLayout?: boolean;
  /** When set together with landing page: jump thumbnails to cited pages for this theme */
  themeRevealSignal: string | null;
  themeLandingPage: number | null;
  emphasisGlow: string;
}) {
  const setMode = useUI((s) => s.setMode);
  const mode = useUI((s) => s.mode);
  const [pageNumber, setPageNumber] = useState(1);
  const [hovered, setHovered] = useState(false);
  /** wheel-driven additional zoom (1.0..1.5) applied in browse mode */
  const [wheelZoom, setWheelZoom] = useState(1);
  const lastAppliedThemeJump = useRef("");

  const isFocusedHere =
    mode.kind === "focus" && mode.documentId === doc.id;

  // When a theme is selected, flip to its earliest cited page on this doc (browse / focus).
  useEffect(() => {
    if (!themeRevealSignal) {
      lastAppliedThemeJump.current = "";
      return;
    }
    if (themeLandingPage == null) {
      lastAppliedThemeJump.current = "";
      return;
    }
    const p = themeLandingPage;
    if (p < 1 || p > doc.pageCount) return;

    const stamp = `${themeRevealSignal}:${doc.id}`;
    if (lastAppliedThemeJump.current === stamp) return;
    lastAppliedThemeJump.current = stamp;

    setPageNumber(p);

    const m = useUI.getState().mode;
    if (m.kind === "focus" && m.documentId === doc.id) {
      useUI.getState().setMode({ ...m, pageNumber: p });
    }
  }, [themeRevealSignal, themeLandingPage, doc.pageCount, doc.id]);

  // Sync card's local pageNumber from focus mode so closing focus reveals
  // whichever page the user navigated to in the modal.
  useEffect(() => {
    if (mode.kind === "focus" && mode.documentId === doc.id) {
      setPageNumber(mode.pageNumber);
    }
  }, [mode, doc.id]);

  // Reset wheel zoom when not hovering for a while
  useEffect(() => {
    if (hovered) return;
    const t = setTimeout(() => setWheelZoom(1), 500);
    return () => clearTimeout(t);
  }, [hovered, wheelZoom]);

  const onClick = useCallback(() => {
    if (mode.kind === "focus" && mode.documentId === doc.id) {
      // already focused: advance page (loop)
      const next = (pageNumber % doc.pageCount) + 1;
      setPageNumber(next);
      setMode({ ...mode, pageNumber: next });
      return;
    }
    // enter focus mode at current pageNumber
    setMode({ kind: "focus", documentId: doc.id, pageNumber, scale: 1 });
  }, [mode, doc.id, doc.pageCount, pageNumber, setMode]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (doc.pageCount <= 1) return;
      e.preventDefault();
      const prev = pageNumber === 1 ? doc.pageCount : pageNumber - 1;
      setPageNumber(prev);
      if (mode.kind === "focus" && mode.documentId === doc.id) {
        setMode({ ...mode, pageNumber: prev });
      }
    },
    [doc.pageCount, doc.id, pageNumber, mode, setMode],
  );

  // Non-passive wheel listener so we can preventDefault and stop page scroll
  // while magnifying. React's onWheel is passive by default.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const handler = (e: WheelEvent) => {
      if (mode.kind === "focus") return; // handled by focus overlay
      // Only intercept when card is being hovered, otherwise let page scroll.
      if (!hovered) return;
      e.preventDefault();
      const delta = e.deltaY * 0.0015;
      setWheelZoom((z) => Math.min(1.5, Math.max(1, z + delta)));
    };
    node.addEventListener("wheel", handler, { passive: false });
    return () => node.removeEventListener("wheel", handler);
  }, [mode.kind, hovered]);

  // Floating animation: gentle y bob with per-card phase offset
  const floatDelay = (index * 0.6) % 3.2;

  const scale =
    isFocusedHere ? 0
    : Math.max(wheelZoom, hovered && !spreadLayout ? 1.07 : 1) *
      (spreadLayout ? 1 : emphasized ? 1.1 : 1);

  return (
    <div className="select-none">
      <motion.div
        layoutId={`doc-${doc.id}`}
        ref={wrapperRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        onContextMenu={onContextMenu}
        animate={{
          scale,
          y: isFocusedHere ? 0 : spreadLayout ? 0 : [0, -6, 0],
          opacity: isFocusedHere ? 0 : dimmed ? 0.52 : 1,
          filter: dimmed ? "blur(7px) saturate(0.7)" : "blur(0px) saturate(1)",
        }}
        transition={{
          scale: { type: "spring", stiffness: 220, damping: 22 },
          ...(spreadLayout
            ? { y: { duration: 0.35 } }
            : {
                y: {
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: floatDelay,
                },
              }),
          opacity: { duration: 0.45 },
          filter: { duration: 0.4 },
        }}
        className="relative cursor-pointer"
        style={{
          width: cardWidth,
          willChange: "transform",
        }}
      >
        <motion.div
          className="pointer-events-none absolute bottom-full left-0 right-0 z-20 mb-2 flex justify-center px-2"
          initial={false}
          animate={{
            opacity: hovered && !isFocusedHere ? 1 : 0,
            y: hovered && !isFocusedHere ? 0 : 8,
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          aria-hidden={!hovered}
        >
          <div className="w-max max-w-[min(94vw,24rem)] text-center">
            <div className="rounded-lg border border-silver-200/25 bg-paper/92 px-3 py-1.5 text-ink shadow-page backdrop-blur-sm">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] leading-snug max-w-[32rem] whitespace-normal">
                {doc.title}
              </div>
              {doc.pageCount > 1 ? (
                <div className="mt-1 font-mono text-[9px] uppercase tracking-normal text-silver-600">
                  Page {pageNumber} / {doc.pageCount}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>

        <div
          className={
            "relative rounded-none bg-paper overflow-hidden shadow-page transition-shadow duration-300 " +
            (emphasized ? "theme-glow" : "")
          }
          style={{
            // theme-glow uses --glow CSS var; match active theme / search accent
            ["--glow" as string]: emphasized
              ? emphasisGlow
              : "rgba(212, 186, 116, 0.35)",
          }}
        >
          <PdfPage
            url={doc.pdfUrl}
            pageNumber={pageNumber}
            width={cardWidth}
            highlights={highlightsForPage(pageNumber)}
            showTextLayer
          />
        </div>
      </motion.div>
    </div>
  );
}

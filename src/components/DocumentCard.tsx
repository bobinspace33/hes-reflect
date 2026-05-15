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
}: {
  doc: DocumentRecord;
  highlightsForPage: (page: number) => Highlight[];
  emphasized: boolean;
  dimmed: boolean;
  index: number;
  cardWidth: number;
}) {
  const setMode = useUI((s) => s.setMode);
  const mode = useUI((s) => s.mode);
  const [pageNumber, setPageNumber] = useState(1);
  const [hovered, setHovered] = useState(false);
  /** wheel-driven additional zoom (1.0..1.5) applied in browse mode */
  const [wheelZoom, setWheelZoom] = useState(1);

  const isFocusedHere =
    mode.kind === "focus" && mode.documentId === doc.id;

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
      const delta = -e.deltaY * 0.0015;
      setWheelZoom((z) => Math.min(1.5, Math.max(1, z + delta)));
    };
    node.addEventListener("wheel", handler, { passive: false });
    return () => node.removeEventListener("wheel", handler);
  }, [mode.kind, hovered]);

  // Floating animation: gentle y bob with per-card phase offset
  const floatDelay = (index * 0.6) % 3.2;

  const scale = isFocusedHere ? 0 : Math.max(wheelZoom, hovered ? 1.07 : 1) * (emphasized ? 1.1 : 1);

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
          y: isFocusedHere ? 0 : [0, -6, 0],
          opacity: isFocusedHere ? 0 : dimmed ? 0.32 : 1,
          filter: dimmed ? "saturate(0.7)" : "saturate(1)",
        }}
        transition={{
          scale: { type: "spring", stiffness: 220, damping: 22 },
          y: { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
          opacity: { duration: 0.45 },
          filter: { duration: 0.45 },
        }}
        className="relative cursor-pointer"
        style={{
          width: cardWidth,
          willChange: "transform",
        }}
      >
        {/* Soft shadow plate beneath the page */}
        <div
          className="absolute left-1/2 -bottom-3 -translate-x-1/2 rounded-full"
          aria-hidden
          style={{
            width: "70%",
            height: 14,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)",
            filter: "blur(6px)",
          }}
        />

        <div
          className={
            "relative rounded-[3px] bg-paper overflow-hidden shadow-page transition-shadow duration-300 " +
            (emphasized ? "theme-glow" : "")
          }
          style={{
            // theme-glow uses --glow CSS var; default to gold
            ["--glow" as any]: emphasized
              ? "rgba(212, 186, 116, 0.55)"
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

        {/* metadata strip */}
        <div className="mt-3 px-1 flex items-center justify-between gap-2">
          <div
            className="text-[11px] uppercase tracking-[0.18em] text-silver-200/85 truncate"
            title={doc.title}
          >
            {doc.title}
          </div>
          {doc.pageCount > 1 ? (
            <div className="text-[10px] font-mono text-silver-300/70 shrink-0">
              {pageNumber}/{doc.pageCount}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

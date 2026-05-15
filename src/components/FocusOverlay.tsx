"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUI } from "@/store/ui";
import { PdfPage, type Highlight } from "@/components/PdfPage";
import type { DocumentRecord } from "@/types";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export function FocusOverlay({
  documents,
  highlightsFor,
}: {
  documents: DocumentRecord[];
  highlightsFor: (documentId: string, page: number) => Highlight[];
}) {
  const mode = useUI((s) => s.mode);
  const setMode = useUI((s) => s.setMode);

  const focused = mode.kind === "focus";
  const doc = focused
    ? documents.find((d) => d.id === mode.documentId)
    : undefined;

  const close = useCallback(() => setMode({ kind: "browse" }), [setMode]);

  const advance = useCallback(
    (dir: 1 | -1) => {
      if (mode.kind !== "focus" || !doc) return;
      const next =
        ((mode.pageNumber - 1 + dir + doc.pageCount) % doc.pageCount) + 1;
      setMode({ ...mode, pageNumber: next });
    },
    [mode, doc, setMode],
  );

  const setScale = useCallback(
    (updater: (s: number) => number) => {
      if (mode.kind !== "focus") return;
      const next = Math.max(0.6, Math.min(3, updater(mode.scale)));
      setMode({ ...mode, scale: next });
    },
    [mode, setMode],
  );

  // Keyboard handlers
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") advance(1);
      else if (e.key === "ArrowLeft") advance(-1);
      else if (e.key === "+" || e.key === "=") setScale((s) => s + 0.15);
      else if (e.key === "-") setScale((s) => s - 0.15);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, close, advance, setScale]);

  const wheelTargetRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!focused) return;
    const node = wheelTargetRef.current;
    if (!node) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0015;
      setScale((s) => s + delta);
    };
    node.addEventListener("wheel", handler, { passive: false });
    return () => node.removeEventListener("wheel", handler);
  }, [focused, setScale]);

  // Compute base width for the focused page: try to fill 78vh height at Letter ratio
  const [vh, setVh] = useState<number>(800);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const baseWidth = useMemo(() => Math.max(360, Math.round(vh * 0.78 * 0.773)), [vh]);

  return (
    <AnimatePresence>
      {focused && doc ? (
        <motion.div
          key="focus"
          ref={wheelTargetRef}
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={close}
        >
          <motion.div
            className="absolute inset-0 z-0 bg-[rgba(13,12,10,0.42)] backdrop-blur-[18px]"
            style={{
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            }}
            aria-hidden
          />

          {/* Page */}
          <motion.div
            layoutId={`doc-${doc.id}`}
            className="relative z-10 isolate bg-paper rounded-none shadow-page-lift overflow-hidden opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              advance(1);
            }}
            animate={{ scale: mode.kind === "focus" ? mode.scale : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{
              width: baseWidth,
            }}
          >
            <PdfPage
              url={doc.pdfUrl}
              pageNumber={mode.kind === "focus" ? mode.pageNumber : 1}
              width={baseWidth}
              highlights={highlightsFor(
                doc.id,
                mode.kind === "focus" ? mode.pageNumber : 1,
              )}
            />
          </motion.div>

          {/* Controls bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.15 }}
            className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 frosted-dark rounded-full px-3 py-2 flex items-center gap-2 text-silver-100"
            onClick={(e) => e.stopPropagation()}
          >
            {doc.pageCount > 1 ? (
              <>
                <button
                  className="p-2 rounded-full hover:bg-white/10"
                  onClick={() => advance(-1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="font-mono text-xs px-2 tabular-nums">
                  {mode.kind === "focus" ? mode.pageNumber : 1} / {doc.pageCount}
                </div>
                <button
                  className="p-2 rounded-full hover:bg-white/10"
                  onClick={() => advance(1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="w-px h-5 bg-white/15 mx-1" />
              </>
            ) : null}
            <button
              className="p-2 rounded-full hover:bg-white/10"
              onClick={() => setScale((s) => s - 0.2)}
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10"
              onClick={() => setScale((s) => s + 0.2)}
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-5 bg-white/15 mx-1" />
            <button
              className="p-2 rounded-full hover:bg-white/10"
              onClick={close}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 left-1/2 z-30 -translate-x-1/2 frosted-dark px-4 py-2 rounded-full text-silver-100 text-xs uppercase tracking-[0.18em] max-w-[80vw] truncate"
          >
            {doc.title}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

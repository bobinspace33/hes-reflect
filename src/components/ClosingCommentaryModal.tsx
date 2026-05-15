"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useUI } from "@/store/ui";
import { THEME_PALETTE } from "@/lib/colors";

export function ClosingCommentaryModal({ body }: { body: string }) {
  const open = useUI((s) => s.closingCommentaryOpen);
  const setClosingCommentaryOpen = useUI((s) => s.setClosingCommentaryOpen);
  const palette = THEME_PALETTE.yellow;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="closing-commentary"
          initial={{ x: "110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="fixed top-6 right-6 bottom-6 w-[420px] max-w-[92vw] z-[56] flex flex-col rounded-2xl overflow-hidden frosted-dark"
          style={{
            boxShadow: `0 30px 80px -10px rgba(0,0,0,0.55), inset 0 1px 0 ${palette.accent}33`,
          }}
          aria-modal="true"
          aria-labelledby="closing-commentary-modal-title"
        >
          <div
            className="px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))`,
            }}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
                Afterword
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: palette.accent }}
                />
                <h2 id="closing-commentary-modal-title" className="text-lg font-medium text-silver-50">
                  Closing commentary
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setClosingCommentaryOpen(false)}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-white/10 text-silver-200"
            >
              <X size={18} />
            </button>
          </div>

          <section className="flex-1 min-h-0 overflow-y-auto thin-scroll px-5 py-4">
            {body.trim() ? (
              <div className="text-silver-100 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                {body}
              </div>
            ) : (
              <div className="text-silver-300/55 font-mono text-[12px] italic">
                (No closing commentary yet — add one in Admin → Themes.)
              </div>
            )}
          </section>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

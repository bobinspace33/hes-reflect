"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useUI } from "@/store/ui";
import { THEME_PALETTE } from "@/lib/colors";
import { SITE_INTRODUCTION_KEY } from "@/lib/site-copy";
import { SiteModalWall } from "@/components/SiteModalWall";

export function IntroductionModal({ body }: { body: string }) {
  const open = useUI((s) => s.introductionOpen);
  const setIntroductionOpen = useUI((s) => s.setIntroductionOpen);
  const palette = THEME_PALETTE.yellow;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="intro"
          initial={{ x: "-110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="fixed top-6 left-6 bottom-6 z-[55] flex flex-col rounded-2xl overflow-hidden frosted-dark w-[min(92vw,max(300px,33.333vw))]"
          style={{
            boxShadow: `0 30px 80px -10px rgba(0,0,0,0.55), inset 0 1px 0 ${palette.accent}33`,
          }}
          aria-modal="true"
          aria-labelledby="introduction-modal-title"
        >
          <div
            className="px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))`,
            }}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
                Welcome
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: palette.accent }}
                />
                <h2 id="introduction-modal-title" className="text-lg font-medium text-silver-50">
                  Introduction
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIntroductionOpen(false)}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-white/10 text-silver-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 flex-col">
            <section className="flex-none max-h-[min(38vh,320px)] min-h-0 overflow-y-auto thin-scroll px-5 py-4 border-b border-white/10">
              {body.trim() ? (
                <div className="text-silver-100 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                  {body}
                </div>
              ) : (
                <div className="text-silver-300/55 font-mono text-[12px] italic">
                  (No introduction has been written yet — add one in Admin → Themes.)
                </div>
              )}
            </section>
            <SiteModalWall wallKey={SITE_INTRODUCTION_KEY} palette={palette} />
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

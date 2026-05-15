"use client";

import { motion } from "framer-motion";
import { useUI } from "@/store/ui";
import { THEME_PALETTE } from "@/lib/colors";
import type { ThemeWithSources } from "@/types";
import { useEffect, useRef } from "react";

export function ThemeButtons({ themes }: { themes: ThemeWithSources[] }) {
  const activeThemeId = useUI((s) => s.activeThemeId);
  const setActiveTheme = useUI((s) => s.setActiveTheme);
  const setReflectionOpen = useUI((s) => s.setReflectionOpen);

  // After a theme is selected, open the reflection modal once highlights finish animating.
  const lastOpenedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!activeThemeId) {
      lastOpenedFor.current = null;
      return;
    }
    if (lastOpenedFor.current === activeThemeId) return;
    lastOpenedFor.current = activeThemeId;
    // Highlight animation completes ~700ms after state change; modal slides in after.
    const t = setTimeout(() => setReflectionOpen(true), 750);
    return () => clearTimeout(t);
  }, [activeThemeId, setReflectionOpen]);

  // Split into 2 roughly equal rows
  const half = Math.ceil(themes.length / 2);
  const row1 = themes.slice(0, half);
  const row2 = themes.slice(half);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {[row1, row2].filter((r) => r.length).map((row, ri) => (
        <div key={ri} className="flex flex-wrap items-center justify-center gap-3">
          {row.map((t) => {
            const active = t.id === activeThemeId;
            const palette = THEME_PALETTE[t.color];
            return (
              <motion.button
                key={t.id}
                onClick={() => setActiveTheme(active ? null : t.id)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  boxShadow: active
                    ? `0 0 0 1px ${palette.accent}, 0 8px 32px ${palette.glow}`
                    : "0 8px 32px rgba(40, 30, 10, 0.15)",
                }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className={
                  "frosted rounded-full px-5 py-2.5 text-sm font-medium tracking-wide " +
                  "text-silver-100 hover:text-silver-50 transition-colors"
                }
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.06))`
                    : undefined,
                  borderColor: active ? palette.accent : undefined,
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                  style={{ background: palette.accent }}
                />
                {t.label}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

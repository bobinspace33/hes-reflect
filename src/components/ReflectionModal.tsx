"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUI } from "@/store/ui";
import { THEME_PALETTE } from "@/lib/colors";
import type { ReflectionRecord, ThemeWithSources } from "@/types";

export function ReflectionModal({ themes }: { themes: ThemeWithSources[] }) {
  const open = useUI((s) => s.reflectionOpen);
  const activeThemeId = useUI((s) => s.activeThemeId);
  const setReflectionOpen = useUI((s) => s.setReflectionOpen);

  const theme = themes.find((t) => t.id === activeThemeId) ?? null;
  const palette = theme ? THEME_PALETTE[theme.color] : null;

  const [reflections, setReflections] = useState<ReflectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  // Load reflections whenever the active theme changes (or modal opens)
  useEffect(() => {
    if (!open || !theme) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reflections?themeId=${theme.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.ok) setReflections(j.reflections);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, theme]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!theme || !body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          themeId: theme.id,
          name: name.trim() || null,
          body: body.trim(),
        }),
      });
      const j = await res.json();
      if (j.ok) {
        setReflections((rs) => [j.reflection, ...rs]);
        setBody("");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && theme && palette ? (
        <motion.aside
          key="reflect"
          initial={{ x: "110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="fixed top-6 right-6 bottom-6 w-[420px] max-w-[92vw] z-50 flex flex-col rounded-2xl overflow-hidden frosted-dark"
          style={{
            boxShadow: `0 30px 80px -10px rgba(0,0,0,0.55), inset 0 1px 0 ${palette.accent}33`,
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))`,
            }}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
                Reflection on
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: palette.accent }}
                />
                <h2 className="text-lg font-medium text-silver-50 truncate">
                  {theme.label}
                </h2>
              </div>
            </div>
            <button
              onClick={() => setReflectionOpen(false)}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-white/10 text-silver-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Personal reflection (top half) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <section className="flex-1 min-h-0 overflow-y-auto thin-scroll px-5 py-4 border-b border-white/10">
              <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-3">
                My reflection
              </div>
              {theme.personalReflection ? (
                <div className="text-silver-100 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                  {theme.personalReflection}
                </div>
              ) : (
                <div className="text-silver-300/55 font-mono text-[12px] italic">
                  (No reflection written for this theme yet.)
                </div>
              )}
            </section>

            {/* Visitor wall (bottom half) */}
            <section className="flex-1 min-h-0 flex flex-col">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
                  Wall
                </div>
                <div className="text-[10px] font-mono text-silver-300/55 tabular-nums">
                  {reflections.length} {reflections.length === 1 ? "thought" : "thoughts"}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-5 pb-2">
                {loading ? (
                  <div className="text-silver-300/60 text-xs flex items-center gap-2 py-2">
                    <Loader2 size={12} className="animate-spin" /> loading…
                  </div>
                ) : reflections.length === 0 ? (
                  <div className="text-silver-300/50 font-mono text-[12px] italic py-2">
                    No one has written anything yet. Be the first.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {reflections.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg p-3 border border-white/5"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-silver-200/80">
                            {r.name || "Anonymous"}
                          </div>
                          <div className="text-[10px] font-mono text-silver-300/45 shrink-0">
                            {formatDate(r.createdAt)}
                          </div>
                        </div>
                        <p className="text-silver-100 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
                          {r.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={submit} className="px-5 pb-5 pt-2 border-t border-white/10 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-transparent border border-white/10 rounded-md px-3 py-1.5 text-sm font-mono text-silver-100 placeholder:text-silver-300/40 outline-none focus:border-white/30"
                  maxLength={60}
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add to the wall…"
                  rows={3}
                  className="w-full bg-transparent border border-white/10 rounded-md px-3 py-2 text-sm font-mono text-silver-100 placeholder:text-silver-300/40 outline-none focus:border-white/30 resize-none"
                  maxLength={1200}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={posting || !body.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{
                      background: palette.accent,
                      color: "#1c1814",
                    }}
                  >
                    {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Post
                  </button>
                </div>
              </form>
            </section>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

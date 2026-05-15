"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { SiteWallPostRecord } from "@/types";
import type { SiteWallKey } from "@/lib/site-copy";
import { SITE_INTRODUCTION_KEY } from "@/lib/site-copy";

type PaletteSlice = {
  accent: string;
  soft: string;
};

export function SiteModalWall({
  wallKey,
  palette,
}: {
  wallKey: SiteWallKey;
  palette: PaletteSlice;
}) {
  const [posts, setPosts] = useState<SiteWallPostRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(`/api/site-wall?wallKey=${encodeURIComponent(wallKey)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setPosts(j.posts as SiteWallPostRecord[]);
        else setLoadError(j.error ?? "Could not load wall");
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load wall");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wallKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/site-wall", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallKey,
          name: name.trim() || null,
          body: body.trim(),
        }),
      });
      const j = await res.json();
      if (j.ok) {
        setPosts((list) => [j.post as SiteWallPostRecord, ...list]);
        setBody("");
      }
    } finally {
      setPosting(false);
    }
  }

  const subtitle =
    wallKey === SITE_INTRODUCTION_KEY
      ? "Shared with this introduction — separate from theme threads."
      : "Shared with this closing commentary — separate from theme threads.";

  const headingId =
    wallKey === SITE_INTRODUCTION_KEY ? "introduction-wall-heading" : "closing-wall-heading";

  return (
    <section
      className="flex flex-1 min-h-0 flex-col border-t border-white/10"
      aria-labelledby={headingId}
    >
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id={headingId}
              className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 font-normal"
            >
              Wall
            </h3>
            <p className="text-silver-300/65 font-mono text-[11px] leading-snug mt-1">{subtitle}</p>
          </div>
          <div className="text-[10px] font-mono text-silver-300/55 tabular-nums shrink-0 pt-0.5">
            {posts.length} {posts.length === 1 ? "thought" : "thoughts"}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-5 pb-2">
        {loading ? (
          <div className="text-silver-300/60 text-xs flex items-center gap-2 py-2">
            <Loader2 size={12} className="animate-spin" /> loading…
          </div>
        ) : loadError ? (
          <div className="text-red-300/80 font-mono text-[11px] py-2">{loadError}</div>
        ) : posts.length === 0 ? (
          <div className="text-silver-300/50 font-mono text-[12px] italic py-2">
            No one has written anything yet. Be the first.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {posts.map((r) => (
              <li
                key={r.id}
                className="rounded-lg p-3 border border-white/5"
                style={{ background: "rgba(255,255,255,0.03)" }}
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

      <form
        onSubmit={submit}
        className="px-5 pb-5 pt-2 border-t border-white/10 space-y-2 shrink-0 mt-auto"
      >
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

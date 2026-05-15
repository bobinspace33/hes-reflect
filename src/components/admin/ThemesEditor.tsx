"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Save } from "lucide-react";
import { THEME_PALETTE } from "@/lib/colors";
import type { DocumentRecord, ThemeWithSources } from "@/types";

export function ThemesEditor({
  themes,
  documents,
}: {
  themes: ThemeWithSources[];
  documents: DocumentRecord[];
}) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function analyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/admin/themes/analyze", { method: "POST" });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Analyze failed");
      router.refresh();
    } catch (e) {
      setAnalyzeError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  const byDocId = new Map(documents.map((d) => [d.id, d]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-light">Themes & reflections</h2>
          <p className="text-silver-300/60 text-sm font-mono mt-1">
            {themes.length === 0
              ? "No themes yet. Click Analyze to extract themes from your documents."
              : `${themes.length} theme${themes.length === 1 ? "" : "s"} · ${themes.reduce((n, t) => n + t.sources.length, 0)} highlights`}
          </p>
        </div>
        <button
          onClick={analyze}
          disabled={analyzing || documents.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400 text-silver-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-300 transition-colors"
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {themes.length === 0 ? "Analyze themes" : "Re-analyze"}
        </button>
      </div>
      {analyzeError ? (
        <div className="text-red-300/90 font-mono text-sm">{analyzeError}</div>
      ) : null}

      <div className="space-y-4">
        {themes.map((t) => (
          <ThemeRow key={t.id} theme={t} byDocId={byDocId} />
        ))}
      </div>
    </div>
  );
}

function ThemeRow({
  theme,
  byDocId,
}: {
  theme: ThemeWithSources;
  byDocId: Map<string, DocumentRecord>;
}) {
  const [text, setText] = useState(theme.personalReflection);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const palette = THEME_PALETTE[theme.color];

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personalReflection: text }),
      });
      const j = await res.json();
      if (j.ok) setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-silver-700 bg-silver-800/40 overflow-hidden">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: palette.accent }}
          />
          <h3 className="font-medium text-silver-50">{theme.label}</h3>
          <span className="text-[10px] font-mono text-silver-300/55 uppercase tracking-wider">
            {theme.color}
          </span>
        </div>
        <div className="text-[11px] font-mono text-silver-300/60">
          {theme.sources.length} highlight{theme.sources.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-5 border-b md:border-b-0 md:border-r border-silver-700">
          <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-2">
            My reflection
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Write your personal reflection on this theme…"
            className="w-full bg-silver-900 border border-silver-700 rounded-md px-3 py-2 text-sm font-mono text-silver-100 placeholder:text-silver-300/40 outline-none focus:border-gold-400 resize-vertical"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-[10px] font-mono text-silver-300/45">
              {savedAt ? "Saved" : ""}
            </div>
            <button
              onClick={save}
              disabled={saving || text === theme.personalReflection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-silver-700 hover:bg-silver-600 text-silver-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-2">
            Highlighted passages
          </div>
          {theme.sources.length === 0 ? (
            <div className="text-silver-300/55 font-mono text-xs italic">
              No source highlights for this theme.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {theme.sources.map((s) => {
                const doc = byDocId.get(s.documentId);
                return (
                  <li key={s.id} className="text-sm">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-silver-300/55 mb-0.5">
                      {doc?.title || s.documentId} · page {s.pageNumber}
                    </div>
                    <div
                      className="text-silver-100 font-mono text-[12.5px] leading-relaxed px-2 py-1 rounded-sm"
                      style={{ background: palette.soft }}
                    >
                      "{s.quote}"
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

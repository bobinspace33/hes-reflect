"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Save, Trash2 } from "lucide-react";
import { THEME_PALETTE } from "@/lib/colors";
import type { DocumentRecord, ThemeWithSources } from "@/types";
import { SiteIntroductionEditor } from "@/components/admin/SiteIntroductionEditor";
import { SiteClosingCommentaryEditor } from "@/components/admin/SiteClosingCommentaryEditor";
import { SiteBackgroundEditor } from "@/components/admin/SiteBackgroundEditor";

export function ThemesEditor({
  themes,
  documents,
  introductionBody,
  closingCommentaryBody,
  backgroundImageUrl,
}: {
  themes: ThemeWithSources[];
  documents: DocumentRecord[];
  introductionBody: string;
  closingCommentaryBody: string;
  backgroundImageUrl: string;
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
      <SiteBackgroundEditor initialUrl={backgroundImageUrl} />

      <SiteIntroductionEditor initialBody={introductionBody} />

      <SiteClosingCommentaryEditor initialBody={closingCommentaryBody} />

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

      <div className="rounded-xl border border-silver-700 bg-silver-800/30 px-4 py-3 text-silver-300/80 text-xs font-mono leading-relaxed">
        <strong className="text-silver-200">Theme titles</strong> can be edited in each card (same Save as your
        reflection). <strong className="text-silver-200">Manual highlights</strong> are kept when you re-analyze
        (matched by theme name). Analysis-generated highlights are replaced each run.
      </div>

      <div className="space-y-4">
        {themes.map((t) => (
          <ThemeRow key={t.id} theme={t} byDocId={byDocId} documents={documents} />
        ))}
      </div>
    </div>
  );
}

function ThemeRow({
  theme,
  byDocId,
  documents,
}: {
  theme: ThemeWithSources;
  byDocId: Map<string, DocumentRecord>;
  documents: DocumentRecord[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState(theme.label);
  const [text, setText] = useState(theme.personalReflection);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [docId, setDocId] = useState(documents[0]?.id ?? "");
  const [pageStr, setPageStr] = useState("1");
  const [quoteIn, setQuoteIn] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const palette = THEME_PALETTE[theme.color];

  useEffect(() => {
    setLabel(theme.label);
    setText(theme.personalReflection);
  }, [theme.id, theme.label, theme.personalReflection]);

  useEffect(() => {
    if (documents.length > 0 && !documents.some((d) => d.id === docId)) {
      setDocId(documents[0].id);
    }
  }, [documents, docId]);

  const selectedDoc = docId ? byDocId.get(docId) : undefined;
  const parsedPage = Math.max(1, parseInt(pageStr, 10) || 1);
  const pageNum = selectedDoc
    ? Math.min(Math.max(1, parsedPage), selectedDoc.pageCount)
    : 1;

  const labelDirty = label.trim() !== theme.label;
  const reflectionDirty = text !== theme.personalReflection;
  const dirty = labelDirty || reflectionDirty;

  async function save() {
    if (!dirty) return;
    const trimmed = label.trim();
    if (!trimmed) {
      alert("Theme title cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const payload: { personalReflection?: string; label?: string } = {};
      if (reflectionDirty) payload.personalReflection = text;
      if (labelDirty) payload.label = trimmed;
      const res = await fetch(`/api/admin/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !("ok" in j) || !j.ok) {
        alert((j as { error?: string }).error ?? "Save failed");
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoc || !quoteIn.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/theme-sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          themeId: theme.id,
          documentId: docId,
          pageNumber: pageNum,
          quote: quoteIn.trim(),
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to add highlight");
      setQuoteIn("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function removeSource(id: string) {
    if (!confirm("Remove this highlight?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/theme-sources/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Delete failed");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-silver-700 bg-silver-800/40 overflow-hidden">
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))` }}
      >
        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: palette.accent }}
            />
            <span className="text-[10px] font-mono text-silver-300/55 uppercase tracking-wider">
              {theme.color}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-[0.18em] text-silver-300/50 mb-1">
              Theme title
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              className="w-full max-w-md bg-silver-900/90 border border-silver-600/80 rounded-md px-3 py-1.5 text-sm font-medium text-silver-50 outline-none focus:border-gold-400"
            />
          </div>
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
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-silver-700 hover:bg-silver-600 text-silver-50 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-2">
              Highlighted passages
            </div>
            {theme.sources.length === 0 ? (
              <div className="text-silver-300/55 font-mono text-xs italic">
                No source highlights for this theme yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {theme.sources.map((s) => {
                  const doc = byDocId.get(s.documentId);
                  const manual = s.origin === "manual";
                  return (
                    <li key={s.id} className="text-sm group relative">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-silver-300/55">
                          {doc?.title || s.documentId} · page {s.pageNumber}
                          <span
                            className={
                              "ml-2 normal-case tracking-normal " +
                              (manual ? "text-gold-300/90" : "text-silver-500")
                            }
                          >
                            {manual ? "Manual" : "From analysis"}
                          </span>
                        </div>
                        <button
                          type="button"
                          title="Remove highlight"
                          onClick={() => void removeSource(s.id)}
                          disabled={deletingId === s.id}
                          className="shrink-0 p-1 rounded-md text-silver-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                        >
                          {deletingId === s.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
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

          <form onSubmit={addManual} className="border-t border-silver-700 pt-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
              Add manual highlight
            </div>
            <p className="text-[10px] text-silver-400 font-mono leading-relaxed mb-2">
              Paste text exactly as it appears on that PDF page so the reader can match it.
            </p>
            {documents.length === 0 ? (
              <div className="text-silver-500 text-xs">Upload documents first.</div>
            ) : (
              <>
                <select
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="w-full bg-silver-900 border border-silver-700 rounded-md px-3 py-2 text-sm text-silver-100 outline-none focus:border-gold-400"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-silver-400 shrink-0 w-10">Page</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedDoc?.pageCount ?? 1}
                    value={pageStr}
                    onChange={(e) => setPageStr(e.target.value)}
                    className="w-24 bg-silver-900 border border-silver-700 rounded-md px-2 py-1.5 text-sm font-mono text-silver-100 outline-none focus:border-gold-400"
                  />
                  <span className="text-[10px] text-silver-500 font-mono">
                    of {selectedDoc?.pageCount ?? "—"}
                  </span>
                </div>
                <textarea
                  value={quoteIn}
                  onChange={(e) => setQuoteIn(e.target.value)}
                  rows={4}
                  placeholder="Verbatim excerpt from that page…"
                  className="w-full bg-silver-900 border border-silver-700 rounded-md px-3 py-2 text-sm font-mono text-silver-100 placeholder:text-silver-300/40 outline-none focus:border-gold-400 resize-vertical"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={adding || !quoteIn.trim() || !selectedDoc}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-gold-400 text-silver-900 text-sm font-medium hover:bg-gold-300 disabled:opacity-40"
                  >
                    {adding ? <Loader2 size={14} className="animate-spin" /> : null}
                    Add to this theme
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

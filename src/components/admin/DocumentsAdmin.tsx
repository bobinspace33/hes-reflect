"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Upload, Loader2, FileText, ChevronUp, ChevronDown } from "lucide-react";
import type { DocumentRecord } from "@/types";

export function DocumentsAdmin({ documents }: { documents: DocumentRecord[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  async function toggleVisible(d: DocumentRecord) {
    setBusy(d.id);
    try {
      await fetch("/api/admin/documents", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: d.id, visible: !d.visible }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function reorderByIds(orderedIds: string[]) {
    setReorderError(null);
    setReordering(true);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: orderedIds }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !("ok" in j) || !j.ok) {
        throw new Error((j as { error?: string }).error ?? "Reorder failed");
      }
      router.refresh();
    } catch (e) {
      setReorderError((e as Error).message);
    } finally {
      setReordering(false);
    }
  }

  async function moveDocument(fromIndex: number, delta: number) {
    const toIndex = fromIndex + delta;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= documents.length) return;
    const ordered = [...documents];
    const [picked] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, picked);
    await reorderByIds(ordered.map((d) => d.id));
  }

  async function remove(d: DocumentRecord) {
    if (!confirm(`Delete "${d.title}"? This also removes its theme highlights.`)) return;
    setBusy(d.id);
    try {
      await fetch(`/api/admin/documents/${d.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/admin/documents/upload", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Upload failed");
      form.reset();
      router.refresh();
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-light mb-1">Documents</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-silver-300/60 text-sm font-mono">
          <p>
            Reorder appearance on the site (top = first). Toggle visibility, remove, or upload new
            .docx files.
          </p>
          {reordering ? (
            <span className="inline-flex items-center gap-1.5 text-silver-300/55 text-xs">
              <Loader2 size={14} className="animate-spin" />
              Saving order…
            </span>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={onUpload}
        className="rounded-2xl border border-silver-700 bg-silver-800/40 p-5 space-y-3"
      >
        <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">
          Upload new .docx
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="title"
            placeholder="Title (optional, falls back to filename)"
            className="flex-1 min-w-[200px] px-3 py-2 bg-silver-900 border border-silver-700 rounded-md text-sm font-mono outline-none focus:border-gold-400"
          />
          <input
            type="file"
            name="file"
            accept=".docx"
            required
            className="text-sm font-mono file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-silver-700 file:text-silver-50 file:cursor-pointer hover:file:bg-silver-600"
          />
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-gold-400 text-silver-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-300"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload
          </button>
        </div>
        {uploadError ? (
          <div className="text-red-300/90 text-xs font-mono">{uploadError}</div>
        ) : null}
        <p className="text-[11px] text-silver-300/45 font-mono">
          Conversion (.docx → PDF + per-page text extraction) takes ~10s.
          After upload, re-run theme analysis to include the new document.
        </p>
      </form>

      {reorderError ? (
        <div className="text-red-300/90 text-xs font-mono">{reorderError}</div>
      ) : null}

      <ul className="space-y-2">
        {documents.length === 0 ? (
          <li className="text-silver-300/55 font-mono text-sm">
            No documents yet. Upload one above or run <code>npm run ingest && npm run db:seed</code>.
          </li>
        ) : null}
        {documents.map((d, idx) => (
          <li
            key={d.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-silver-700 bg-silver-800/40"
          >
            <FileText size={16} className="text-silver-300/60 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-silver-100 truncate">{d.title}</div>
              <div className="text-[11px] font-mono text-silver-300/55">
                {d.pageCount} page{d.pageCount === 1 ? "" : "s"} · /pdfs · order {d.order}
              </div>
            </div>
            <a
              href={d.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-silver-300 hover:text-gold-300 px-2"
            >
              Preview
            </a>
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveDocument(idx, -1)}
                disabled={reordering || busy !== null || idx <= 0}
                className="p-1 rounded-md hover:bg-silver-700 disabled:opacity-30 disabled:cursor-not-allowed text-silver-300"
                aria-label="Move document up"
                title="Move up"
              >
                <ChevronUp size={18} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => moveDocument(idx, 1)}
                disabled={reordering || busy !== null || idx >= documents.length - 1}
                className="p-1 rounded-md hover:bg-silver-700 disabled:opacity-30 disabled:cursor-not-allowed text-silver-300"
                aria-label="Move document down"
                title="Move down"
              >
                <ChevronDown size={18} strokeWidth={1.75} />
              </button>
            </div>
            <button
              onClick={() => toggleVisible(d)}
              disabled={busy === d.id || reordering}
              className="p-2 rounded-md hover:bg-silver-700 disabled:opacity-40"
              aria-label={d.visible ? "Hide" : "Show"}
              title={d.visible ? "Hide from site" : "Show on site"}
            >
              {d.visible ? <Eye size={16} /> : <EyeOff size={16} className="text-silver-300/50" />}
            </button>
            <button
              onClick={() => remove(d)}
              disabled={busy === d.id || reordering}
              className="p-2 rounded-md hover:bg-red-500/20 text-red-300/80 hover:text-red-200 disabled:opacity-40"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import {
  SITE_BACKGROUND_IMAGE_KEY,
  SITE_BACKGROUND_IMAGE_PROXY_PATH,
} from "@/lib/site-copy";

export function SiteBackgroundEditor({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasCustom = initialUrl.trim().length > 0;

  async function onFile(f: File | null) {
    if (!f) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/admin/background/upload", { method: "POST", body: fd });
      let j: { ok?: boolean; error?: string } = {};
      try {
        j = await res.json();
      } catch {
        throw new Error(`Upload failed (HTTP ${res.status}).`);
      }
      if (!res.ok || !j.ok) {
        throw new Error(j.error || `Upload failed (${res.status}).`);
      }
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function clearBackground() {
    setErr(null);
    setClearing(true);
    try {
      const res = await fetch("/api/admin/site-strings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: SITE_BACKGROUND_IMAGE_KEY, body: "" }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Clear failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-silver-700 bg-silver-800/40 overflow-hidden p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <h3 className="font-medium text-silver-50">Background image</h3>
          <p className="text-silver-300/55 text-xs font-mono mt-1 max-w-xl">
            Stored on Vercel Blob (private store). The site loads it through{" "}
            <code className="text-gold-200/90">{SITE_BACKGROUND_IMAGE_PROXY_PATH}</code>. Clearing
            restores built-in images from <code className="text-gold-200/90">/public/backgrounds</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md bg-silver-700 hover:bg-silver-600 text-silver-50 text-sm disabled:opacity-40">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading || clearing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                void onFile(f ?? null);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void clearBackground()}
            disabled={!hasCustom || clearing || uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-silver-600 text-silver-200 text-sm hover:bg-silver-700/50 disabled:opacity-40"
          >
            {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Use default
          </button>
        </div>
      </div>

      {err ? <div className="text-red-300/90 font-mono text-xs mt-3">{err}</div> : null}

      <div className="mt-4 flex gap-4 items-start">
        <div className="w-40 h-24 rounded-lg border border-silver-700 overflow-hidden bg-silver-900 shrink-0 flex items-center justify-center">
          {hasCustom ? (
            // eslint-disable-next-line @next/next/no-img-element — proxied Blob stream, same-origin
            <img
              key={initialUrl.trim().slice(-24)}
              src={SITE_BACKGROUND_IMAGE_PROXY_PATH}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="text-silver-600" size={28} />
          )}
        </div>
        <p className="text-[10px] font-mono text-silver-400 break-all pt-1">
          {hasCustom ? (
            <>
              Blob object URL (reference only): <span className="text-silver-500">{initialUrl}</span>
            </>
          ) : (
            "No custom image — site uses local fallback order."
          )}
        </p>
      </div>
    </div>
  );
}

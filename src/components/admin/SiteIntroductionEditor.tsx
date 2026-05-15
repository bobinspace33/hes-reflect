"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { SITE_INTRODUCTION_KEY } from "@/lib/site-copy";

export function SiteIntroductionEditor({ initialBody }: { initialBody: string }) {
  const router = useRouter();
  const [text, setText] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setText(initialBody);
  }, [initialBody]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-strings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: SITE_INTRODUCTION_KEY, body: text }),
      });
      const j = await res.json();
      if (j.ok) {
        setSavedAt(Date.now());
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-silver-700 bg-silver-800/40 overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-medium text-silver-50">Introduction</h3>
          <p className="text-silver-300/55 text-xs font-mono mt-1 max-w-xl">
            Shown in the Introduction panel on the public site — same placement as reflection modals,
            editable here without touching code.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || text === initialBody}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-gold-400 text-silver-900 text-sm font-medium hover:bg-gold-300 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save introduction
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Describe the project, how to navigate the reflections, credits…"
        className="w-full bg-silver-900 border border-silver-700 rounded-md px-3 py-2 text-sm font-mono text-silver-100 placeholder:text-silver-300/40 outline-none focus:border-gold-400 resize-vertical"
      />
      <div className="text-[10px] font-mono text-silver-300/45 mt-2">
        {savedAt ? "Published to the homepage (reload the site to see)." : `${text.length.toLocaleString()} characters`}
      </div>
    </div>
  );
}

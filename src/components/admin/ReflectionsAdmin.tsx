"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { THEME_PALETTE } from "@/lib/colors";
import type { ReflectionRecord, ThemeWithSources } from "@/types";

export function ReflectionsAdmin({
  reflections,
  themes,
}: {
  reflections: ReflectionRecord[];
  themes: ThemeWithSources[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const themeMap = useMemo(() => new Map(themes.map((t) => [t.id, t])), [themes]);

  async function remove(r: ReflectionRecord) {
    if (!confirm("Delete this reflection?")) return;
    setBusy(r.id);
    try {
      await fetch(`/api/admin/reflections/${r.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light mb-1">Visitor wall</h2>
        <p className="text-silver-300/60 text-sm font-mono">
          {reflections.length} reflection{reflections.length === 1 ? "" : "s"}, newest first.
        </p>
      </div>

      <ul className="space-y-3">
        {reflections.length === 0 ? (
          <li className="text-silver-300/55 font-mono text-sm">
            No visitor reflections yet.
          </li>
        ) : null}
        {reflections.map((r) => {
          const t = themeMap.get(r.themeId);
          const palette = t ? THEME_PALETTE[t.color] : null;
          return (
            <li
              key={r.id}
              className="rounded-xl border border-silver-700 bg-silver-800/40 overflow-hidden"
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={
                  palette
                    ? { background: `linear-gradient(135deg, ${palette.soft}, rgba(255,255,255,0.02))` }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 text-sm">
                  {palette ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: palette.accent }}
                    />
                  ) : null}
                  <span className="text-silver-50">{t?.label || `(theme ${r.themeId})`}</span>
                  <span className="text-silver-300/55 font-mono text-xs ml-2">
                    · {r.name || "Anonymous"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[11px] font-mono text-silver-300/45">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => remove(r)}
                    disabled={busy === r.id}
                    className="p-1.5 rounded-md text-red-300/80 hover:bg-red-500/20 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 text-silver-100 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                {r.body}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

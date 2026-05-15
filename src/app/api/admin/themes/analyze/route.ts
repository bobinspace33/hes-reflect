import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { isAuthed } from "@/lib/auth";
import { listDocuments, recordAnalysisRun, replaceAllThemes } from "@/lib/repo";
import { extractThemes } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const runId = crypto.randomBytes(8).toString("hex");
  await recordAnalysisRun({ id: runId, status: "running" });
  try {
    const docs = await listDocuments({ onlyVisible: false });
    if (docs.length === 0) {
      throw new Error("No documents to analyze. Run `npm run ingest` first.");
    }
    const { themes } = await extractThemes(docs);

    // Map to records with stable-ish ids (based on label hash so personal_reflection survives where label matches)
    const themeRecs = themes.map((t, i) => ({
      id: crypto.createHash("sha1").update(t.label.toLowerCase()).digest("hex").slice(0, 16),
      label: t.label,
      color: t.color,
      order: i,
      personalReflection: "",
    }));
    const sourceRecs = themes.flatMap((t, i) =>
      t.sources.map((s) => ({
        id: crypto.randomBytes(8).toString("hex"),
        themeId: themeRecs[i].id,
        documentId: s.documentId,
        pageNumber: s.pageNumber,
        quote: s.quote,
        origin: "analysis" as const,
      })),
    );
    await replaceAllThemes(themeRecs, sourceRecs);
    await recordAnalysisRun({ id: runId, status: "complete" });
    return NextResponse.json({ ok: true, themesCount: themeRecs.length, sourcesCount: sourceRecs.length });
  } catch (e) {
    console.error(e);
    await recordAnalysisRun({ id: runId, status: "error", error: (e as Error).message });
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

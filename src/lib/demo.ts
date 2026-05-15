import fs from "node:fs/promises";
import path from "node:path";
import type { DocumentRecord } from "@/types";

/**
 * Load `data/seed-documents.json` (produced by `npm run ingest`) into the
 * DocumentRecord shape so the site can render in "demo" mode when no
 * Postgres connection is available.
 */
export async function loadSeedAsDemoData(): Promise<{
  documents: DocumentRecord[];
} | null> {
  const file = path.join(process.cwd(), "data", "seed-documents.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const arr = JSON.parse(raw) as any[];
    const documents: DocumentRecord[] = arr.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      pdfUrl: d.pdfUrl,
      pageCount: d.pageCount,
      pageTexts: d.pageTexts ?? [],
      order: d.order,
      visible: d.visible,
    }));
    return { documents };
  } catch {
    return null;
  }
}

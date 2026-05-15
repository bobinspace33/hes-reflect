/**
 * Seed the database from data/seed-documents.json produced by `npm run ingest`.
 * Safe to re-run: upserts documents on slug.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "../src/lib/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED = path.resolve(__dirname, "..", "data", "seed-documents.json");

async function main() {
  const raw = await fs.readFile(SEED, "utf8");
  const docs = JSON.parse(raw) as Array<{
    id: string;
    slug: string;
    title: string;
    pdfUrl: string;
    pageCount: number;
    pageTexts: string[];
    order: number;
    visible: boolean;
  }>;

  for (const d of docs) {
    await sql.query(
      `INSERT INTO documents (id, slug, title, pdf_url, page_count, page_texts, "order", visible)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         title       = EXCLUDED.title,
         pdf_url     = EXCLUDED.pdf_url,
         page_count  = EXCLUDED.page_count,
         page_texts  = EXCLUDED.page_texts,
         "order"     = EXCLUDED."order",
         visible     = EXCLUDED.visible`,
      [
        d.id,
        d.slug,
        d.title,
        d.pdfUrl,
        d.pageCount,
        JSON.stringify(d.pageTexts),
        d.order,
        d.visible,
      ],
    );
    console.log(`  upserted: ${d.slug} (${d.pageCount} pages)`);
  }
  console.log(`Seeded ${docs.length} document(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Convert every .docx in /documents into a paginated PDF in /public/pdfs/
 * and produce /data/seed-documents.json with per-page plain text.
 *
 * Run:  npm run ingest
 *
 * Pipeline:  .docx --mammoth--> styled HTML  --puppeteer--> PDF (Letter, 1 inch margins)
 *            then pdf-parse over the rendered PDF for canonical per-page text.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import mammoth from "mammoth";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
// pdf-parse imports a debug harness when imported normally; reach the lib directly.
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  buf: Buffer,
  opts?: any,
) => Promise<{ numpages: number; text: string }>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "documents");
const PDF_OUT_DIR = path.join(ROOT, "public", "pdfs");
const SEED_OUT = path.join(ROOT, "data", "seed-documents.json");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.docx$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function id(): string {
  return crypto.randomBytes(8).toString("hex");
}

// Per-page text from rendered PDF using the form-feed page boundary that pdf.js inserts.
async function extractPerPageText(
  pdfBuf: Buffer,
): Promise<{ pageCount: number; pageTexts: string[] }> {
  let pages: string[] = [];
  let count = 0;
  await pdfParse(pdfBuf, {
    pagerender: async (pageData: any) => {
      const tc = await pageData.getTextContent();
      const text = tc.items.map((it: any) => it.str).join(" ").replace(/\s+/g, " ").trim();
      pages.push(text);
      return text;
    },
  }).then((res) => {
    count = res.numpages;
  });
  // Fallback if pagerender path didn't populate (older API): split on form feed.
  if (pages.length === 0) {
    const parsed = await pdfParse(pdfBuf);
    count = parsed.numpages;
    pages = parsed.text.split(/\f/).map((p) => p.replace(/\s+/g, " ").trim());
  }
  return { pageCount: count || pages.length, pageTexts: pages };
}

const DOC_CSS = /* css */ `
  @page { size: Letter; margin: 0.9in 1in; }
  html, body {
    background: #fdfaf2;
    color: #1a1612;
    font-family: "Georgia", "Cambria", "Times New Roman", serif;
    font-size: 11.5pt;
    line-height: 1.55;
  }
  body { padding: 0; }
  h1, h2, h3, h4 {
    font-family: "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    color: #1a1612;
    margin-top: 1em;
  }
  h1 { font-size: 18pt; font-weight: 700; }
  h2 { font-size: 14pt; font-weight: 600; }
  h3 { font-size: 12pt; font-weight: 600; }
  p { margin: 0 0 0.55em; }
  ul, ol { margin: 0 0 0.7em 1.2em; }
  blockquote {
    border-left: 3px solid rgba(122, 98, 58, 0.4);
    padding-left: 0.9em;
    color: #3b332a;
    margin: 0.7em 0;
    font-style: italic;
  }
  table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
  td, th { border: 1px solid #c8bea7; padding: 4px 8px; vertical-align: top; }
  img { max-width: 100%; height: auto; }
  a { color: #6e5526; text-decoration: underline; }
  code, pre {
    font-family: "Roboto Mono", "Menlo", monospace;
    background: rgba(122, 98, 58, 0.07);
    padding: 1px 3px;
    border-radius: 2px;
    font-size: 10pt;
  }
`;

async function docxToPdf(docxPath: string, outPdf: string, browser: any): Promise<void> {
  const { value: rawHtml } = await mammoth.convertToHtml({ path: docxPath });
  const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${DOC_CSS}</style></head><body>${rawHtml}</body></html>`;
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outPdf,
    format: "Letter",
    margin: { top: "0.9in", right: "1in", bottom: "0.9in", left: "1in" },
    printBackground: true,
  });
  await page.close();
}

async function main() {
  await fs.mkdir(PDF_OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(SEED_OUT), { recursive: true });

  const all = await fs.readdir(DOCS_DIR);
  const docxFiles = all
    .filter((f) => f.toLowerCase().endsWith(".docx") && !f.startsWith("~$"))
    .sort();

  if (docxFiles.length === 0) {
    console.log("No .docx files in", DOCS_DIR);
    return;
  }

  console.log(`Found ${docxFiles.length} .docx file(s). Launching headless browser...`);
  const browser = await puppeteer.launch({ headless: true });

  const records: any[] = [];
  let orderIdx = 0;
  for (const filename of docxFiles) {
    const docxPath = path.join(DOCS_DIR, filename);
    const slug = slugify(filename) || `doc-${orderIdx}`;
    const pdfFilename = `${slug}.pdf`;
    const pdfPath = path.join(PDF_OUT_DIR, pdfFilename);

    process.stdout.write(`  • ${filename}  →  public/pdfs/${pdfFilename}  ... `);
    await docxToPdf(docxPath, pdfPath, browser);

    const pdfBuf = await fs.readFile(pdfPath);
    const { pageCount, pageTexts } = await extractPerPageText(pdfBuf);
    process.stdout.write(`${pageCount} page(s)\n`);

    records.push({
      id: id(),
      slug,
      title: filename
        .replace(/\.docx$/i, "")
        .replace(/_/g, " ")
        .replace(/\s+:\s+/g, ": "),
      pdfUrl: `/pdfs/${pdfFilename}`,
      pageCount,
      pageTexts,
      order: orderIdx++,
      visible: true,
    });
  }

  await browser.close();
  await fs.writeFile(SEED_OUT, JSON.stringify(records, null, 2));
  console.log(`\nSeed written to data/seed-documents.json (${records.length} docs).`);
  console.log("Next: run `npm run db:seed` after configuring POSTGRES_URL.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Upload a .docx file via the admin panel. Converts to PDF (Puppeteer on Vercel
 * via @sparticuz/chromium), stores PDF in Vercel Blob, extracts per-page text,
 * and inserts a documents row.
 */

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { isAuthed } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { upsertDocument } from "@/lib/repo";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const dynamic = "force-dynamic";
export const maxDuration = 180;

const DOC_CSS = `
  @page { size: Letter; margin: 0.9in 1in; }
  html, body { background: #fdfaf2; color: #1a1612; font-family: "Georgia", serif; font-size: 11.5pt; line-height: 1.55; }
  h1, h2, h3 { font-family: "Helvetica Neue", Arial, sans-serif; color: #1a1612; }
  p { margin: 0 0 0.55em; }
  ul, ol { margin: 0 0 0.7em 1.2em; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #c8bea7; padding: 4px 8px; }
  blockquote { border-left: 3px solid rgba(122, 98, 58, 0.4); padding-left: 0.9em; font-style: italic; }
`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.docx$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function makeBrowser() {
  // Prefer @sparticuz/chromium when running on Vercel/AWS lambda.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.default.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  // Local dev: use full puppeteer with bundled Chromium
  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({ headless: true });
}

async function extractPerPageText(
  buf: Buffer,
): Promise<{ pageCount: number; pageTexts: string[] }> {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    b: Buffer,
    opts?: any,
  ) => Promise<{ numpages: number; text: string }>;
  let pages: string[] = [];
  let count = 0;
  await pdfParse(buf, {
    pagerender: async (pageData: any) => {
      const tc = await pageData.getTextContent();
      const text = tc.items.map((it: any) => it.str).join(" ").replace(/\s+/g, " ").trim();
      pages.push(text);
      return text;
    },
  }).then((r) => {
    count = r.numpages;
  });
  if (pages.length === 0) {
    const parsed = await pdfParse(buf);
    count = parsed.numpages;
    pages = parsed.text.split(/\f/).map((p) => p.replace(/\s+/g, " ").trim());
  }
  return { pageCount: count || pages.length, pageTexts: pages };
}

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const form = await req.formData();
  const file = form.get("file");
  const title = (form.get("title") as string | null)?.trim();
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json(
      { ok: false, error: "Only .docx files are supported" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mammoth = (await import("mammoth")).default;
  const { value: rawHtml } = await mammoth.convertToHtml({ buffer: buf });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${DOC_CSS}</style></head><body>${rawHtml}</body></html>`;

  let browser: any;
  let pdfBuf: Buffer;
  try {
    browser = await makeBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    pdfBuf = (await page.pdf({
      format: "Letter",
      margin: { top: "0.9in", right: "1in", bottom: "0.9in", left: "1in" },
      printBackground: true,
    })) as Buffer;
    await page.close();
  } finally {
    if (browser) await browser.close();
  }

  const { pageCount, pageTexts } = await extractPerPageText(pdfBuf);

  const slug =
    slugify(title || file.name) || `doc-${crypto.randomBytes(3).toString("hex")}`;

  // Upload PDF to Vercel Blob (public)
  // Append a short random suffix to avoid collisions; @vercel/blob refuses
  // to overwrite by default.
  const blob = await put(
    `pdfs/${slug}-${crypto.randomBytes(3).toString("hex")}.pdf`,
    pdfBuf,
    {
      access: "public",
      contentType: "application/pdf",
    },
  );

  // Determine next order
  const { rows } = await sql.query(`SELECT COALESCE(MAX("order"), -1) + 1 AS next FROM documents`);
  const order = Number(rows[0]?.next ?? 0);

  const id = crypto.randomBytes(8).toString("hex");
  await upsertDocument({
    id,
    slug,
    title: title || file.name.replace(/\.docx$/i, "").replace(/_/g, " "),
    pdfUrl: blob.url,
    pageCount,
    pageTexts,
    order,
    visible: true,
  });

  return NextResponse.json({ ok: true, id, slug, pdfUrl: blob.url, pageCount });
}

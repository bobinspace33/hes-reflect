import OpenAI from "openai";
import { z } from "zod";
import type { DocumentRecord, HighlightHit, ThemeColor } from "@/types";
import { THEME_COLOR_ORDER } from "@/lib/colors";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.2";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const themeAnalysisSchema = z.object({
  themes: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        sources: z
          .array(
            z.object({
              documentId: z.string(),
              pageNumber: z.number().int().min(1),
              quote: z.string().min(3),
            }),
          )
          .max(40),
      }),
    )
    .min(3)
    .max(6),
});

const searchSchema = z.object({
  hits: z
    .array(
      z.object({
        documentId: z.string(),
        pageNumber: z.number().int().min(1),
        quote: z.string().min(3),
      }),
    )
    .max(40),
});

type DocsForLlm = Array<{
  id: string;
  title: string;
  /** [{ page: 1, text: "..." }, ...] */
  pages: Array<{ page: number; text: string }>;
}>;

function packDocs(docs: DocumentRecord[]): DocsForLlm {
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    pages: d.pageTexts.map((t, i) => ({ page: i + 1, text: truncate(t, 6000) })),
  }));
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

/** Keep up to `max` sources per document (order preserved). */
function capSourcesPerDocument(
  sources: Array<{ documentId: string; pageNumber: number; quote: string }>,
  maxPerDocument: number,
): Array<{ documentId: string; pageNumber: number; quote: string }> {
  const countByDoc = new Map<string, number>();
  const out: typeof sources = [];
  for (const s of sources) {
    const n = countByDoc.get(s.documentId) ?? 0;
    if (n >= maxPerDocument) continue;
    countByDoc.set(s.documentId, n + 1);
    out.push(s);
  }
  return out;
}

async function callJSON(prompt: string, schemaName: string): Promise<any> {
  const resp = await client().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You analyze a collection of personal academic/design documents and return strict JSON. Quotes you return MUST be verbatim substrings of the provided document text — copy whitespace/punctuation as-is so they can be found by exact substring search. Quotes should be 6–30 words long.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  const content = resp.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(
      `LLM returned non-JSON for ${schemaName}: ${content.slice(0, 200)}`,
    );
  }
}

export async function extractThemes(
  docs: DocumentRecord[],
): Promise<{
  themes: Array<{
    label: string;
    color: ThemeColor;
    sources: Array<{ documentId: string; pageNumber: number; quote: string }>;
  }>;
}> {
  const packed = packDocs(docs);
  const prompt = [
    "Below is a collection of documents. Each document has an id, a title, and a list of pages.",
    "",
    "Your job:",
    "1. Identify 4–5 cross-cutting THEMES that unify the collection. Each theme label must be a short phrase of 1–4 words (sentence case, no period).",
    "2. For each theme, find the documents that exemplify it (up to 3 quoted passages PER document, max; use fewer or none if the fit is weak).",
    "3. Each quote MUST be a verbatim substring of the page text provided (so substring search will find it). Quotes should be 6–30 words long. Prefer specific, concrete sentences over generic statements.",
    "4. Skip a document for a theme if it doesn't really fit. Not every theme needs every document.",
    "",
    "Return JSON of the shape:",
    '{ "themes": [ { "label": "<1-4 words>", "sources": [ { "documentId": "<id>", "pageNumber": <int>, "quote": "<verbatim substring>" } ] } ] }',
    "",
    "Documents:",
    JSON.stringify(packed),
  ].join("\n");

  const raw = await callJSON(prompt, "themeAnalysis");
  const parsed = themeAnalysisSchema.parse(raw);

  // Verify quotes are substrings; drop those that aren't.
  const docById = new Map(docs.map((d) => [d.id, d]));
  const cleaned = parsed.themes.map((t, i) => ({
    label: t.label.trim(),
    color: THEME_COLOR_ORDER[i % THEME_COLOR_ORDER.length],
    sources: capSourcesPerDocument(
      t.sources.filter((s) => {
        const d = docById.get(s.documentId);
        if (!d) return false;
        const pageText = d.pageTexts[s.pageNumber - 1] || "";
        return pageText.toLowerCase().includes(s.quote.toLowerCase());
      }),
      3,
    ),
  }));

  return { themes: cleaned };
}

export async function searchPassages(
  query: string,
  docs: DocumentRecord[],
): Promise<HighlightHit[]> {
  const packed = packDocs(docs);
  const prompt = [
    `User query: "${query}"`,
    "",
    "Find passages across the documents that match the meaning OR letter of this query. Return 0–3 highlights per document (only if a strong match exists).",
    "",
    "Each quote MUST be a verbatim substring of the page text shown below. Quotes should be 5–25 words long.",
    "",
    'Return JSON of the shape: { "hits": [ { "documentId": "<id>", "pageNumber": <int>, "quote": "<verbatim substring>" } ] }',
    "",
    "Documents:",
    JSON.stringify(packed),
  ].join("\n");

  const raw = await callJSON(prompt, "search");
  const parsed = searchSchema.parse(raw);

  const docById = new Map(docs.map((d) => [d.id, d]));
  return parsed.hits.filter((h) => {
    const d = docById.get(h.documentId);
    if (!d) return false;
    const pageText = d.pageTexts[h.pageNumber - 1] || "";
    return pageText.toLowerCase().includes(h.quote.toLowerCase());
  });
}

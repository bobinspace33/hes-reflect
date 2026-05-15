import { sql, ensureSchema } from "@/lib/db";
import type {
  DocumentRecord,
  ReflectionRecord,
  ThemeRecord,
  ThemeSource,
  ThemeWithSources,
} from "@/types";

function mapDoc(row: any): DocumentRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pdfUrl: row.pdf_url,
    pageCount: row.page_count,
    pageTexts: row.page_texts ?? [],
    order: row.order,
    visible: row.visible,
  };
}

function mapTheme(row: any): ThemeRecord {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    order: row.order,
    personalReflection: row.personal_reflection ?? "",
  };
}

function mapSource(row: any): ThemeSource {
  return {
    id: row.id,
    themeId: row.theme_id,
    documentId: row.document_id,
    pageNumber: row.page_number,
    quote: row.quote,
  };
}

function mapReflection(row: any): ReflectionRecord {
  return {
    id: row.id,
    themeId: row.theme_id,
    name: row.name,
    body: row.body,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

async function repoReady(): Promise<void> {
  await ensureSchema();
}

export async function listDocuments(
  opts: { onlyVisible?: boolean } = {},
): Promise<DocumentRecord[]> {
  await repoReady();
  const { onlyVisible = true } = opts;
  const { rows } = onlyVisible
    ? await sql`SELECT * FROM documents WHERE visible = TRUE ORDER BY "order" ASC, created_at ASC`
    : await sql`SELECT * FROM documents ORDER BY "order" ASC, created_at ASC`;
  return rows.map(mapDoc);
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  await repoReady();
  const { rows } = await sql`SELECT * FROM documents WHERE id = ${id} LIMIT 1`;
  return rows[0] ? mapDoc(rows[0]) : null;
}

export async function listThemes(): Promise<ThemeRecord[]> {
  await repoReady();
  const { rows } = await sql`SELECT * FROM themes ORDER BY "order" ASC`;
  return rows.map(mapTheme);
}

export async function listThemesWithSources(): Promise<ThemeWithSources[]> {
  await repoReady();
  const themes = await listThemes();
  const ids = themes.map((t) => t.id);
  if (ids.length === 0) return themes.map((t) => ({ ...t, sources: [] }));
  // Use $1::text[] expansion via vercel/postgres tagged template with ANY
  const { rows } = await sql.query(
    `SELECT * FROM theme_sources WHERE theme_id = ANY($1::text[]) ORDER BY created_at ASC`,
    [ids],
  );
  const sources = rows.map(mapSource);
  return themes.map((t) => ({
    ...t,
    sources: sources.filter((s) => s.themeId === t.id),
  }));
}

export async function listReflections(themeId: string): Promise<ReflectionRecord[]> {
  await repoReady();
  const { rows } =
    await sql`SELECT * FROM reflections WHERE theme_id = ${themeId} ORDER BY created_at DESC LIMIT 200`;
  return rows.map(mapReflection);
}

export async function createReflection(input: {
  id: string;
  themeId: string;
  name: string | null;
  body: string;
}): Promise<ReflectionRecord> {
  await repoReady();
  const { rows } = await sql`
    INSERT INTO reflections (id, theme_id, name, body)
    VALUES (${input.id}, ${input.themeId}, ${input.name}, ${input.body})
    RETURNING *`;
  return mapReflection(rows[0]);
}

export async function deleteReflection(id: string): Promise<void> {
  await repoReady();
  await sql`DELETE FROM reflections WHERE id = ${id}`;
}

export async function upsertTheme(t: ThemeRecord): Promise<void> {
  await repoReady();
  await sql`
    INSERT INTO themes (id, label, color, "order", personal_reflection, updated_at)
    VALUES (${t.id}, ${t.label}, ${t.color}, ${t.order}, ${t.personalReflection}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      label = EXCLUDED.label,
      color = EXCLUDED.color,
      "order" = EXCLUDED."order",
      personal_reflection = EXCLUDED.personal_reflection,
      updated_at = NOW()`;
}

export async function updateThemeReflection(
  id: string,
  personalReflection: string,
): Promise<void> {
  await repoReady();
  await sql`UPDATE themes SET personal_reflection = ${personalReflection}, updated_at = NOW() WHERE id = ${id}`;
}

export async function replaceAllThemes(
  themes: ThemeRecord[],
  sources: ThemeSource[],
): Promise<void> {
  await repoReady();
  await sql.query("BEGIN");
  try {
    await sql.query("DELETE FROM theme_sources");
    // Preserve personal_reflection by matching on label (themes are regenerated each run)
    const { rows: oldThemes } = await sql.query(
      `SELECT id, label, personal_reflection FROM themes`,
    );
    const oldByLabel = new Map(
      oldThemes.map((r: any) => [normalizeLabel(r.label), r.personal_reflection as string]),
    );
    await sql.query("DELETE FROM themes");
    for (const t of themes) {
      const preserved = oldByLabel.get(normalizeLabel(t.label)) ?? t.personalReflection;
      await sql.query(
        `INSERT INTO themes (id, label, color, "order", personal_reflection, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [t.id, t.label, t.color, t.order, preserved],
      );
    }
    for (const s of sources) {
      await sql.query(
        `INSERT INTO theme_sources (id, theme_id, document_id, page_number, quote)
         VALUES ($1, $2, $3, $4, $5)`,
        [s.id, s.themeId, s.documentId, s.pageNumber, s.quote],
      );
    }
    await sql.query("COMMIT");
  } catch (e) {
    await sql.query("ROLLBACK");
    throw e;
  }
}

function normalizeLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function recordAnalysisRun(input: {
  id: string;
  status: "running" | "complete" | "error";
  error?: string;
}): Promise<void> {
  await repoReady();
  if (input.status === "running") {
    await sql`INSERT INTO analysis_runs (id, status) VALUES (${input.id}, 'running')`;
  } else {
    await sql`UPDATE analysis_runs SET finished_at = NOW(), status = ${input.status}, error = ${input.error ?? null} WHERE id = ${input.id}`;
  }
}

export async function upsertDocument(d: DocumentRecord): Promise<void> {
  await repoReady();
  await sql.query(
    `INSERT INTO documents (id, slug, title, pdf_url, page_count, page_texts, "order", visible)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       pdf_url = EXCLUDED.pdf_url,
       page_count = EXCLUDED.page_count,
       page_texts = EXCLUDED.page_texts,
       "order" = EXCLUDED."order",
       visible = EXCLUDED.visible`,
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
}

export async function deleteDocument(id: string): Promise<void> {
  await repoReady();
  await sql`DELETE FROM documents WHERE id = ${id}`;
}

export async function reorderDocuments(orderedIds: string[]): Promise<void> {
  await repoReady();
  await sql.query("BEGIN");
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await sql.query(`UPDATE documents SET "order" = $1 WHERE id = $2`, [i, orderedIds[i]]);
    }
    await sql.query("COMMIT");
  } catch (e) {
    await sql.query("ROLLBACK");
    throw e;
  }
}

export async function setDocumentVisibility(id: string, visible: boolean): Promise<void> {
  await repoReady();
  await sql`UPDATE documents SET visible = ${visible} WHERE id = ${id}`;
}

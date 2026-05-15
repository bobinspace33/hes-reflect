import { isAuthed } from "@/lib/auth";
import { listThemesWithSources } from "@/lib/repo";
import { sql } from "@/lib/db";
import { LoginForm } from "@/components/admin/LoginForm";
import { ReflectionsAdmin } from "@/components/admin/ReflectionsAdmin";
import type { ReflectionRecord } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminReflections() {
  if (!(await isAuthed())) return <LoginForm />;

  const themes = await listThemesWithSources();
  const { rows } = await sql`SELECT * FROM reflections ORDER BY created_at DESC LIMIT 500`;
  const reflections: ReflectionRecord[] = rows.map((r) => ({
    id: r.id,
    themeId: r.theme_id,
    name: r.name,
    body: r.body,
    createdAt:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));

  return <ReflectionsAdmin reflections={reflections} themes={themes} />;
}

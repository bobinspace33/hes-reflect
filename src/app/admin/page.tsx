import { isAuthed } from "@/lib/auth";
import { listThemesWithSources, listDocuments } from "@/lib/repo";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemesEditor } from "@/components/admin/ThemesEditor";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAuthed())) {
    return <LoginForm />;
  }
  const [themes, documents] = await Promise.all([
    listThemesWithSources(),
    listDocuments({ onlyVisible: false }),
  ]);
  return <ThemesEditor themes={themes} documents={documents} />;
}

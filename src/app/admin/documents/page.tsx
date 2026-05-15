import { isAuthed } from "@/lib/auth";
import { listDocuments } from "@/lib/repo";
import { LoginForm } from "@/components/admin/LoginForm";
import { DocumentsAdmin } from "@/components/admin/DocumentsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminDocuments() {
  if (!(await isAuthed())) return <LoginForm />;
  const documents = await listDocuments({ onlyVisible: false });
  return <DocumentsAdmin documents={documents} />;
}

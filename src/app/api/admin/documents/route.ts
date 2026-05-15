import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthed } from "@/lib/auth";
import { listDocuments, reorderDocuments, setDocumentVisibility } from "@/lib/repo";

const ReorderSchema = z.object({ order: z.array(z.string()) });
const VisibilitySchema = z.object({
  id: z.string(),
  visible: z.boolean(),
});

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const docs = await listDocuments({ onlyVisible: false });
  return NextResponse.json({ ok: true, documents: docs });
}

export async function PATCH(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  if (json && Array.isArray(json.order)) {
    const { order } = ReorderSchema.parse(json);
    await reorderDocuments(order);
    return NextResponse.json({ ok: true });
  }
  if (json && typeof json.visible === "boolean") {
    const { id, visible } = VisibilitySchema.parse(json);
    await setDocumentVisibility(id, visible);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Unsupported payload" }, { status: 400 });
}

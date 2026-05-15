import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { deleteDocument } from "@/lib/repo";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteDocument(id);
  return NextResponse.json({ ok: true });
}

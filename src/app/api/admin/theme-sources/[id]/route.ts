import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { deleteThemeSource } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await deleteThemeSource(id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Highlight not found" }, { status: 404 });
  }
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

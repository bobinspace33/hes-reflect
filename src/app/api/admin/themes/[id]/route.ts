import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthed } from "@/lib/auth";
import { deleteTheme, updateThemeLabel, updateThemeReflection } from "@/lib/repo";

const PatchSchema = z
  .object({
    personalReflection: z.string().max(20000).optional(),
    label: z.string().min(1).max(120).optional(),
  })
  .strict()
  .refine((b) => b.personalReflection !== undefined || b.label !== undefined, {
    message: "Provide personalReflection and/or label",
  });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = PatchSchema.parse(await req.json());
    if (body.personalReflection !== undefined) {
      await updateThemeReflection(id, body.personalReflection);
    }
    if (body.label !== undefined) {
      await updateThemeLabel(id, body.label.trim());
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const removed = await deleteTheme(id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Theme not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

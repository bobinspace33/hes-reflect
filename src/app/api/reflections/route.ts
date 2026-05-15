import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { createReflection, listReflections } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const themeId = url.searchParams.get("themeId");
  if (!themeId) {
    return NextResponse.json(
      { ok: false, error: "themeId is required" },
      { status: 400 },
    );
  }
  try {
    const reflections = await listReflections(themeId);
    return NextResponse.json({ ok: true, reflections });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, reflections: [] },
      { status: 500 },
    );
  }
}

const PostSchema = z.object({
  themeId: z.string().min(1),
  name: z.string().max(60).nullable().optional(),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = PostSchema.parse(raw);
    const reflection = await createReflection({
      id: crypto.randomBytes(8).toString("hex"),
      themeId: parsed.themeId,
      name: (parsed.name ?? "")?.trim() ? parsed.name!.trim() : null,
      body: parsed.body.trim(),
    });
    return NextResponse.json({ ok: true, reflection });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { createSiteWallPost, listSiteWallPosts } from "@/lib/repo";
import { isSiteWallKey } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const wallKey = new URL(req.url).searchParams.get("wallKey");
  if (!wallKey || !isSiteWallKey(wallKey)) {
    return NextResponse.json(
      { ok: false, error: "wallKey must be introduction or closing_commentary", posts: [] },
      { status: 400 },
    );
  }
  try {
    const posts = await listSiteWallPosts(wallKey);
    return NextResponse.json({ ok: true, posts });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, posts: [] },
      { status: 500 },
    );
  }
}

const PostSchema = z.object({
  wallKey: z.string().min(1),
  name: z.string().max(60).nullable().optional(),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = PostSchema.parse(raw);
    if (!isSiteWallKey(parsed.wallKey)) {
      return NextResponse.json(
        { ok: false, error: "wallKey must be introduction or closing_commentary" },
        { status: 400 },
      );
    }
    const post = await createSiteWallPost({
      id: crypto.randomBytes(8).toString("hex"),
      wallKey: parsed.wallKey,
      name: (parsed.name ?? "")?.trim() ? parsed.name!.trim() : null,
      body: parsed.body.trim(),
    });
    return NextResponse.json({ ok: true, post });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

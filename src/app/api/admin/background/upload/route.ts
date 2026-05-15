import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { isAuthed } from "@/lib/auth";
import { setSiteString } from "@/lib/repo";
import { SITE_BACKGROUND_IMAGE_KEY } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 12 * 1024 * 1024;

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  const p = mime.split("/")[1];
  return p === "jpeg" ? "jpg" : p || "bin";
}

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Use JPG, PNG, WebP, or GIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Image must be 12MB or smaller." },
      { status: 400 },
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const blob = await put(
    `backgrounds/site-${crypto.randomBytes(8).toString("hex")}.${extForMime(file.type)}`,
    buf,
    {
      access: "public",
      contentType: file.type,
    },
  );
  await setSiteString(SITE_BACKGROUND_IMAGE_KEY, blob.url);
  revalidatePath("/");
  return NextResponse.json({ ok: true, url: blob.url });
}

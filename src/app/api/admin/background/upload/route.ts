import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { isAuthed } from "@/lib/auth";
import { setSiteString } from "@/lib/repo";
import { SITE_BACKGROUND_IMAGE_KEY } from "@/lib/site-copy";

export const dynamic = "force-dynamic";
/** Large images can exceed default server body limits unless raised in next.config — keep route reliable. */
export const maxDuration = 60;

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

/** Safari / older browsers sometimes omit `type`; infer from extension. */
function resolveImageMime(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return null;
}

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BLOB_READ_WRITE_TOKEN is missing. Add it to .env.local (see README) or connect Vercel Blob on your project so uploads can reach storage.",
      },
      { status: 503 },
    );
  }

  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image must be 12MB or smaller." },
        { status: 400 },
      );
    }

    const mime = resolveImageMime(file);
    if (!mime) {
      return NextResponse.json(
        { ok: false, error: "Use a JPG, PNG, WebP, or GIF image." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const pathname = `backgrounds/site-${crypto.randomBytes(8).toString("hex")}.${extForMime(mime)}`;

    const blob = await put(pathname, buf, {
      access: "private",
      contentType: mime,
      token: blobToken,
    });

    await setSiteString(SITE_BACKGROUND_IMAGE_KEY, blob.url);
    revalidatePath("/");
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (e) {
    console.error("[api/admin/background/upload]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error:
          msg ||
          "Upload failed. Check that BLOB_READ_WRITE_TOKEN is valid and Postgres can save the site_background key.",
      },
      { status: 500 },
    );
  }
}

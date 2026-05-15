import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSiteString } from "@/lib/repo";
import { SITE_BACKGROUND_IMAGE_KEY } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

function stripQuotes(s: string): string {
  let u = s.trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }
  return u;
}

/**
 * Streams the homepage background image. Private Blob URLs are read with the server token via
 * the Blob SDK (`get`). Public URLs remain supported for older stored values.
 */
export async function GET(request: NextRequest) {
  const raw = stripQuotes(await getSiteString(SITE_BACKGROUND_IMAGE_KEY));
  if (!raw.startsWith("http")) {
    return new NextResponse(null, { status: 404 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const isPrivate = raw.includes(".private.blob.vercel-storage.com");

  if (isPrivate && !token) {
    return NextResponse.json(
      { ok: false, error: "BLOB_READ_WRITE_TOKEN is not configured" },
      { status: 503 },
    );
  }

  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;

  const tryAccess = async (access: "public" | "private"): Promise<Awaited<ReturnType<typeof get>>> =>
    get(raw, {
      access,
      token: token ?? undefined,
      ifNoneMatch,
    });

  let result = isPrivate ? await tryAccess("private") : await tryAccess("public");

  // Legacy rows: stored public URL against a bucket that later moved private, etc.
  if (!result && !isPrivate) {
    result = await tryAccess("private");
  }
  if (!result && isPrivate) {
    result = await tryAccess("public");
  }

  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthed } from "@/lib/auth";
import { getDocument, getTheme, insertManualThemeSource } from "@/lib/repo";

export const dynamic = "force-dynamic";

const Schema = z.object({
  themeId: z.string().min(1),
  documentId: z.string().min(1),
  pageNumber: z.coerce.number().int().min(1),
  quote: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const parsed = Schema.parse(await req.json());
    const theme = await getTheme(parsed.themeId);
    if (!theme) {
      return NextResponse.json({ ok: false, error: "Theme not found" }, { status: 404 });
    }
    const doc = await getDocument(parsed.documentId);
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
    }
    if (parsed.pageNumber > doc.pageCount) {
      return NextResponse.json(
        { ok: false, error: `Page must be between 1 and ${doc.pageCount}` },
        { status: 400 },
      );
    }
    const source = await insertManualThemeSource({
      themeId: parsed.themeId,
      documentId: parsed.documentId,
      pageNumber: parsed.pageNumber,
      quote: parsed.quote,
    });
    revalidatePath("/");
    return NextResponse.json({ ok: true, source });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 },
    );
  }
}

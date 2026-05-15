import { NextResponse } from "next/server";
import { listThemesWithSources } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const themes = await listThemesWithSources();
    return NextResponse.json({ ok: true, themes });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message, themes: [] },
      { status: 500 },
    );
  }
}

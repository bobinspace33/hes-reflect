import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const documents = await listDocuments({ onlyVisible: true });
    return NextResponse.json({ ok: true, documents });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message, documents: [] },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { listDocuments } from "@/lib/repo";
import { searchPassages } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.object({ query: z.string().min(1).max(200) });

export async function POST(req: Request) {
  try {
    const { query } = Schema.parse(await req.json());
    const docs = await listDocuments({ onlyVisible: true });
    const hits = await searchPassages(query, docs);
    return NextResponse.json({ ok: true, hits });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message, hits: [] },
      { status: 400 },
    );
  }
}

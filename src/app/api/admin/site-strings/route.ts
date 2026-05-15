import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthed } from "@/lib/auth";
import { setSiteString } from "@/lib/repo";
import {
  SITE_INTRODUCTION_KEY,
  SITE_CLOSING_COMMENTARY_KEY,
  SITE_BACKGROUND_IMAGE_KEY,
} from "@/lib/site-copy";

const Schema = z.discriminatedUnion("key", [
  z.object({
    key: z.literal(SITE_INTRODUCTION_KEY),
    body: z.string().max(50000),
  }),
  z.object({
    key: z.literal(SITE_CLOSING_COMMENTARY_KEY),
    body: z.string().max(50000),
  }),
  z.object({
    key: z.literal(SITE_BACKGROUND_IMAGE_KEY),
    body: z.string().max(4000),
  }),
]);

export async function PATCH(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { key, body } = Schema.parse(await req.json());
    await setSiteString(key, body);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 },
    );
  }
}

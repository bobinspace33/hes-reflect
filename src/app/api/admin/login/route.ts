import { NextResponse } from "next/server";
import { z } from "zod";
import { login, logout } from "@/lib/auth";

const Schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { password } = Schema.parse(await req.json());
    const ok = await login(password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ ok: true });
}

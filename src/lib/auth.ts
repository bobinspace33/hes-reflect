import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "hes_admin";

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "dev-only-secret-please-set-ADMIN_SESSION_SECRET"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function token(): string {
  const payload = `ok:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function verify(t: string | undefined): boolean {
  if (!t) return false;
  const [payload, sig] = t.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  // timing safe equal
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function login(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  if (password !== expected) return false;
  const c = await cookies();
  c.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  return verify(c.get(COOKIE)?.value);
}

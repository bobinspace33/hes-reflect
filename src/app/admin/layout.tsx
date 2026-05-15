import { ReactNode } from "react";
import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authed = await isAuthed();
  return (
    <main className="min-h-screen bg-silver-900 text-silver-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-10">
          <Link href="/admin" className="text-silver-100 hover:text-gold-300 transition-colors">
            <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70">Admin</div>
            <div className="text-xl font-light tracking-[0.16em] uppercase">
              HES <span className="text-gold-300">Reflection</span>
            </div>
          </Link>
          {authed ? (
            <nav className="flex gap-5 items-center text-sm">
              <Link href="/admin" className="hover:text-gold-300">Themes</Link>
              <Link href="/admin/documents" className="hover:text-gold-300">Documents</Link>
              <Link href="/admin/reflections" className="hover:text-gold-300">Wall</Link>
              <Link href="/" className="hover:text-gold-300">View site →</Link>
              <LogoutButton />
            </nav>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Login failed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <form
        onSubmit={submit}
        className="bg-silver-800/50 border border-silver-700 rounded-2xl p-6 space-y-4"
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-1">
            Admin
          </div>
          <h1 className="text-xl font-light">Sign in</h1>
        </div>
        <input
          type="password"
          autoFocus
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-silver-900 border border-silver-700 rounded-md outline-none focus:border-gold-400 text-silver-50 font-mono"
        />
        {error ? (
          <div className="text-red-300/90 text-xs font-mono">{error}</div>
        ) : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full py-2 rounded-md bg-gold-400 text-silver-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-300 transition-colors"
        >
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

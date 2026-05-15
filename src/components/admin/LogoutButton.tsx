"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        router.push("/admin");
        router.refresh();
      }}
      className="opacity-70 hover:opacity-100 hover:text-gold-300"
    >
      Log out
    </button>
  );
}

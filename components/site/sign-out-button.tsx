"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      className="rounded-md border border-white/25 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={signOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}

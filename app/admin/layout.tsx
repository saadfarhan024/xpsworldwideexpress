import type { ReactNode } from "react";
import { SignOutButton } from "@/components/site/sign-out-button";
import { requireAdminPortal } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPortal();
  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <header className="bg-[#16171a] text-white">
        <div className="mx-auto flex min-h-20 max-w-300 items-center justify-between gap-5 px-5">
          <a className="text-[15px] font-bold tracking-[0.08em]" href="/admin">XPS ADMIN</a>
          <div className="flex items-center gap-4">
            {user.role === "ADMIN" && (
              <a className="hidden text-[12px] font-semibold text-white/80 hover:text-white sm:block" href="/admin/shipments">Shipments</a>
            )}
            <a className="hidden text-[12px] font-semibold text-white/80 hover:text-white sm:block" href="/admin/merchants">Merchants</a>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

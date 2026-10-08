import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SignOutButton } from "@/components/site/sign-out-button";
import { requireMerchant } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireMerchant();
  const companyName = user.merchantProfile?.companyName ?? user.email;

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <header className="bg-[#163e6a] text-white">
        <div className="mx-auto flex min-h-20 max-w-300 items-center justify-between gap-5 px-5">
          <Link className="text-[15px] font-bold tracking-[0.08em]" href="/account">XPS BUSINESS PORTAL</Link>
          <div className="flex items-center gap-4">
            <Link className="hidden text-[12px] font-semibold text-white/80 hover:text-white sm:block" href="/account/shipments">Shipments</Link>
            <Link className="hidden text-[12px] font-semibold text-white/80 hover:text-white sm:block" href="/account/profile">Profile</Link>
            <span className="hidden text-right text-[12px] text-white/75 sm:block">{companyName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
      <SiteFooter />
    </main>
  );
}

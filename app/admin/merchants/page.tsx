import type { Metadata } from "next";
import { AdminMerchantBank } from "@/components/site/admin-merchant-bank";
import { requireAdminPortal } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Merchants | Go Delivery Admin",
  description: "Review merchant accounts and manage bank details.",
};

export default async function AdminMerchantsPage() {
  await requireAdminPortal();

  return (
    <section className="mx-auto max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Finance access</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Merchants</h1>
      <p className="mb-0 mt-3 max-w-160 text-[15px] leading-7 text-[#686970]">
        View merchant accounts and update encrypted bank details. Changes are audited.
      </p>
      <AdminMerchantBank />
    </section>
  );
}
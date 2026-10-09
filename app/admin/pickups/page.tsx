import { requireOperationsOrAdmin } from "@/lib/auth/session";
import { AdminPickups } from "@/components/site/admin-pickups";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminPickupsPage() {
  await requireOperationsOrAdmin();

  return (
    <section className="mx-auto max-w-300 px-5 py-12">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Operations &amp; Dispatch</p>
      <h1 className="m-0 text-[clamp(28px,4vw,42px)] font-semibold text-[#202126]">Pickup requests queue</h1>
      <p className="mb-0 mt-2 text-[14px] text-[#686970]">Review merchant collection requests, assign drivers, schedule time windows, and record dispatch results.</p>
      <AdminPickups />
    </section>
  );
}

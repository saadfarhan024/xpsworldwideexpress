import { AdminShipments } from "@/components/site/admin-shipments";
import { requireOperationsOrAdmin } from "@/lib/auth/session";

export default async function AdminShipmentsPage() {
  await requireOperationsOrAdmin();

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Shipping operations</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Manage shipments</h1>
      <p className="mb-0 mt-3 text-[14px] leading-6 text-[#686970]">Record customer-visible tracking updates and staff-only notes.</p>
      <AdminShipments />
    </section>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminApplications } from "@/components/site/admin-applications";
import { requireAdminPortal } from "@/lib/auth/session";

export default async function AdminPage() {
  const user = await requireAdminPortal();
  const [pendingApplications, activeMerchants, openPickups, totalShipments] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.user.count({ where: { role: "MERCHANT", status: "ACTIVE" } }),
    prisma.pickupRequest.count({ where: { status: { in: ["REQUESTED", "SCHEDULED", "ASSIGNED"] } } }),
    prisma.shipment.count(),
  ]);

  return (
    <section className="mx-auto max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Operations overview</p>
      <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold text-[#202126]">
        {user.role === "ADMIN" ? "Admin dashboard" : `${user.role.toLowerCase()} dashboard`}
      </h1>
      <div className="mt-9 grid max-w-260 grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <p className="m-0 text-[13px] text-[#6d6e74]">Open pickups</p>
          <p className="mb-0 mt-2 text-[34px] font-semibold text-[#202126]">{openPickups}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <p className="m-0 text-[13px] text-[#6d6e74]">Total shipments</p>
          <p className="mb-0 mt-2 text-[34px] font-semibold text-[#202126]">{totalShipments}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <p className="m-0 text-[13px] text-[#6d6e74]">Pending merchants</p>
          <p className="mb-0 mt-2 text-[34px] font-semibold text-[#202126]">{pendingApplications}</p>
        </article>
        <article className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <p className="m-0 text-[13px] text-[#6d6e74]">Active merchants</p>
          <p className="mb-0 mt-2 text-[34px] font-semibold text-[#202126]">{activeMerchants}</p>
        </article>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        {(user.role === "ADMIN" || user.role === "OPERATIONS") && (
          <>
            <Link className="inline-flex min-h-10 items-center rounded-lg bg-[#16171a] px-4 text-[12px] font-semibold text-white hover:bg-[#34353a]" href="/admin/pickups">Pickup requests queue</Link>
            <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/shipments">Manage shipments</Link>
          </>
        )}
        {(user.role === "ADMIN" || user.role === "FINANCE") && (
          <>
            <Link className="inline-flex min-h-10 items-center rounded-lg bg-[#163e6a] px-4 text-[12px] font-semibold text-white hover:bg-[#ec8123]" href="/admin/remittances">COD Remittances</Link>
            <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/merchants">Merchant bank details</Link>
          </>
        )}
        {(user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "OPERATIONS") && (
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/tickets">Support tickets</Link>
        )}
        {user.role === "ADMIN" && (
          <>
            <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/staff">Staff accounts</Link>
            <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/audit">Audit log</Link>
            <Link className="inline-flex min-h-10 items-center rounded-lg border border-[#d8d9dd] bg-white px-4 text-[12px] font-semibold text-[#34353a] hover:bg-[#f5f5f6]" href="/admin/settings">System settings</Link>
          </>
        )}
      </div>
      {user.role === "ADMIN" && <AdminApplications />}
    </section>
  );
}

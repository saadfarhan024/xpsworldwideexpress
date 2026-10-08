import Link from "next/link";
import { PackageCheck, Truck, WalletCards } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireMerchant } from "@/lib/auth/session";

export default async function AccountPage() {
  const user = await requireMerchant();
  const firstName = user.merchantProfile?.contactName?.split(" ")[0] ?? "there";
  const merchantId = user.merchantProfile!.id;
  const [shipmentCount, pickupCount, remittanceCount, recentShipments] = await Promise.all([
    prisma.shipment.count({ where: { merchantId } }),
    prisma.pickupRequest.count({ where: { merchantId, status: { in: ["REQUESTED", "SCHEDULED", "ASSIGNED"] } } }),
    prisma.remittance.count({ where: { merchantId } }),
    prisma.shipment.findMany({
      where: { merchantId },
      select: { trackingCode: true, status: true, destinationCity: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const cards = [
    { label: "Shipments", value: String(shipmentCount), detail: shipmentCount ? "Total shipments created" : "No shipments created yet", icon: PackageCheck, href: "/account/shipments" },
    { label: "Pickup requests", value: String(pickupCount), detail: "Open pickup requests", icon: Truck, href: "/account/pickups" },
    { label: "Remittances", value: String(remittanceCount), detail: "COD remittance records", icon: WalletCards, href: "/account/remittances" },
  ];

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Merchant dashboard</p>
      <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold text-[#202126]">Welcome back, {firstName}</h1>
      <p className="mb-9 mt-3 max-w-160 text-[15px] leading-7 text-[#686970]">Manage shipments, pickups, and account activity from one place.</p>
      <div className="grid grid-cols-3 gap-5 max-[760px]:grid-cols-1">
        {cards.map(({ label, value, detail, icon: Icon, href }) => (
          <Link href={href} className="block rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)] transition hover:border-[#163e6a]/40 hover:shadow-md" key={label}>
            <Icon className="mb-5 size-6 text-[#ec8123]" aria-hidden="true" />
            <p className="m-0 text-[13px] font-medium text-[#6d6e74]">{label}</p>
            <p className="mb-1 mt-1 text-[34px] font-semibold text-[#202126]">{value}</p>
            <p className="m-0 text-[12px] text-[#85868c]">{detail}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-[#e5e6e9] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-[20px] font-semibold text-[#25262a]">Recent shipments</h2>
          <Link className="text-[13px] font-semibold text-[#163e6a] hover:underline" href="/account/shipments">View all shipments</Link>
        </div>
        {recentShipments.length ? (
          <div className="mt-4 divide-y divide-[#eeeeef]">
            {recentShipments.map((shipment) => (
              <Link className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px] hover:text-[#163e6a]" href={`/account/shipments/${shipment.trackingCode}`} key={shipment.trackingCode}>
                <span><strong className="font-mono font-semibold">{shipment.trackingCode}</strong><span className="ml-3 text-[#85868c]">{shipment.destinationCity}</span></span>
                <span className="text-[#686970]">{shipment.status.toLowerCase().replaceAll("_", " ")}</span>
              </Link>
            ))}
          </div>
        ) : <p className="mb-0 mt-3 text-[14px] text-[#6d6e74]">You have not created any shipments yet.</p>}
      </div>
    </section>
  );
}

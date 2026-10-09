import { LoadSheetTable, type LoadSheetRow } from "@/components/site/load-sheet-table";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type PageProps = { searchParams: Promise<{ rider?: string; from?: string; to?: string }> };

function dateValue(value: string | undefined, fallback: Date) {
  return value && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) ? value : fallback.toISOString().slice(0, 10);
}

export default async function LoadSheetLogPage({ searchParams }: PageProps) {
  const user = await requireMerchant();
  const merchant = user.merchantProfile;
  if (!merchant) return null;
  const query = await searchParams;
  const today = new Date();
  const from = dateValue(query.from, new Date(today.getFullYear(), today.getMonth(), 1));
  const to = dateValue(query.to, today);
  const [riders, pickups] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "OPERATIONS"] }, status: "ACTIVE" }, select: { id: true, email: true }, orderBy: { email: "asc" } }),
    prisma.pickupRequest.findMany({ where: { merchantId: merchant.id, createdAt: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T23:59:59.999Z`) }, ...(query.rider ? { assignedToId: query.rider } : {}) }, include: { assignedTo: { select: { email: true } }, shipments: { include: { shipment: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const rows: LoadSheetRow[] = pickups.flatMap((pickup) => pickup.shipments.map(({ shipment }) => ({
    id: shipment.id,
    date: pickup.createdAt.toLocaleDateString(),
    trackingCode: shipment.trackingCode,
    pickupInfo: [shipment.pickupName || pickup.contactPerson || merchant.contactName, shipment.pickupPhone || pickup.contactPhone || merchant.phone, shipment.pickupAddress || pickup.pickupAddress].join(" · "),
    deliveryInfo: [shipment.recipientName, shipment.recipientPhone, shipment.deliveryAddress].join(" · "),
    quantity: shipment.pieces,
    pickupCity: shipment.pickupCity || merchant.city,
    deliveryCity: shipment.destinationCity,
    weight: shipment.weightKg ? Number(shipment.weightKg) : null,
    codAmount: shipment.codAmount ? Number(shipment.codAmount) : null,
    assignedRider: pickup.assignedTo?.email ?? null,
  })));

  return <section className="mx-auto max-w-300 px-5 py-10 lg:px-8 lg:py-12"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Merchant operations</p><h1 className="m-0 text-[clamp(28px,4vw,42px)] font-semibold text-[#202126]">Load Sheet Log</h1><form className="mt-5 rounded-lg border border-[#e5e6e9] bg-white p-4 shadow-[0_5px_18px_rgba(24,25,30,0.04)]" method="get"><div className="flex flex-wrap items-end gap-7"><label className="grid gap-1 text-[12px] font-semibold text-[#686970]">From date<input className="h-9 rounded-md border border-[#cfd1d4] px-2.5 text-[13px] font-normal" name="from" type="date" defaultValue={from} /></label><label className="grid gap-1 text-[12px] font-semibold text-[#686970]">To date<input className="h-9 rounded-md border border-[#cfd1d4] px-2.5 text-[13px] font-normal" name="to" type="date" defaultValue={to} /></label><label className="grid min-w-70 flex-1 gap-1 text-[12px] font-semibold text-[#686970]">Vendor<select className="h-9 rounded-md border border-[#cfd1d4] bg-white px-2.5 text-[13px] font-normal" disabled defaultValue={merchant.id}><option value={merchant.id}>{merchant.companyName}</option></select></label><label className="grid min-w-55 gap-1 text-[12px] font-semibold text-[#686970]">Rider<select className="h-9 rounded-md border border-[#cfd1d4] bg-white px-2.5 text-[13px] font-normal" name="rider" defaultValue={query.rider ?? ""}><option value="">All Riders</option>{riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.email}</option>)}</select></label><button className="h-9 rounded-md bg-[#337ab7] px-5 text-[13px] font-semibold text-white hover:bg-[#286090]" type="submit">Filter</button></div></form><LoadSheetTable rows={rows} /></section>;
}

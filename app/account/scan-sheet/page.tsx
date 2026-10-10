import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ScanSheet } from "@/components/site/scan-sheet";

export default async function ScanSheetPage() {
  const user = await requireMerchant();
  const merchantId = user.merchantProfile!.id;
  const [orders, riders] = await Promise.all([
    prisma.shipment.findMany({ where: { merchantId, status: "CREATED" }, select: { id: true, trackingCode: true, orderId: true, recipientName: true, destinationCity: true, deliveryAddress: true, pieces: true, codAmount: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "OPERATIONS"] }, status: "ACTIVE" }, select: { id: true, email: true }, orderBy: { email: "asc" } }),
  ]);
  return <section className="mx-auto max-w-300 px-5 py-10"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Merchant operations</p><h1 className="mb-6 text-[28px] font-bold text-[#111]">Scan sheet</h1><ScanSheet orders={orders.map((order) => ({ ...order, codAmount: order.codAmount == null ? null : Number(order.codAmount) }))} riders={riders} /></section>;
}

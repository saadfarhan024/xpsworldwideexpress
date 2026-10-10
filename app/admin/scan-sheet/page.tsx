import { ScanSheet } from "@/components/site/scan-sheet";
import { requireOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminScanSheetPage() {
  await requireOperationsOrAdmin();
  const [orders, riders] = await Promise.all([prisma.shipment.findMany({ where: { status: "CREATED" }, select: { id: true, trackingCode: true, orderId: true, recipientName: true, destinationCity: true, deliveryAddress: true, pieces: true, codAmount: true }, orderBy: { createdAt: "desc" }, take: 1000 }), prisma.user.findMany({ where: { role: { in: ["ADMIN", "OPERATIONS"] }, status: "ACTIVE" }, select: { id: true, email: true }, orderBy: { email: "asc" } })]);
  return <section className="mx-auto max-w-300 px-5 py-10"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Operations</p><h1 className="mb-2 text-[28px] font-semibold text-[#202126]">Scan sheet</h1><p className="mb-6 text-[14px] text-[#686970]">Scan and print orders across merchant accounts.</p><ScanSheet orders={orders.map((order) => ({ ...order, codAmount: order.codAmount == null ? null : Number(order.codAmount) }))} riders={riders} /></section>;
}

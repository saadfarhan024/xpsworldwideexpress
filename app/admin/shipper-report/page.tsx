import { ShipperAdviceReport } from "@/components/site/shipper-advice-report";
import { requireOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminShipperReportPage() {
  await requireOperationsOrAdmin();
  const shipments = await prisma.shipment.findMany({ select: { id: true, trackingCode: true, serviceType: true, status: true, orderDate: true, createdAt: true, orderId: true, pickupName: true, pickupPhone: true, pickupAddress: true, pickupCity: true, recipientName: true, recipientPhone: true, deliveryAddress: true, destinationCity: true, specialInstruction: true }, orderBy: { orderDate: "desc" }, take: 1000 });
  return <section className="mx-auto max-w-300 px-5 py-10"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Operations reporting</p><ShipperAdviceReport shipments={shipments.map((shipment) => ({ ...shipment, orderDate: shipment.orderDate.toISOString(), pickupDate: shipment.createdAt.toISOString().replace("T", " ").slice(0, 19) }))} /></section>;
}

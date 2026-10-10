import { OrderReport } from "@/components/site/order-report";
import { requireOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminOrderReportPage() {
  await requireOperationsOrAdmin();
  const shipments = await prisma.shipment.findMany({ select: { id: true, trackingCode: true, status: true, serviceType: true, orderDate: true, createdAt: true, orderId: true, pickupName: true, pickupPhone: true, pickupAddress: true, pickupCity: true, recipientName: true, recipientPhone: true, deliveryAddress: true, destinationCity: true }, orderBy: { orderDate: "desc" }, take: 1000 });
  return <section className="mx-auto max-w-300 px-5 py-10"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#ec8123]">Operations reporting</p><h1 className="mb-2 text-[28px] font-semibold text-[#202126]">Order Report</h1><p className="mb-6 text-[14px] text-[#686970]">Cross-merchant order report for authorized operations staff.</p><OrderReport pickupCompany="All merchants" orders={shipments.map((shipment) => ({ ...shipment, orderDate: shipment.orderDate.toISOString(), pickupDate: shipment.createdAt.toISOString().replace("T", " ").slice(0, 19) }))} /></section>;
}

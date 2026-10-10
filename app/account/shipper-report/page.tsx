import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ShipperAdviceReport } from "@/components/site/shipper-advice-report";

export default async function ShipperReportPage() {
  const user = await requireMerchant();
  const shipments = await prisma.shipment.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: { id: true, trackingCode: true, serviceType: true, status: true, orderDate: true, createdAt: true, orderId: true, pickupName: true, pickupPhone: true, pickupAddress: true, pickupCity: true, recipientName: true, recipientPhone: true, deliveryAddress: true, destinationCity: true, specialInstruction: true },
    orderBy: { orderDate: "desc" },
  });
  return <section className="mx-auto min-h-125 max-w-300 px-5 py-10"><ShipperAdviceReport shipments={shipments.map((shipment) => ({ ...shipment, orderDate: shipment.orderDate.toISOString(), pickupDate: shipment.createdAt.toISOString().replace("T", " ").slice(0, 19) }))} /></section>;
}

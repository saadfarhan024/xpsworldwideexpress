import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrderReport } from "@/components/site/order-report";

export default async function OrderReportPage() {
  const user = await requireMerchant();
  const shipments = await prisma.shipment.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: { id: true, trackingCode: true, status: true, serviceType: true, orderDate: true, createdAt: true, orderId: true, pickupName: true, pickupPhone: true, pickupAddress: true, pickupCity: true, recipientName: true, recipientPhone: true, deliveryAddress: true, destinationCity: true },
    orderBy: { orderDate: "desc" },
  });
  const company = user.merchantProfile?.companyName ?? "";
  return <section className="mx-auto min-h-125 max-w-300 px-5 py-10"><OrderReport pickupCompany={company} orders={shipments.map((shipment) => ({ ...shipment, orderDate: shipment.orderDate.toISOString(), pickupDate: shipment.createdAt.toISOString().replace("T", " ").slice(0, 19) }))} /></section>;
}

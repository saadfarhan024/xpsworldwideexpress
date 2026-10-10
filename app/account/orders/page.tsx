import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrdersList } from "@/components/site/orders-list";

export default async function OrdersPage() {
  const user = await requireMerchant();
  const shipments = await prisma.shipment.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: {
      id: true,
      trackingCode: true,
      status: true,
      orderDate: true, createdAt: true, recipientName: true, recipientPhone: true, recipientEmail: true,
      destinationCity: true, pickupCity: true, pickupName: true, pickupPhone: true, pickupAddress: true,
      itemDescription: true, specialInstruction: true, codAmount: true, weightKg: true,
      referenceNumber: true, orderId: true, pieces: true, serviceType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-8 lg:px-8 lg:py-10">
      <OrdersList shipments={shipments.map((shipment) => ({ ...shipment, orderDate: shipment.orderDate.toISOString(), createdAt: shipment.createdAt.toISOString(), codAmount: shipment.codAmount ? Number(shipment.codAmount) : null, weightKg: shipment.weightKg ? Number(shipment.weightKg) : null }))} />
    </section>
  );
}

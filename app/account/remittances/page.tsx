import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RemittanceClearanceTable } from "@/components/site/remittance-clearance-table";

export default async function MerchantRemittancesPage() {
  const user = await requireMerchant();

  const remittances = await prisma.remittance.findMany({
    where: { merchantId: user.merchantProfile!.id },
    include: { shipments: { select: { status: true, codAmount: true, deliveryCharges: true, salesTax: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = remittances.map((r) => {
    const codAmount = r.shipments.reduce((sum, shipment) => sum + Number(shipment.codAmount ?? 0), 0);
    const deliveryCharges = r.shipments.reduce((sum, shipment) => sum + Number(shipment.deliveryCharges ?? 0), 0);
    const salesTax = r.shipments.reduce((sum, shipment) => sum + Number(shipment.salesTax ?? 0), 0);
    const payment = r.status === "PAID" ? Number(r.amount) : 0;
    return { reference: r.reference, payoutReference: r.payoutReference, invoiceDate: new Date(r.periodEnd).toISOString().slice(0, 10), shipmentCount: r.shipments.length, deliveryCount: r.shipments.filter((shipment) => shipment.status === "DELIVERED").length, codAmount, deliveryCharges, salesTax, payable: Number(r.amount), payment, balance: Math.max(Number(r.amount) - payment, 0) };
  });

  return <section className="mx-auto min-h-125 max-w-300 px-5 py-10"><RemittanceClearanceTable rows={rows} /></section>;
}

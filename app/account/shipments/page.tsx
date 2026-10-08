import { Plus } from "lucide-react";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MerchantShipmentsTable, type MerchantShipmentRow } from "@/components/site/merchant-shipments-table";
import Link from "next/link";

export default async function ShipmentsPage() {
  const user = await requireMerchant();
  const rawShipments = await prisma.shipment.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: {
      id: true,
      trackingCode: true,
      status: true,
      destinationCity: true,
      recipientName: true,
      recipientPhone: true,
      pieces: true,
      createdAt: true,
      codAmount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const shipments: MerchantShipmentRow[] = rawShipments.map((s) => ({
    id: s.id,
    trackingCode: s.trackingCode,
    recipientName: s.recipientName,
    recipientPhone: s.recipientPhone,
    destinationCity: s.destinationCity,
    pieces: s.pieces,
    status: s.status,
    codAmount: s.codAmount ? Number(s.codAmount) : null,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
            Business portal
          </p>
          <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">
            Shipments
          </h1>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-4 text-[13px] font-semibold text-white hover:bg-[#ec8123]"
          href="/account/shipments/new"
        >
          <Plus className="size-4" aria-hidden="true" /> Create shipment
        </Link>
      </div>

      <MerchantShipmentsTable initialShipments={shipments} />
    </section>
  );
}

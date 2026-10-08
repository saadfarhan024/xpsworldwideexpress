import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MerchantPickupsList, type MerchantPickup } from "@/components/site/merchant-pickups-list";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function MerchantPickupsPage() {
  const user = await requireMerchant();

  const rawPickups = await prisma.pickupRequest.findMany({
    where: { merchantId: user.merchantProfile!.id },
    include: {
      assignedTo: { select: { email: true } },
      shipments: {
        include: {
          shipment: {
            select: {
              id: true,
              trackingCode: true,
              recipientName: true,
              destinationCity: true,
              pieces: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pickups: MerchantPickup[] = rawPickups.map((p) => ({
    id: p.id,
    status: p.status,
    pickupAddress: p.pickupAddress,
    contactPerson: p.contactPerson,
    contactPhone: p.contactPhone,
    timeWindow: p.timeWindow,
    requestedFor: p.requestedFor ? p.requestedFor.toISOString() : null,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
    assignedTo: p.assignedTo,
    shipments: p.shipments,
  }));

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
            Merchant portal
          </p>
          <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">
            Pickup requests
          </h1>
        </div>
        <Link
          href="/account/pickups/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-4 text-[13px] font-semibold text-white hover:bg-[#ec8123]"
        >
          <Plus className="size-4" /> Request pickup
        </Link>
      </div>

      <MerchantPickupsList initialPickups={pickups} />
    </section>
  );
}

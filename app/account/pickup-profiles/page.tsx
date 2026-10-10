import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PickupProfilesManager } from "@/components/site/pickup-profiles-manager";

export default async function PickupProfilesPage() {
  const user = await requireMerchant();
  const profiles = await prisma.pickupProfile.findMany({
    where: { merchantId: user.merchantProfile!.id },
    select: { id: true, shipperName: true, shipperPhone: true, shipperEmail: true, origin: true, shipperAddress: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto min-h-125 max-w-300 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Shipment settings</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Pickup profiles</h1>
      <p className="mb-8 mt-3 max-w-180 text-[15px] leading-7 text-[#686970]">Save alternate shipper and origin details to use when creating a shipment.</p>
      <PickupProfilesManager initialProfiles={profiles} />
    </section>
  );
}

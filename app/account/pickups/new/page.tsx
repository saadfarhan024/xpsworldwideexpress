import { requireMerchant } from "@/lib/auth/session";
import { PickupRequestForm } from "@/components/site/pickup-request-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewPickupPage() {
  const user = await requireMerchant();
  const profile = user.merchantProfile!;

  return (
    <section className="mx-auto min-h-125 max-w-230 px-5 py-12">
      <Link
        href="/account/pickups"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]"
      >
        <ArrowLeft className="size-4" /> Back to pickup requests
      </Link>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">
        Dispatch & operations
      </p>
      <h1 className="m-0 text-[clamp(28px,4vw,38px)] font-semibold text-[#202126]">
        Request a pickup
      </h1>
      <p className="mb-0 mt-2 text-[14px] text-[#686970]">
        Schedule courier collection from your warehouse or storefront.
      </p>

      <PickupRequestForm
        defaultAddress={profile.pickupAddress}
        defaultContact={profile.contactName}
        defaultPhone={profile.phone}
      />
    </section>
  );
}

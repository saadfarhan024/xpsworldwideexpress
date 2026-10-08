import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShipmentCreateForm } from "@/components/site/shipment-create-form";
import { requireMerchant } from "@/lib/auth/session";

export default async function NewShipmentPage() {
  await requireMerchant();

  return (
    <section className="mx-auto min-h-125 max-w-210 px-5 py-12">
      <Link className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]" href="/account/shipments"><ArrowLeft className="size-4" aria-hidden="true" /> Back to shipments</Link>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Shipment details</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Create a shipment</h1>
      <p className="mb-7 mt-3 text-[14px] leading-6 text-[#686970]">Add the recipient and parcel information. A unique tracking code will be created when you submit.</p>
      <ShipmentCreateForm />
    </section>
  );
}

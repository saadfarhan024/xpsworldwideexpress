import { requireMerchant } from "@/lib/auth/session";
import { BulkShipmentUpload } from "@/components/site/bulk-shipment-upload";

export default async function BulkShipmentUploadPage() {
  await requireMerchant();

  return (
    <section className="mx-auto min-h-125 max-w-240 px-5 py-12">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Shipment tools</p>
      <h1 className="m-0 text-[clamp(30px,4vw,42px)] font-semibold text-[#202126]">Upload bulk sheet</h1>
      <p className="mb-8 mt-3 max-w-180 text-[15px] leading-7 text-[#686970]">
        Create multiple shipments at once using the provided helper template.
      </p>
      <BulkShipmentUpload />
    </section>
  );
}

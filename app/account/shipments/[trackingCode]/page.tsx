import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { requireMerchant } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function ShipmentDetailsPage({ params }: PageProps<"/account/shipments/[trackingCode]">) {
  const user = await requireMerchant();
  const { trackingCode } = await params;
  const shipment = await prisma.shipment.findFirst({
    where: { trackingCode, merchantId: user.merchantProfile!.id },
    include: { events: { orderBy: { occurredAt: "desc" } } },
  });
  if (!shipment) notFound();

  return (
    <section className="mx-auto min-h-125 max-w-210 px-5 py-12">
      <Link className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#62636a] hover:text-[#163e6a]" href="/account/shipments"><ArrowLeft className="size-4" aria-hidden="true" /> Back to shipments</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#163e6a]">Shipment details</p>
          <h1 className="m-0 font-mono text-[clamp(26px,4vw,38px)] font-semibold text-[#202126]">{shipment.trackingCode}</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/account/shipments/${shipment.trackingCode}/label`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[#dedfe2] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#163e6a] hover:bg-[#f3f4f6]"
          >
            Print shipping label
          </a>
          <span className="rounded-full bg-[#edf6ef] px-3.5 py-1.5 text-[12px] font-semibold text-[#28623a]">{label(shipment.status)}</span>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <article className="rounded-xl border border-[#e5e6e9] bg-white p-5">
          <h2 className="mb-4 mt-0 text-[16px] font-semibold text-[#25262a]">Delivery details</h2>
          <dl className="grid gap-3 text-[13px]">
            <div><dt className="text-[#898a90]">Recipient</dt><dd className="m-0 text-[#34353a]">{shipment.recipientName}</dd></div>
            <div><dt className="text-[#898a90]">Phone</dt><dd className="m-0 text-[#34353a]">{shipment.recipientPhone}</dd></div>
            <div><dt className="text-[#898a90]">Delivery address</dt><dd className="m-0 text-[#34353a]">{shipment.deliveryAddress}</dd></div>
            <div><dt className="text-[#898a90]">Destination</dt><dd className="m-0 text-[#34353a]">{shipment.destinationCity}</dd></div>
          </dl>
        </article>
        <article className="rounded-xl border border-[#e5e6e9] bg-white p-5">
          <h2 className="mb-4 mt-0 text-[16px] font-semibold text-[#25262a]">Parcel details</h2>
          <dl className="grid gap-3 text-[13px]">
            <div><dt className="text-[#898a90]">Description</dt><dd className="m-0 text-[#34353a]">{shipment.itemDescription || "Not provided"}</dd></div>
            <div><dt className="text-[#898a90]">Parcels</dt><dd className="m-0 text-[#34353a]">{shipment.pieces}</dd></div>
            <div><dt className="text-[#898a90]">Cash on delivery</dt><dd className="m-0 text-[#34353a]">{shipment.codAmount ? `PKR ${shipment.codAmount.toFixed(2)}` : "None"}</dd></div>
            <div><dt className="text-[#898a90]">Created</dt><dd className="m-0 text-[#34353a]">{new Date(shipment.createdAt).toLocaleString()}</dd></div>
          </dl>
        </article>
      </div>

      <article className="mt-5 rounded-xl border border-[#e5e6e9] bg-white p-5">
        <h2 className="mb-5 mt-0 flex items-center gap-2 text-[17px] font-semibold text-[#25262a]"><PackageCheck className="size-5 text-[#163e6a]" aria-hidden="true" /> Tracking timeline</h2>
        {shipment.events.length ? (
          <ol className="grid list-none gap-5 border-l border-[#dedfe2] pl-5">
            {shipment.events.map((event) => (
              <li className="relative" key={event.id}>
                <span className="absolute -left-[25px] top-0.5 size-2.5 rounded-full bg-[#ed171d] ring-4 ring-white" aria-hidden="true" />
                <p className="m-0 text-[13px] font-semibold text-[#34353a]">{label(event.status)}{event.location ? ` · ${event.location}` : ""}</p>
                <p className="mb-0 mt-1 text-[13px] leading-5 text-[#686970]">{event.publicNote}</p>
                <time className="mt-1 block text-[11px] text-[#929399]" dateTime={event.occurredAt.toISOString()}>{new Date(event.occurredAt).toLocaleString()}</time>
              </li>
            ))}
          </ol>
        ) : <p className="mb-0 text-[13px] text-[#686970]">No tracking events have been recorded.</p>}
      </article>
    </section>
  );
}

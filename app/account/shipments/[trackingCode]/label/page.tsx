import { notFound } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatStatusLabel } from "@/lib/shipments";

type Props = {
  params: Promise<{ trackingCode: string }>;
};

export default async function ShipmentLabelPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") {
    notFound();
  }

  const { trackingCode } = await params;

  // Merchant can view their own; Staff can view any
  const where = isStaff(user.role)
    ? { trackingCode }
    : { trackingCode, merchantId: user.merchantProfile?.id };

  const shipment = await prisma.shipment.findFirst({
    where,
    include: {
      merchant: true,
    },
  });

  if (!shipment) notFound();

  const isCod = shipment.codAmount && Number(shipment.codAmount) > 0;

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 font-sans text-black print:bg-white print:p-0">
      <div className="mx-auto max-w-140 print:max-w-none">
        {/* Screen-only Print Bar */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-xs print:hidden">
          <div>
            <h1 className="m-0 text-[16px] font-semibold text-[#163e6a]">
              Shipping Label · {shipment.trackingCode}
            </h1>
            <p className="m-0 text-[12px] text-[#6b7280]">
              Standard 4&quot; × 6&quot; thermal and laser dispatch manifest format
            </p>
          </div>
          <button
            // Native print trigger via inline script or button click
            onClick={() => {}}
            className="rounded-lg bg-[#163e6a] px-4 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#ec8123]"
          >
            Print Label
          </button>
        </div>

        {/* The Printable Label Sheet (4x6 style) */}
        <div className="border-2 border-black bg-white p-6 shadow-sm print:border-2 print:border-black print:p-5 print:shadow-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <span className="font-extrabold tracking-tight text-[22px] text-[#163e6a]">
                XPS <span className="text-[#ec8123]">EXPRESS</span>
              </span>
              <p className="m-0 text-[10px] font-semibold tracking-widest uppercase text-black">
                Worldwide Express & Logistics
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block border border-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                DOMESTIC OVERNIGHT
              </span>
              <p className="m-0 mt-0.5 text-[10px] text-gray-600">
                {new Date(shipment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Big Destination Hub Header */}
          <div className="flex items-center justify-between border-b-2 border-black bg-gray-50 px-3 py-2 print:bg-transparent">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                DESTINATION ROUTE / HUB
              </span>
              <p className="m-0 text-[26px] font-black uppercase tracking-tight text-black">
                {shipment.destinationCity}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                PIECES
              </span>
              <p className="m-0 text-[22px] font-black">{shipment.pieces} PKG</p>
            </div>
          </div>

          {/* Recipient Deliver To */}
          <div className="border-b-2 border-black py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              DELIVER TO (CONSIGNEE):
            </span>
            <p className="m-0 text-[18px] font-bold text-black">{shipment.recipientName}</p>
            <p className="m-0 text-[13px] font-bold text-black">Tel: {shipment.recipientPhone}</p>
            <p className="m-0 mt-1 whitespace-pre-wrap text-[13px] leading-snug text-gray-800">
              {shipment.deliveryAddress}
            </p>
            <p className="m-0 mt-1 text-[13px] font-bold uppercase text-black">
              City: {shipment.destinationCity}
            </p>
          </div>

          {/* Sender Return Address */}
          <div className="grid grid-cols-2 gap-3 border-b-2 border-black py-3 text-[11px]">
            <div>
              <span className="font-bold uppercase tracking-wider text-gray-500">
                RETURN / SENDER:
              </span>
              <p className="m-0 font-bold text-black">{shipment.merchant.companyName}</p>
              <p className="m-0 text-gray-700">{shipment.merchant.pickupAddress}</p>
              <p className="m-0 text-gray-700">
                {shipment.merchant.city} · Tel: {shipment.merchant.phone}
              </p>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-gray-500">
                SHIPMENT DETAILS:
              </span>
              <p className="m-0 text-gray-700">
                Desc: {shipment.itemDescription || "General parcel goods"}
              </p>
              <p className="m-0 text-gray-700">Status: {formatStatusLabel(shipment.status)}</p>
            </div>
          </div>

          {/* COD / Payment Banner */}
          <div
            className={`border-b-2 border-black p-3 text-center ${
              isCod ? "bg-black text-white print:bg-black print:text-white" : "bg-gray-100"
            }`}
          >
            {isCod ? (
              <div>
                <p className="m-0 text-[12px] font-extrabold uppercase tracking-widest text-white">
                  CASH ON DELIVERY (COLLECT FROM CUSTOMER)
                </p>
                <p className="m-0 text-[24px] font-black text-white">
                  PKR {Number(shipment.codAmount).toFixed(2)}
                </p>
              </div>
            ) : (
              <div>
                <p className="m-0 text-[12px] font-extrabold uppercase tracking-widest text-black">
                  PREPAID SHIPMENT · NO CASH COLLECTION
                </p>
              </div>
            )}
          </div>

          {/* Barcode & Tracking Code Section */}
          <div className="pt-4 text-center">
            {/* Visual representation of 1D barcode lines */}
            <div
              className="mx-auto flex h-14 w-full max-w-95 items-stretch justify-center gap-0.75 overflow-hidden py-1"
              aria-hidden="true"
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1 bg-black ${i % 3 === 0 ? "w-1.5" : i % 5 === 0 ? "w-0.5" : ""}`}
                />
              ))}
            </div>
            <p className="m-0 font-mono text-[18px] font-extrabold tracking-widest text-black">
              {shipment.trackingCode}
            </p>
            <p className="m-0 mt-1 text-[9px] text-gray-500">
              Track parcel anytime at www.xpsworldwideexpress.com/tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

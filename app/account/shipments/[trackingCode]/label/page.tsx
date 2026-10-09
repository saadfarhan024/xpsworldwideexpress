import { notFound } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatStatusLabel } from "@/lib/shipments";
import { PrintButton } from "@/components/site/print-button";
import { Barcode } from "@/components/site/barcode";

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
  const money = (value: unknown) => value == null ? "—" : `PKR ${Number(value).toFixed(2)}`;
  const senderName = shipment.pickupName || shipment.merchant.contactName;
  const senderPhone = shipment.pickupPhone || shipment.merchant.phone;
  const senderAddress = [shipment.pickupAddress || shipment.merchant.pickupAddress, shipment.pickupAddressLine2].filter(Boolean).join("\n");
  const senderCity = shipment.pickupCity || shipment.merchant.city;

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
          <PrintButton label="Print Label" />
        </div>

        {/* The Printable Label Sheet (4x6 style) */}
        <div className="border-2 border-black bg-white p-6 shadow-sm print:border-2 print:border-black print:p-5 print:shadow-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <span className="font-extrabold tracking-tight text-[22px] text-[#163e6a]">
                GO <span className="text-[#ec8123]">DELIVERY EXPRESS</span>
              </span>
              <p className="m-0 text-[10px] font-semibold tracking-widest uppercase text-black">
                Express Logistics & Courier Service
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block border border-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                {shipment.serviceType.toUpperCase()}
              </span>
              <p className="m-0 mt-0.5 text-[10px] text-gray-600">
                Order date: {new Date(shipment.orderDate).toLocaleDateString()}
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
            {shipment.recipientEmail && <p className="m-0 text-[11px] text-gray-700">{shipment.recipientEmail}</p>}
            <p className="m-0 mt-1 whitespace-pre-wrap text-[13px] leading-snug text-gray-800">
              {shipment.deliveryAddress}
            </p>
            {shipment.googleAddress && <p className="m-0 mt-1 text-[11px] text-gray-600">Map: {shipment.googleAddress}</p>}
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
              <p className="m-0 text-gray-700">{senderName} · {senderPhone}</p>
              <p className="m-0 whitespace-pre-wrap text-gray-700">{senderAddress}</p>
              <p className="m-0 text-gray-700">
                {senderCity}{shipment.pickupEmail ? ` · ${shipment.pickupEmail}` : ""}
              </p>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-gray-500">
                SHIPMENT DETAILS:
              </span>
              <p className="m-0 text-gray-700">
                Desc: {shipment.itemDescription || "General parcel goods"}
              </p>
              <p className="m-0 text-gray-700">Product: {shipment.productType} · Weight: {shipment.weightKg ? `${Number(shipment.weightKg).toFixed(3)} kg` : "—"}</p>
              <p className="m-0 text-gray-700">Ref: {shipment.referenceNumber || "—"} · Order: {shipment.orderId || "—"}</p>
              <p className="m-0 text-gray-700">Status: {formatStatusLabel(shipment.status)}</p>
              {shipment.allowToOpen && <p className="m-0 font-bold text-black">ALLOW TO OPEN</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b-2 border-black py-2 text-center text-[10px]">
            <div><span className="block font-bold uppercase text-gray-500">Delivery charges</span><span className="font-bold">{money(shipment.deliveryCharges)}</span></div>
            <div><span className="block font-bold uppercase text-gray-500">Total charges</span><span className="font-bold">{money(shipment.totalCharges)}</span></div>
            <div><span className="block font-bold uppercase text-gray-500">Net amount</span><span className="font-bold">{money(shipment.netAmount)}</span></div>
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
            {/* Real scannable Code 128 laser manifest barcode */}
            <div className="mx-auto flex justify-center py-2">
              <Barcode value={shipment.trackingCode} />
            </div>
            <p className="m-0 font-mono text-[18px] font-extrabold tracking-widest text-black">
              {shipment.trackingCode}
            </p>
            <p className="m-0 mt-1 text-[9px] text-gray-500">
              Track parcel anytime at www.godeliveryexpress.com/tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateTrackingCode } from "@/lib/shipments";
import { calculateShipmentPricing } from "@/lib/shipment-pricing";

type ShipmentInput = {
  productType?: unknown;
  serviceType?: unknown;
  orderDate?: unknown;
  pickupCity?: unknown;
  pickupProfile?: unknown;
  pickupName?: unknown;
  pickupPhone?: unknown;
  pickupEmail?: unknown;
  pickupAddress?: unknown;
  pickupAddressLine2?: unknown;
  recipientName?: unknown;
  recipientPhone?: unknown;
  recipientEmail?: unknown;
  deliveryAddress?: unknown;
  googleAddress?: unknown;
  destinationCity?: unknown;
  itemDescription?: unknown;
  specialInstruction?: unknown;
  referenceNumber?: unknown;
  orderId?: unknown;
  pieces?: unknown;
  weightKg?: unknown;
  allowToOpen?: unknown;
  codAmount?: unknown;
  deliveryCharges?: unknown;
  totalCharges?: unknown;
  fuelSurchargePercent?: unknown;
  salesTax?: unknown;
  netAmount?: unknown;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "An active merchant account is required to create shipments." }, { status: 403 });
  }

  let input: ShipmentInput;
  try {
    input = await request.json() as ShipmentInput;
  } catch {
    return NextResponse.json({ message: "Invalid shipment request." }, { status: 400 });
  }

  const recipientName = text(input.recipientName);
  const recipientPhone = text(input.recipientPhone);
  const recipientEmail = text(input.recipientEmail);
  const deliveryAddress = text(input.deliveryAddress);
  const googleAddress = text(input.googleAddress);
  const destinationCity = text(input.destinationCity);
  const productType = text(input.productType) || "Parcel";
  const serviceType = text(input.serviceType) || "Overnight";
  const orderDate = input.orderDate ? new Date(`${text(input.orderDate)}T00:00:00.000Z`) : new Date();
  const pickupCity = text(input.pickupCity);
  const pickupProfile = text(input.pickupProfile);
  const pickupName = text(input.pickupName);
  const pickupPhone = text(input.pickupPhone);
  const pickupEmail = text(input.pickupEmail);
  const pickupAddress = text(input.pickupAddress);
  const pickupAddressLine2 = text(input.pickupAddressLine2);
  const itemDescription = text(input.itemDescription);
  const specialInstruction = text(input.specialInstruction);
  const referenceNumber = text(input.referenceNumber);
  const orderId = text(input.orderId);
  const pieces = Number(input.pieces ?? 1);
  const weightKg = Number(input.weightKg ?? 0.5);
  const allowToOpen = input.allowToOpen === true || input.allowToOpen === "true" || input.allowToOpen === "on";
  const codAmount = input.codAmount === "" || input.codAmount == null ? null : Number(input.codAmount);
  const pricing = calculateShipmentPricing({ productType, serviceType, pieces, weightKg, codAmount: codAmount ?? 0 });

  if (pickupProfile) {
    const profile = await prisma.pickupProfile.findFirst({
      where: { id: pickupProfile, merchantId: user.merchantProfile.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ message: "The selected pickup profile is unavailable." }, { status: 400 });
  }

  if (!recipientName || recipientName.length > 160 || !recipientPhone || recipientPhone.length > 40 || (recipientEmail && recipientEmail.length > 254) || !deliveryAddress || deliveryAddress.length > 1000 || !destinationCity || destinationCity.length > 100 || !itemDescription || itemDescription.length > 500 || !Number.isInteger(pieces) || pieces < 1 || pieces > 100 || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000 || (codAmount !== null && (!Number.isFinite(codAmount) || codAmount < 0 || codAmount > 100_000_000))) {
    return NextResponse.json({ message: "Check the order, pickup, delivery, parcel, and price details." }, { status: 400 });
  }

  const trackingCode = generateTrackingCode();
  const shipment = await prisma.$transaction(async (transaction) => {
    const created = await transaction.shipment.create({
      data: {
        merchantId: user.merchantProfile!.id,
        trackingCode,
        productType,
        serviceType,
        orderDate: Number.isNaN(orderDate.getTime()) ? new Date() : orderDate,
        pickupCity: pickupCity || user.merchantProfile!.city,
        pickupProfile: pickupProfile || null,
        pickupName: pickupName || user.merchantProfile!.contactName,
        pickupPhone: pickupPhone || user.merchantProfile!.phone,
        pickupEmail: pickupEmail || null,
        pickupAddress: pickupAddress || user.merchantProfile!.pickupAddress,
        pickupAddressLine2: pickupAddressLine2 || null,
        recipientName,
        recipientPhone,
        recipientEmail: recipientEmail || null,
        deliveryAddress,
        googleAddress: googleAddress || null,
        destinationCity,
        itemDescription: itemDescription || null,
        specialInstruction: specialInstruction || null,
        referenceNumber: referenceNumber || null,
        orderId: orderId || null,
        pieces,
        weightKg,
        allowToOpen,
        codAmount,
        deliveryCharges: pricing.deliveryCharges,
        totalCharges: pricing.totalCharges,
        fuelSurchargePercent: pricing.fuelSurchargePercent,
        salesTax: pricing.salesTax,
        netAmount: pricing.netAmount,
        carrierStatus: "NEW_BOOKED",
        events: {
          create: {
            status: "CREATED",
            carrierStatus: "NEW_BOOKED",
            publicNote: "Shipment information received.",
            actorId: user.id,
          },
        },
      },
      select: { id: true, trackingCode: true },
    });

    await transaction.auditLog.create({
      data: {
        actorId: user.id,
        action: "SHIPMENT_CREATED",
        entityType: "Shipment",
        entityId: created.id,
        summary: `Shipment ${created.trackingCode} created.`,
      },
    });
    return created;
  });

  return NextResponse.json({ shipment }, { status: 201 });
}

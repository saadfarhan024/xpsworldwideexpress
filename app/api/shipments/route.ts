import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type ShipmentInput = {
  recipientName?: unknown;
  recipientPhone?: unknown;
  deliveryAddress?: unknown;
  destinationCity?: unknown;
  itemDescription?: unknown;
  pieces?: unknown;
  codAmount?: unknown;
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
  const deliveryAddress = text(input.deliveryAddress);
  const destinationCity = text(input.destinationCity);
  const itemDescription = text(input.itemDescription);
  const pieces = Number(input.pieces ?? 1);
  const codAmount = input.codAmount === "" || input.codAmount == null ? null : Number(input.codAmount);

  if (!recipientName || recipientName.length > 160 || !recipientPhone || recipientPhone.length > 40 || !deliveryAddress || deliveryAddress.length > 1000 || !destinationCity || destinationCity.length > 100 || itemDescription.length > 500 || !Number.isInteger(pieces) || pieces < 1 || pieces > 100 || (codAmount !== null && (!Number.isFinite(codAmount) || codAmount < 0 || codAmount > 100_000_000))) {
    return NextResponse.json({ message: "Check the recipient, delivery details, parcel count, and COD amount." }, { status: 400 });
  }

  const trackingCode = `XPS-${randomBytes(12).toString("hex").toUpperCase()}`;
  const shipment = await prisma.$transaction(async (transaction) => {
    const created = await transaction.shipment.create({
      data: {
        merchantId: user.merchantProfile!.id,
        trackingCode,
        recipientName,
        recipientPhone,
        deliveryAddress,
        destinationCity,
        itemDescription: itemDescription || null,
        pieces,
        codAmount,
        events: {
          create: {
            status: "CREATED",
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

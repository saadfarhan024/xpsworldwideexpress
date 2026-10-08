import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

async function requireActiveMerchant() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return null;
  }
  return user;
}

type RouteContext = { params: Promise<{ pickupId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const { pickupId } = await context.params;

  let body: { action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid request data." }, { status: 400 });
  }

  if (body.action !== "cancel") {
    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  }

  const pickup = await prisma.pickupRequest.findFirst({
    where: {
      id: pickupId,
      merchantId: user.merchantProfile.id,
    },
    include: {
      shipments: {
        include: {
          shipment: { select: { id: true, status: true, trackingCode: true } },
        },
      },
    },
  });

  if (!pickup) {
    return NextResponse.json({ message: "Pickup request not found." }, { status: 404 });
  }

  if (pickup.status !== "REQUESTED" && pickup.status !== "SCHEDULED") {
    return NextResponse.json(
      { message: `Cannot cancel a pickup request with status ${pickup.status}.` },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: pickup.id },
      data: { status: "CANCELLED" },
    });

    const scheduledShipments = pickup.shipments
      .map((ps) => ps.shipment)
      .filter((s) => s.status === "PICKUP_SCHEDULED");

    if (scheduledShipments.length > 0) {
      await tx.shipment.updateMany({
        where: { id: { in: scheduledShipments.map((s) => s.id) } },
        data: { status: "CREATED" },
      });

      for (const s of scheduledShipments) {
        await tx.trackingEvent.create({
          data: {
            shipmentId: s.id,
            status: "CREATED",
            publicNote: "Pickup request cancelled by merchant.",
            actorId: user.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "PICKUP_CANCELLED_BY_MERCHANT",
        entityType: "PickupRequest",
        entityId: pickup.id,
        summary: `Pickup request ${pickup.id} cancelled by merchant.`,
      },
    });
  });

  return NextResponse.json({ message: "Pickup request has been cancelled." });
}

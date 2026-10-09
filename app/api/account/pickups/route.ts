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

const clean = (val: unknown) => (typeof val === "string" ? val.trim() : "");

export async function GET() {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const pickups = await prisma.pickupRequest.findMany({
    where: { merchantId: user.merchantProfile.id },
    include: {
      shipments: {
        include: {
          shipment: {
            select: {
              id: true,
              trackingCode: true,
              recipientName: true,
              destinationCity: true,
              pieces: true,
              status: true,
              codAmount: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pickups });
}

export async function POST(request: Request) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  let body: {
    pickupAddress?: unknown;
    contactPerson?: unknown;
    contactPhone?: unknown;
    timeWindow?: unknown;
    requestedFor?: unknown;
    note?: unknown;
    shipmentIds?: unknown;
    assignedToId?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid pickup request data." }, { status: 400 });
  }

  const profile = user.merchantProfile;
  const pickupAddress = clean(body.pickupAddress) || profile.pickupAddress;
  const contactPerson = clean(body.contactPerson) || profile.contactName;
  const contactPhone = clean(body.contactPhone) || profile.phone;
  const timeWindow = clean(body.timeWindow) || null;
  const note = clean(body.note) || null;
  const assignedToId = clean(body.assignedToId) || null;
  const rawRequestedFor = clean(body.requestedFor);
  const requestedFor = rawRequestedFor ? new Date(rawRequestedFor) : null;

  if (!pickupAddress) {
    return NextResponse.json({ message: "Pickup address is required." }, { status: 400 });
  }

  const shipmentIds: string[] = Array.isArray(body.shipmentIds)
    ? body.shipmentIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];

  // If specific shipments were selected, verify they belong to merchant and are in CREATED state
  let eligibleShipments: { id: string; trackingCode: string }[] = [];
  if (shipmentIds.length > 0) {
    eligibleShipments = await prisma.shipment.findMany({
      where: {
        id: { in: shipmentIds },
        merchantId: profile.id,
        status: "CREATED",
      },
      select: { id: true, trackingCode: true },
    });

    if (eligibleShipments.length !== shipmentIds.length) {
      return NextResponse.json(
        { message: "One or more selected shipments are unavailable or already scheduled for pickup." },
        { status: 400 }
      );
    }
  }

  if (assignedToId) {
    const rider = await prisma.user.findFirst({
      where: { id: assignedToId, role: { in: ["ADMIN", "OPERATIONS"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (!rider) return NextResponse.json({ message: "Selected rider is not available." }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const pickup = await tx.pickupRequest.create({
      data: {
        merchantId: profile.id,
        pickupAddress,
        contactPerson,
        contactPhone,
        timeWindow,
        requestedFor,
        note,
        status: assignedToId ? "ASSIGNED" : "REQUESTED",
        assignedToId,
        shipments: {
          create: eligibleShipments.map((s) => ({
            shipmentId: s.id,
          })),
        },
      },
      include: {
        shipments: {
          include: {
            shipment: {
              select: { trackingCode: true },
            },
          },
        },
      },
    });

    if (eligibleShipments.length > 0) {
      await tx.shipment.updateMany({
        where: { id: { in: eligibleShipments.map((s) => s.id) } },
        data: { status: "PICKUP_SCHEDULED" },
      });

      for (const s of eligibleShipments) {
        await tx.trackingEvent.create({
          data: {
            shipmentId: s.id,
            status: "PICKUP_SCHEDULED",
            publicNote: "Pickup requested by merchant.",
            actorId: user.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "PICKUP_REQUESTED",
        entityType: "PickupRequest",
        entityId: pickup.id,
        summary: `Pickup request created with ${eligibleShipments.length} shipment(s).`,
      },
    });

    return pickup;
  });

  return NextResponse.json({ pickup: created, message: "Pickup requested successfully." }, { status: 201 });
}

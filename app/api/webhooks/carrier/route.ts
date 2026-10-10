import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { CARRIER_STATUS_MAP, isValidTransition, normalizeCarrierStatus, TERMINAL_STATUSES } from "@/lib/shipments";

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(expected.toLowerCase());
    const b = Buffer.from(signature.toLowerCase());
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.CARRIER_WEBHOOK_SECRET || (process.env.NODE_ENV === "production" ? "" : "development-carrier-secret-key-123");
  const signature = request.headers.get("x-carrier-signature");

  const rawBody = await request.text();

  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ message: "Carrier webhook secret is not configured." }, { status: 503 });
  }
  if (process.env.NODE_ENV === "production" && !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  let body: {
    eventId?: string;
    trackingCode?: string;
    status?: string;
    location?: string;
    notes?: string;
    occurredAt?: string;
  };

  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const { eventId, trackingCode, status, location, notes, occurredAt } = body;

  if (!trackingCode || !status) {
    return NextResponse.json({ message: "Tracking code and carrier status are required." }, { status: 400 });
  }

  const carrierStatus = normalizeCarrierStatus(status);
  const gdeStatus = carrierStatus ? CARRIER_STATUS_MAP[carrierStatus] : null;
  if (!carrierStatus || !gdeStatus) {
    return NextResponse.json({ message: `Unrecognized carrier status: ${status}` }, { status: 400 });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode },
    include: {
      events: {
        orderBy: { occurredAt: "desc" },
        take: 5,
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
  }

  const eventTime = occurredAt ? new Date(occurredAt) : new Date();

  // Idempotency check: if an event with same status and time exists, skip duplication safely
  const isDuplicate = shipment.events.some(
    (e) =>
      e.status === gdeStatus &&
      Math.abs(e.occurredAt.getTime() - eventTime.getTime()) < 1000
  );

  if (isDuplicate) {
    return NextResponse.json({
      message: "Event already recorded. Replay ignored idempotently.",
      trackingCode,
      status: gdeStatus,
    });
  }

  // Validate allowed status transition
  if (!isValidTransition(shipment.status, gdeStatus) && shipment.status !== gdeStatus) {
    if (TERMINAL_STATUSES.has(shipment.status)) {
      return NextResponse.json({
        message: `Shipment is already in terminal status ${shipment.status}. Inbound update discarded.`,
      });
    }
  }

  const publicNote = notes || `Shipment ${carrierStatus.toLowerCase().replaceAll("_", " ")}${location ? ` at ${location}` : ""}.`;

  await prisma.$transaction(async (tx) => {
    // Only update shipment status if it's a forward valid progression
    if (isValidTransition(shipment.status, gdeStatus)) {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: gdeStatus,
          carrierStatus,
          ...(gdeStatus === "DELIVERED" && shipment.codAmount && !shipment.collectedAmount
            ? { collectedAmount: shipment.codAmount }
            : {}),
        },
      });
    }

    await tx.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: gdeStatus,
        carrierStatus,
        location: location || null,
        publicNote,
        internalNote: eventId ? `Inbound Carrier Webhook EventID: ${eventId}` : null,
        occurredAt: eventTime,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CARRIER_WEBHOOK_EVENT_PROCESSED",
        entityType: "Shipment",
        entityId: shipment.id,
        summary: `Carrier webhook updated shipment ${trackingCode} to ${carrierStatus}${eventId ? ` (Event ${eventId})` : ""}.`,
      },
    });
  });

  return NextResponse.json({
    message: "Carrier event processed successfully.",
    trackingCode,
    status: gdeStatus,
  });
}

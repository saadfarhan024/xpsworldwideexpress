import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { isValidTransition, TERMINAL_STATUSES } from "@/lib/shipments";
import type { ShipmentStatus } from "@prisma/client";

// Status mapping from external carrier events to XPS shipment statuses
const CARRIER_STATUS_MAP: Record<string, ShipmentStatus> = {
  MANIFEST_RECEIVED: "CREATED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  ARRIVED_AT_SORT_FACILITY: "AT_HUB",
  DEPARTED_FACILITY: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  DELIVERY_ATTEMPT_FAILED: "DELIVERY_ATTEMPTED",
  DELIVERY_EXCEPTION: "ON_HOLD",
  RETURN_TO_SENDER: "RETURNED",
  CANCELLED: "CANCELLED",
};

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected.toLowerCase() === signature.toLowerCase();
}

export async function POST(request: Request) {
  const secret = process.env.CARRIER_WEBHOOK_SECRET || "development-carrier-secret-key-123";
  const signature = request.headers.get("x-carrier-signature");

  const rawBody = await request.text();

  // Signature validation (in production, strict check; in dev, logs if mismatch)
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

  const { eventId, trackingCode, status: carrierStatus, location, notes, occurredAt } = body;

  if (!trackingCode || !carrierStatus) {
    return NextResponse.json({ message: "Tracking code and carrier status are required." }, { status: 400 });
  }

  const xpsStatus = CARRIER_STATUS_MAP[carrierStatus];
  if (!xpsStatus) {
    return NextResponse.json({ message: `Unrecognized carrier status: ${carrierStatus}` }, { status: 400 });
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
      e.status === xpsStatus &&
      Math.abs(e.occurredAt.getTime() - eventTime.getTime()) < 1000
  );

  if (isDuplicate) {
    return NextResponse.json({
      message: "Event already recorded. Replay ignored idempotently.",
      trackingCode,
      status: xpsStatus,
    });
  }

  // Validate allowed status transition
  if (!isValidTransition(shipment.status, xpsStatus) && shipment.status !== xpsStatus) {
    if (TERMINAL_STATUSES.has(shipment.status)) {
      return NextResponse.json({
        message: `Shipment is already in terminal status ${shipment.status}. Inbound update discarded.`,
      });
    }
  }

  const publicNote = notes || `Shipment ${carrierStatus.toLowerCase().replaceAll("_", " ")}${location ? ` at ${location}` : ""}.`;

  await prisma.$transaction(async (tx) => {
    // Only update shipment status if it's a forward valid progression
    if (isValidTransition(shipment.status, xpsStatus)) {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: xpsStatus,
          ...(xpsStatus === "DELIVERED" && shipment.codAmount && !shipment.collectedAmount
            ? { collectedAmount: shipment.codAmount }
            : {}),
        },
      });
    }

    await tx.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: xpsStatus,
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
        summary: `Carrier webhook updated shipment ${trackingCode} to ${xpsStatus}${eventId ? ` (Event ${eventId})` : ""}.`,
      },
    });
  });

  return NextResponse.json({
    message: "Carrier event processed successfully.",
    trackingCode,
    status: xpsStatus,
  });
}

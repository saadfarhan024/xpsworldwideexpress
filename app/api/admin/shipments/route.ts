import { NextResponse } from "next/server";
import type { ShipmentStatus } from "@prisma/client";
import { getCurrentUser, isOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isValidTransition, TERMINAL_STATUSES, formatStatusLabel } from "@/lib/shipments";

const validStatuses = new Set([
  "CREATED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_ATTEMPTED",
  "ON_HOLD",
  "RETURNED",
  "CANCELLED",
]);

async function getOperationsStaff() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isOperationsOrAdmin(user.role)) {
    return null;
  }
  return user;
}

export async function GET(request: Request) {
  const staff = await getOperationsStaff();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const merchantIdParam = url.searchParams.get("merchantId");
  const cityParam = url.searchParams.get("city");
  const queryParam = url.searchParams.get("q")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") ?? 50)));

  const where: {
    status?: ShipmentStatus;
    merchantId?: string;
    destinationCity?: string;
    OR?: Array<{
      trackingCode?: { contains: string; mode: "insensitive" };
      recipientName?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (statusParam && statusParam !== "ALL" && validStatuses.has(statusParam)) {
    where.status = statusParam as ShipmentStatus;
  }
  if (merchantIdParam && merchantIdParam !== "ALL") {
    where.merchantId = merchantIdParam;
  }
  if (cityParam && cityParam !== "ALL") {
    where.destinationCity = cityParam;
  }
  if (queryParam) {
    where.OR = [
      { trackingCode: { contains: queryParam, mode: "insensitive" } },
      { recipientName: { contains: queryParam, mode: "insensitive" } },
    ];
  }

  const [shipments, totalCount, merchants] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        id: true,
        trackingCode: true,
        status: true,
        recipientName: true,
        recipientPhone: true,
        deliveryAddress: true,
        destinationCity: true,
        itemDescription: true,
        pieces: true,
        codAmount: true,
        collectedAmount: true,
        createdAt: true,
        updatedAt: true,
        merchant: { select: { id: true, companyName: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
    prisma.merchantProfile.findMany({
      where: { user: { status: "ACTIVE" } },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return NextResponse.json({
    shipments,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    merchants,
  });
}

export async function PATCH(request: Request) {
  const staff = await getOperationsStaff();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let input: {
    trackingCode?: unknown;
    status?: unknown;
    location?: unknown;
    publicNote?: unknown;
    internalNote?: unknown;
    collectedAmount?: unknown;
    forceOverride?: unknown;
  };

  try {
    input = (await request.json()) as typeof input;
  } catch {
    return NextResponse.json({ message: "Invalid shipment update." }, { status: 400 });
  }

  const trackingCode = typeof input.trackingCode === "string" ? input.trackingCode.trim().toUpperCase() : "";
  const targetStatus = typeof input.status === "string" ? (input.status as ShipmentStatus) : null;
  const location = typeof input.location === "string" ? input.location.trim().slice(0, 120) : "";
  const publicNote = typeof input.publicNote === "string" ? input.publicNote.trim().slice(0, 500) : "";
  const internalNote = typeof input.internalNote === "string" ? input.internalNote.trim().slice(0, 1000) : "";
  const forceOverride = input.forceOverride === true && staff.role === "ADMIN";

  if (!trackingCode || !targetStatus || !validStatuses.has(targetStatus) || !publicNote) {
    return NextResponse.json({ message: "Select a status and provide a customer tracking update." }, { status: 400 });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode },
    select: { id: true, status: true, codAmount: true, collectedAmount: true },
  });
  if (!shipment) return NextResponse.json({ message: "Shipment not found." }, { status: 404 });

  // Enforce server-side lifecycle transitions
  if (!forceOverride && !isValidTransition(shipment.status, targetStatus)) {
    return NextResponse.json(
      {
        message: `Invalid status transition: Cannot transition from ${formatStatusLabel(
          shipment.status
        )} to ${formatStatusLabel(targetStatus)}.`,
      },
      { status: 400 }
    );
  }

  // Check terminal state
  if (!forceOverride && TERMINAL_STATUSES.has(shipment.status) && shipment.status !== targetStatus) {
    return NextResponse.json(
      {
        message: `Shipment is in terminal state (${formatStatusLabel(
          shipment.status
        )}). Only Administrators can override this status.`,
      },
      { status: 400 }
    );
  }

  // Handle COD auto-collection upon DELIVERED
  let finalCollectedAmount = shipment.collectedAmount;
  if (targetStatus === "DELIVERED") {
    if (input.collectedAmount != null && input.collectedAmount !== "") {
      const parsed = Number(input.collectedAmount);
      if (Number.isFinite(parsed) && parsed >= 0) {
        finalCollectedAmount = parsed as unknown as typeof shipment.collectedAmount;
      }
    } else if (shipment.codAmount && !shipment.collectedAmount) {
      finalCollectedAmount = shipment.codAmount;
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.shipment.update({
      where: { id: shipment.id },
      data: {
        status: targetStatus,
        collectedAmount: finalCollectedAmount,
      },
    });
    await transaction.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: targetStatus,
        location: location || null,
        publicNote,
        internalNote: internalNote || null,
        actorId: staff.id,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: staff.id,
        action: "SHIPMENT_STATUS_UPDATED",
        entityType: "Shipment",
        entityId: shipment.id,
        summary: `Shipment ${trackingCode} transitioned from ${shipment.status} to ${targetStatus}.`,
      },
    });
  });

  return NextResponse.json({ message: "Shipment status updated." });
}

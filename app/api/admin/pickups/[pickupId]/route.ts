import { NextResponse } from "next/server";
import { getCurrentUser, isOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendPickupUpdateEmail } from "@/lib/email";
import type { PickupStatus } from "@prisma/client";

async function requireOperationsAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isOperationsOrAdmin(user.role)) {
    return null;
  }
  return user;
}

const validStatuses = new Set(["REQUESTED", "SCHEDULED", "ASSIGNED", "COMPLETED", "CANCELLED", "FAILED"]);

type RouteContext = { params: Promise<{ pickupId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await requireOperationsAccess();
  if (!actor) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const { pickupId } = await context.params;

  let body: {
    status?: unknown;
    assignedToId?: unknown;
    requestedFor?: unknown;
    timeWindow?: unknown;
    note?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid update data." }, { status: 400 });
  }

  const pickup = await prisma.pickupRequest.findUnique({
    where: { id: pickupId },
    include: {
      merchant: {
        include: { user: { select: { email: true } } },
      },
      shipments: {
        include: { shipment: true },
      },
    },
  });

  if (!pickup) {
    return NextResponse.json({ message: "Pickup request not found." }, { status: 404 });
  }

  const newStatus = typeof body.status === "string" && validStatuses.has(body.status)
    ? (body.status as PickupStatus)
    : pickup.status;

  const assignedToId =
    body.assignedToId === null || body.assignedToId === ""
      ? null
      : typeof body.assignedToId === "string"
      ? body.assignedToId
      : pickup.assignedToId;

  const timeWindow = typeof body.timeWindow === "string" ? body.timeWindow.trim() || null : pickup.timeWindow;
  const note = typeof body.note === "string" ? body.note.trim() || null : pickup.note;
  const requestedFor =
    typeof body.requestedFor === "string"
      ? body.requestedFor.trim()
        ? new Date(body.requestedFor)
        : null
      : pickup.requestedFor;

  // Validate assignee if provided
  if (assignedToId && assignedToId !== pickup.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: assignedToId, role: { in: ["OPERATIONS", "ADMIN"] }, status: "ACTIVE" },
    });
    if (!assignee) {
      return NextResponse.json({ message: "Assigned staff member not found." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.pickupRequest.update({
      where: { id: pickup.id },
      data: {
        status: newStatus,
        assignedToId,
        timeWindow,
        requestedFor,
        note,
      },
    });

    const linkedShipments = pickup.shipments.map((ps) => ps.shipment);

    if (newStatus === "COMPLETED" && pickup.status !== "COMPLETED") {
      for (const s of linkedShipments) {
        if (s.status === "PICKUP_SCHEDULED" || s.status === "CREATED") {
          await tx.shipment.update({
            where: { id: s.id },
            data: { status: "PICKED_UP" },
          });
          await tx.trackingEvent.create({
            data: {
              shipmentId: s.id,
              status: "PICKED_UP",
              publicNote: "Shipment collected by XPS courier.",
              internalNote: note ?? "Pickup marked complete.",
              actorId: actor.id,
            },
          });
        }
      }
    } else if (newStatus === "FAILED" && pickup.status !== "FAILED") {
      for (const s of linkedShipments) {
        if (s.status === "PICKUP_SCHEDULED") {
          await tx.shipment.update({
            where: { id: s.id },
            data: { status: "CREATED" },
          });
          await tx.trackingEvent.create({
            data: {
              shipmentId: s.id,
              status: "CREATED",
              publicNote: `Pickup attempt unsuccessful${note ? `: ${note}` : "."}`,
              internalNote: note,
              actorId: actor.id,
            },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "PICKUP_STATUS_UPDATED",
        entityType: "PickupRequest",
        entityId: pickup.id,
        summary: `Pickup request ${pickup.id} updated to ${newStatus}.`,
      },
    });
  });

  // Send email notification to merchant on status/schedule update
  if (pickup.merchant.user.email) {
    try {
      const scheduleText = requestedFor ? `${requestedFor.toLocaleDateString()}${timeWindow ? ` (${timeWindow})` : ""}` : undefined;
      await sendPickupUpdateEmail({
        to: pickup.merchant.user.email,
        contactName: pickup.merchant.contactName,
        pickupId: pickup.id,
        status: newStatus,
        scheduleDetails: scheduleText,
        note: note ?? undefined,
      });
    } catch (err) {
      console.error("Pickup update email failed:", err);
    }
  }

  return NextResponse.json({ message: "Pickup request updated successfully." });
}

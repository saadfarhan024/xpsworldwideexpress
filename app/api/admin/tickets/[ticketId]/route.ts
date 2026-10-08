import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendTicketReplyEmail } from "@/lib/email";
import type { TicketStatus } from "@prisma/client";

async function requireStaffAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isStaff(user.role)) {
    return null;
  }
  return user;
}

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const staff = await requireStaffAccess();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { ticketId } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      merchant: {
        include: { user: { select: { email: true } } },
      },
      assignedTo: { select: { id: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  let linkedShipmentCode: string | null = null;
  if (ticket.shipmentId) {
    const s = await prisma.shipment.findUnique({
      where: { id: ticket.shipmentId },
      select: { trackingCode: true },
    });
    linkedShipmentCode = s?.trackingCode ?? null;
  }

  return NextResponse.json({ ticket: { ...ticket, linkedShipmentCode } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const staff = await requireStaffAccess();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { ticketId } = await context.params;

  let body: {
    status?: unknown;
    priority?: unknown;
    assignedToId?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  const validStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];
  const newStatus =
    typeof body.status === "string" && validStatuses.includes(body.status as TicketStatus)
      ? (body.status as TicketStatus)
      : ticket.status;

  const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
  const newPriority =
    typeof body.priority === "string" && validPriorities.includes(body.priority)
      ? body.priority
      : ticket.priority;

  const newAssignedToId =
    body.assignedToId === "" || body.assignedToId === null
      ? null
      : typeof body.assignedToId === "string"
      ? body.assignedToId
      : ticket.assignedToId;

  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: newStatus,
        priority: newPriority,
        assignedToId: newAssignedToId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: staff.id,
        action: "SUPPORT_TICKET_UPDATED",
        entityType: "SupportTicket",
        entityId: ticket.id,
        summary: `Support ticket updated (Status: ${newStatus}, Priority: ${newPriority}).`,
      },
    });
  });

  return NextResponse.json({ message: "Ticket updated successfully." });
}

export async function POST(request: Request, context: RouteContext) {
  const staff = await requireStaffAccess();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { ticketId } = await context.params;

  let body: { message?: unknown; internal?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid message body." }, { status: 400 });
  }

  const messageText = typeof body.message === "string" ? body.message.trim() : "";
  const internal = body.internal === true;

  if (!messageText) {
    return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      merchant: {
        include: { user: { select: { email: true } } },
      },
    },
  });
  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: staff.id,
        body: messageText,
        internal,
      },
    });

    // If staff posted a public reply, automatically set ticket to WAITING_ON_CUSTOMER
    if (!internal && (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS")) {
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: { status: "WAITING_ON_CUSTOMER" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: staff.id,
        action: internal ? "SUPPORT_INTERNAL_NOTE_ADDED" : "SUPPORT_PUBLIC_REPLY_SENT",
        entityType: "SupportTicket",
        entityId: ticket.id,
        summary: internal ? "Staff added private internal note." : "Staff sent reply to merchant.",
      },
    });
  });

  // If public reply, notify merchant via email
  if (!internal && ticket.merchant.user.email) {
    try {
      await sendTicketReplyEmail({
        to: ticket.merchant.user.email,
        contactName: ticket.merchant.contactName,
        ticketSubject: ticket.subject,
        ticketId: ticket.id,
        replySnippet: messageText.slice(0, 150),
      });
    } catch (err) {
      console.error("Failed to send ticket reply email:", err);
    }
  }

  return NextResponse.json({ message: internal ? "Internal note saved." : "Reply sent to merchant." });
}

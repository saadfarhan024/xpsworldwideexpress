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

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { ticketId } = await context.params;

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      merchantId: user.merchantProfile.id,
    },
    include: {
      messages: {
        // STRICT: Never leak internal staff notes to merchants
        where: { internal: false },
        orderBy: { createdAt: "asc" },
      },
      assignedTo: { select: { email: true } },
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

  return NextResponse.json({
    ticket: {
      ...ticket,
      linkedShipmentCode,
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { ticketId } = await context.params;

  let body: { message?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid message body." }, { status: 400 });
  }

  const messageText = typeof body.message === "string" ? body.message.trim() : "";
  if (!messageText) {
    return NextResponse.json({ message: "Message content cannot be empty." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      merchantId: user.merchantProfile.id,
    },
  });

  if (!ticket) return NextResponse.json({ message: "Ticket not found." }, { status: 404 });

  if (ticket.status === "CLOSED") {
    return NextResponse.json(
      { message: "This ticket has been closed. Please open a new ticket for new inquiries." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: user.id,
        body: messageText,
        internal: false,
      },
    });

    const newStatus =
      ticket.status === "RESOLVED" || ticket.status === "WAITING_ON_CUSTOMER"
        ? "OPEN"
        : ticket.status;

    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: { status: newStatus },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "SUPPORT_TICKET_REPLIED",
        entityType: "SupportTicket",
        entityId: ticket.id,
        summary: "Merchant submitted reply to ticket.",
      },
    });
  });

  return NextResponse.json({ message: "Reply submitted." });
}

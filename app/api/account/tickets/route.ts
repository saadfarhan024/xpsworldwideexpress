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
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const tickets = await prisma.supportTicket.findMany({
    where: { merchantId: user.merchantProfile.id },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      shipmentId: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: { select: { email: true } },
      _count: {
        select: {
          messages: { where: { internal: false } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let body: {
    subject?: unknown;
    message?: unknown;
    trackingCode?: unknown;
    priority?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid ticket data." }, { status: 400 });
  }

  const subject = clean(body.subject);
  const messageText = clean(body.message);
  const trackingCode = clean(body.trackingCode).toUpperCase();
  const priority = ["LOW", "NORMAL", "HIGH", "URGENT"].includes(clean(body.priority))
    ? clean(body.priority)
    : "NORMAL";

  if (!subject || !messageText) {
    return NextResponse.json({ message: "Subject and message are required." }, { status: 400 });
  }

  let shipmentId: string | null = null;
  if (trackingCode) {
    const shipment = await prisma.shipment.findFirst({
      where: { trackingCode, merchantId: user.merchantProfile.id },
      select: { id: true },
    });
    if (shipment) shipmentId = shipment.id;
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicket.create({
      data: {
        merchantId: user.merchantProfile!.id,
        subject,
        status: "OPEN",
        priority,
        shipmentId,
        messages: {
          create: {
            authorId: user.id,
            body: messageText,
            internal: false,
          },
        },
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "SUPPORT_TICKET_CREATED",
        entityType: "SupportTicket",
        entityId: created.id,
        summary: `Support ticket created: ${subject.slice(0, 80)}`,
      },
    });

    return created;
  });

  return NextResponse.json({ ticket, message: "Ticket created successfully." }, { status: 201 });
}

import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { TicketStatus } from "@prisma/client";

async function requireStaffAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isStaff(user.role)) {
    return null;
  }
  return user;
}

export async function GET(request: Request) {
  const staff = await requireStaffAccess();
  if (!staff) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const priorityParam = url.searchParams.get("priority");

  const where: {
    status?: TicketStatus;
    priority?: string;
  } = {};

  if (statusParam && statusParam !== "ALL") {
    where.status = statusParam as TicketStatus;
  }
  if (priorityParam && priorityParam !== "ALL") {
    where.priority = priorityParam;
  }

  const [tickets, staffMembers] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phone: true,
            user: { select: { email: true } },
          },
        },
        assignedTo: { select: { id: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPPORT", "OPERATIONS"] },
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" },
    }),
  ]);

  return NextResponse.json({ tickets, staffMembers });
}

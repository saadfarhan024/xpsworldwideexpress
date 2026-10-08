import { NextResponse } from "next/server";
import { getCurrentUser, isOperationsOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { PickupStatus } from "@prisma/client";

async function requireOperationsAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isOperationsOrAdmin(user.role)) {
    return null;
  }
  return user;
}

export async function GET(request: Request) {
  const actor = await requireOperationsAccess();
  if (!actor) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const merchantIdParam = url.searchParams.get("merchantId");

  const whereClause: {
    status?: PickupStatus;
    merchantId?: string;
  } = {};

  if (statusParam && statusParam !== "ALL") {
    whereClause.status = statusParam as PickupStatus;
  }
  if (merchantIdParam && merchantIdParam !== "ALL") {
    whereClause.merchantId = merchantIdParam;
  }

  const [pickups, staffMembers, merchants] = await Promise.all([
    prisma.pickupRequest.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phone: true,
            city: true,
            user: { select: { email: true } },
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
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
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["OPERATIONS", "ADMIN"] },
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" },
    }),
    prisma.merchantProfile.findMany({
      where: { user: { status: "ACTIVE" } },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  return NextResponse.json({ pickups, staffMembers, merchants });
}

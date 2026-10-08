import { NextResponse } from "next/server";
import { getCurrentUser, isFinanceOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import type { RemittanceStatus } from "@prisma/client";

async function requireFinanceAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isFinanceOrAdmin(user.role)) {
    return null;
  }
  return user;
}

export async function GET(request: Request) {
  const actor = await requireFinanceAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");

  const batchWhere: { status?: RemittanceStatus } = {};
  if (statusParam && statusParam !== "ALL") {
    batchWhere.status = statusParam as RemittanceStatus;
  }

  const [batches, unreconciledShipments] = await Promise.all([
    prisma.remittance.findMany({
      where: batchWhere,
      include: {
        merchant: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            user: { select: { email: true } },
            bankDetail: { select: { bankName: true, accountTitle: true } },
          },
        },
        _count: { select: { shipments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.findMany({
      where: {
        status: "DELIVERED",
        codAmount: { gt: 0 },
        remittanceId: null,
      },
      select: {
        id: true,
        merchantId: true,
        trackingCode: true,
        recipientName: true,
        destinationCity: true,
        codAmount: true,
        collectedAmount: true,
        updatedAt: true,
        merchant: { select: { id: true, companyName: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  // Group unreconciled shipments by merchant
  const unreconciledByMerchantMap = new Map<
    string,
    {
      merchantId: string;
      companyName: string;
      shipmentCount: number;
      totalAmount: number;
      shipments: typeof unreconciledShipments;
    }
  >();

  for (const s of unreconciledShipments) {
    const amount = Number(s.collectedAmount ?? s.codAmount ?? 0);
    const existing = unreconciledByMerchantMap.get(s.merchantId) ?? {
      merchantId: s.merchantId,
      companyName: s.merchant.companyName,
      shipmentCount: 0,
      totalAmount: 0,
      shipments: [],
    };
    existing.shipmentCount += 1;
    existing.totalAmount += amount;
    existing.shipments.push(s);
    unreconciledByMerchantMap.set(s.merchantId, existing);
  }

  return NextResponse.json({
    batches,
    unreconciledMerchants: Array.from(unreconciledByMerchantMap.values()),
  });
}

export async function POST(request: Request) {
  const actor = await requireFinanceAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let body: {
    merchantId?: unknown;
    periodStart?: unknown;
    periodEnd?: unknown;
    shipmentIds?: unknown;
    notes?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid batch creation request." }, { status: 400 });
  }

  const merchantId = typeof body.merchantId === "string" ? body.merchantId : "";
  if (!merchantId) {
    return NextResponse.json({ message: "Merchant is required." }, { status: 400 });
  }

  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: { id: true, companyName: true },
  });
  if (!merchant) {
    return NextResponse.json({ message: "Merchant not found." }, { status: 404 });
  }

  // Find eligible unreconciled delivered COD shipments
  const shipmentIds: string[] = Array.isArray(body.shipmentIds)
    ? body.shipmentIds.filter((id): id is string => typeof id === "string")
    : [];

  const whereShipments = {
    merchantId,
    status: "DELIVERED" as const,
    codAmount: { gt: 0 },
    remittanceId: null,
    ...(shipmentIds.length > 0 ? { id: { in: shipmentIds } } : {}),
  };

  const eligible = await prisma.shipment.findMany({
    where: whereShipments,
    select: { id: true, collectedAmount: true, codAmount: true, trackingCode: true },
  });

  if (eligible.length === 0) {
    return NextResponse.json(
      { message: "No unreconciled delivered COD shipments available for this merchant." },
      { status: 400 }
    );
  }

  const totalAmount = eligible.reduce((sum, s) => {
    return sum + Number(s.collectedAmount ?? s.codAmount ?? 0);
  }, 0);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reference = `REM-${dateStr}-${randomBytes(3).toString("hex").toUpperCase()}`;

  const periodStart =
    typeof body.periodStart === "string" && body.periodStart
      ? new Date(body.periodStart)
      : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const periodEnd =
    typeof body.periodEnd === "string" && body.periodEnd ? new Date(body.periodEnd) : now;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.remittance.create({
      data: {
        merchantId,
        reference,
        amount: totalAmount,
        status: "RECONCILED",
        periodStart,
        periodEnd,
        notes,
      },
    });

    // Atomically link shipments to this batch preventing double counting
    await tx.shipment.updateMany({
      where: { id: { in: eligible.map((s) => s.id) } },
      data: { remittanceId: created.id },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "REMITTANCE_BATCH_CREATED",
        entityType: "Remittance",
        entityId: created.id,
        summary: `Created remittance batch ${reference} for ${merchant.companyName} with ${eligible.length} shipments (Total PKR ${totalAmount.toFixed(2)}).`,
      },
    });

    return created;
  });

  return NextResponse.json({ batch, message: `Created remittance batch ${reference}.` }, { status: 201 });
}

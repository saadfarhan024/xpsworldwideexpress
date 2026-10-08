import { NextResponse } from "next/server";
import { getCurrentUser, isFinanceOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { maskSecret } from "@/lib/uploads";
import { decryptField } from "@/lib/auth/crypto";
import type { RemittanceStatus } from "@prisma/client";

async function requireFinanceAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isFinanceOrAdmin(user.role)) {
    return null;
  }
  return user;
}

type RouteContext = { params: Promise<{ remittanceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const actor = await requireFinanceAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { remittanceId } = await context.params;

  const batch = await prisma.remittance.findUnique({
    where: { id: remittanceId },
    include: {
      merchant: {
        include: {
          user: { select: { email: true } },
          bankDetail: true,
        },
      },
      shipments: {
        select: {
          id: true,
          trackingCode: true,
          recipientName: true,
          destinationCity: true,
          codAmount: true,
          collectedAmount: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!batch) return NextResponse.json({ message: "Batch not found." }, { status: 404 });

  let maskedAccount: string | null = null;
  let maskedIban: string | null = null;
  if (batch.merchant.bankDetail?.encryptedAccountNumber) {
    try {
      maskedAccount = maskSecret(decryptField(batch.merchant.bankDetail.encryptedAccountNumber));
    } catch {}
  }
  if (batch.merchant.bankDetail?.encryptedIban) {
    try {
      maskedIban = maskSecret(decryptField(batch.merchant.bankDetail.encryptedIban));
    } catch {}
  }

  return NextResponse.json({
    batch: {
      ...batch,
      merchant: {
        id: batch.merchant.id,
        companyName: batch.merchant.companyName,
        contactName: batch.merchant.contactName,
        phone: batch.merchant.phone,
        email: batch.merchant.user.email,
        bank: batch.merchant.bankDetail
          ? {
              bankName: batch.merchant.bankDetail.bankName,
              accountTitle: batch.merchant.bankDetail.accountTitle,
              accountNumberMasked: maskedAccount,
              ibanMasked: maskedIban,
            }
          : null,
      },
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await requireFinanceAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { remittanceId } = await context.params;

  let body: {
    status?: unknown;
    payoutReference?: unknown;
    notes?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const batch = await prisma.remittance.findUnique({
    where: { id: remittanceId },
    include: { shipments: { select: { id: true } } },
  });

  if (!batch) return NextResponse.json({ message: "Remittance batch not found." }, { status: 404 });

  const newStatus = typeof body.status === "string" ? (body.status as RemittanceStatus) : batch.status;
  const payoutReference =
    typeof body.payoutReference === "string" ? body.payoutReference.trim() || null : batch.payoutReference;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : batch.notes;

  await prisma.$transaction(async (tx) => {
    if (newStatus === "CANCELLED" && batch.status !== "CANCELLED") {
      // Unlink shipments atomically so they can be reconciled in another batch
      await tx.shipment.updateMany({
        where: { remittanceId: batch.id },
        data: { remittanceId: null },
      });
    }

    await tx.remittance.update({
      where: { id: batch.id },
      data: {
        status: newStatus,
        payoutReference,
        notes,
        paidAt: newStatus === "PAID" && !batch.paidAt ? new Date() : batch.paidAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: `REMITTANCE_${newStatus}`,
        entityType: "Remittance",
        entityId: batch.id,
        summary: `Remittance batch ${batch.reference} updated to ${newStatus}${
          payoutReference ? ` (Ref: ${payoutReference})` : ""
        }.`,
      },
    });
  });

  return NextResponse.json({ message: `Remittance batch updated to ${newStatus}.` });
}

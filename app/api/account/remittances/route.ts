import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const remittances = await prisma.remittance.findMany({
    where: { merchantId: user.merchantProfile.id },
    select: {
      id: true,
      reference: true,
      status: true,
      amount: true,
      periodStart: true,
      periodEnd: true,
      paidAt: true,
      payoutReference: true,
      notes: true,
      createdAt: true,
      _count: { select: { shipments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ remittances });
}

import { NextResponse } from "next/server";
import { isFinanceOrAdmin, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isFinanceOrAdmin(user.role)) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const merchants = await prisma.merchantProfile.findMany({
    where: { user: { role: "MERCHANT", status: { in: ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"] } } },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      city: true,
      phone: true,
      bankDetail: { select: { id: true } },
      user: { select: { email: true, status: true } },
    },
    orderBy: { companyName: "asc" },
  });

  return NextResponse.json({
    merchants: merchants.map((merchant) => ({
      id: merchant.id,
      companyName: merchant.companyName,
      contactName: merchant.contactName,
      city: merchant.city,
      phone: merchant.phone,
      email: merchant.user.email,
      status: merchant.user.status,
      hasBankDetail: Boolean(merchant.bankDetail),
    })),
  });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const shipments = await prisma.shipment.findMany({
    where: {
      merchantId: user.merchantProfile.id,
      status: "CREATED",
    },
    select: {
      id: true,
      trackingCode: true,
      recipientName: true,
      destinationCity: true,
      pieces: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ shipments });
}

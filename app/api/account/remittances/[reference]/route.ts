import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const { reference } = await context.params;

  const remittance = await prisma.remittance.findFirst({
    where: {
      reference,
      merchantId: user.merchantProfile.id,
    },
    include: {
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
      merchant: {
        select: {
          companyName: true,
          contactName: true,
          pickupAddress: true,
          city: true,
          phone: true,
        },
      },
    },
  });

  if (!remittance) {
    return NextResponse.json({ message: "Statement not found." }, { status: 404 });
  }

  return NextResponse.json({ remittance });
}

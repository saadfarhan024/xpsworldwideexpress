import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  const shipments = await prisma.shipment.findMany({
    where: { merchantId: user.merchantProfile.id },
    select: {
      trackingCode: true,
      recipientName: true,
      recipientPhone: true,
      deliveryAddress: true,
      destinationCity: true,
      itemDescription: true,
      pieces: true,
      codAmount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Tracking Code",
    "Recipient Name",
    "Recipient Phone",
    "Delivery Address",
    "Destination City",
    "Item Description",
    "Pieces",
    "COD Amount (PKR)",
    "Status",
    "Created Date",
  ];

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const str = String(val).replaceAll('"', '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.join(","),
    ...shipments.map((s) =>
      [
        escapeCsv(s.trackingCode),
        escapeCsv(s.recipientName),
        escapeCsv(s.recipientPhone),
        escapeCsv(s.deliveryAddress),
        escapeCsv(s.destinationCity),
        escapeCsv(s.itemDescription ?? ""),
        escapeCsv(s.pieces),
        escapeCsv(s.codAmount ? Number(s.codAmount).toFixed(2) : "0.00"),
        escapeCsv(s.status),
        escapeCsv(s.createdAt.toISOString()),
      ].join(",")
    ),
  ];

  const csvContent = csvRows.join("\r\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gde-shipments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

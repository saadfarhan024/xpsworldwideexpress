import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateTrackingCode } from "@/lib/shipments";

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r" || char === "\n") {
        if (char === "\r" && nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  let csvText = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Please provide a valid CSV file." }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    try {
      const json = await request.json() as { csv?: string };
      csvText = json.csv ?? "";
    } catch {
      return NextResponse.json({ message: "Invalid request format." }, { status: 400 });
    }
  }

  if (!csvText.trim()) {
    return NextResponse.json({ message: "CSV content is empty." }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json({ message: "CSV must contain a header row and at least one data row." }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const getColIdx = (...candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const recipientIdx = getColIdx("recipientname", "receivername", "recipient", "receiver", "name", "customer");
  const phoneIdx = getColIdx("recipientphone", "receiverphone", "phone", "contact", "mobile");
  const addressIdx = getColIdx("deliveryaddress", "receiveraddress", "address", "destinationaddress");
  const cityIdx = getColIdx("destinationcity", "deliverycity", "city", "destination");
  const piecesIdx = getColIdx("pieces", "parcels", "quantity", "qty");
  const codIdx = getColIdx("codamount", "cod", "cashondelivery", "amount");
  const descIdx = getColIdx("itemdescription", "productdescription", "description", "items", "item");

  if (recipientIdx === -1 || phoneIdx === -1 || addressIdx === -1 || cityIdx === -1) {
    return NextResponse.json(
      {
        message:
          "CSV is missing required columns. Ensure headers include: Recipient Name, Recipient Phone, Delivery Address, Destination City.",
      },
      { status: 400 }
    );
  }

  const validShipments: Array<{
    recipientName: string;
    recipientPhone: string;
    deliveryAddress: string;
    destinationCity: string;
    pieces: number;
    codAmount: number | null;
    itemDescription: string | null;
    trackingCode: string;
  }> = [];

  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 1;
    const recipientName = row[recipientIdx] ?? "";
    const recipientPhone = row[phoneIdx] ?? "";
    const deliveryAddress = row[addressIdx] ?? "";
    const destinationCity = row[cityIdx] ?? "";
    const rawPieces = piecesIdx !== -1 ? row[piecesIdx] : "1";
    const rawCod = codIdx !== -1 ? row[codIdx] : "";
    const itemDescription = descIdx !== -1 ? row[descIdx] || null : null;

    if (!recipientName || !recipientPhone || !deliveryAddress || !destinationCity) {
      errors.push(`Row ${lineNum}: Missing required recipient or delivery information.`);
      continue;
    }

    const pieces = Math.max(1, Math.min(100, parseInt(rawPieces, 10) || 1));
    let codAmount: number | null = null;
    if (rawCod) {
      const parsedCod = parseFloat(rawCod.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(parsedCod) && parsedCod >= 0) {
        codAmount = parsedCod;
      }
    }

    const trackingCode = generateTrackingCode();

    validShipments.push({
      recipientName,
      recipientPhone,
      deliveryAddress,
      destinationCity,
      pieces,
      codAmount,
      itemDescription,
      trackingCode,
    });
  }

  if (validShipments.length === 0) {
    return NextResponse.json(
      {
        message: "No valid shipment rows found in CSV.",
        errors,
      },
      { status: 400 }
    );
  }

  const createdCount = await prisma.$transaction(async (tx) => {
    let count = 0;
    for (const item of validShipments) {
      await tx.shipment.create({
        data: {
          merchantId: user.merchantProfile!.id,
          trackingCode: item.trackingCode,
          recipientName: item.recipientName,
          recipientPhone: item.recipientPhone,
          deliveryAddress: item.deliveryAddress,
          destinationCity: item.destinationCity,
          itemDescription: item.itemDescription,
          pieces: item.pieces,
          codAmount: item.codAmount,
          status: "CREATED",
          carrierStatus: "NEW_BOOKED",
          events: {
            create: {
              status: "CREATED",
              carrierStatus: "NEW_BOOKED",
              publicNote: "Shipment registered via bulk CSV import.",
              actorId: user.id,
            },
          },
        },
      });
      count++;
    }

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "SHIPMENTS_BULK_IMPORTED",
        entityType: "Shipment",
        entityId: user.merchantProfile!.id,
        summary: `Imported ${count} shipments via CSV.`,
      },
    });

    return count;
  });

  return NextResponse.json({
    message: `Successfully imported ${createdCount} shipment(s).`,
    importedCount: createdCount,
    errors: errors.slice(0, 10),
  });
}

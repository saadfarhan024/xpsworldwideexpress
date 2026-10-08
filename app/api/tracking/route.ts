import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { prisma } from "@/lib/db";

const trackingCodePattern = /^[A-Z0-9-]{4,40}$/;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`tracking:ip:${ip}`, RATE_LIMITS.tracking.limit, RATE_LIMITS.tracking.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  const url = new URL(request.url);
  const requestedCodes = (url.searchParams.get("codes") ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  const codes = [...new Set(requestedCodes)];

  if (codes.length === 0 || requestedCodes.length > 10 || codes.some((code) => !trackingCodePattern.test(code))) {
    return NextResponse.json({ message: "Enter between 1 and 10 valid tracking codes." }, { status: 400 });
  }

  const shipments = await prisma.shipment.findMany({
    where: { trackingCode: { in: codes } },
    select: {
      trackingCode: true,
      status: true,
      destinationCity: true,
      publicSummary: true,
      createdAt: true,
      updatedAt: true,
      events: {
        select: { status: true, location: true, publicNote: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
      },
    },
  });

  const byCode = new Map(shipments.map((shipment) => [shipment.trackingCode, shipment]));
  return NextResponse.json({ results: codes.map((code) => ({ code, shipment: byCode.get(code) ?? null })) });
}

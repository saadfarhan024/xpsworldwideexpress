import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus = "unreachable";
  let dbLatencyMs = 0;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "healthy";
  } catch {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "healthy";

  const statusReport = {
    status: isHealthy ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      emailDelivery: {
        configured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      },
      encryption: {
        configured: Boolean(process.env.FIELD_ENCRYPTION_KEY),
      },
    },
  };

  return NextResponse.json(statusReport, { status: isHealthy ? 200 : 503 });
}

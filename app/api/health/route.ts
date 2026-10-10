import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();
  let dbStatus = "unreachable";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "healthy";
  } catch {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "healthy";

  const statusReport = {
    status: isHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(statusReport, {
    status: isHealthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

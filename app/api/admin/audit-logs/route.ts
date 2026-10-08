import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const url = new URL(request.url);
  const actionParam = url.searchParams.get("action");
  const entityTypeParam = url.searchParams.get("entityType");
  const searchParam = url.searchParams.get("q")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") ?? 50)));

  const where: {
    action?: string;
    entityType?: string;
    summary?: { contains: string; mode: "insensitive" };
  } = {};

  if (actionParam && actionParam !== "ALL") where.action = actionParam;
  if (entityTypeParam && entityTypeParam !== "ALL") where.entityType = entityTypeParam;
  if (searchParam) where.summary = { contains: searchParam, mode: "insensitive" };

  const [logs, totalCount, distinctActions, distinctEntities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
    }),
    prisma.auditLog.findMany({
      select: { entityType: true },
      distinct: ["entityType"],
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    filterOptions: {
      actions: distinctActions.map((a) => a.action).sort(),
      entities: distinctEntities.map((e) => e.entityType).sort(),
    },
  });
}

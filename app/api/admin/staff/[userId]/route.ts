import { NextResponse } from "next/server";
import { getCurrentUser, revokeAllSessions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import type { AccountStatus, UserRole } from "@prisma/client";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") return null;
  return user;
}

const validStaffRoles: UserRole[] = ["OPERATIONS", "SUPPORT", "FINANCE", "ADMIN"];

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { userId } = await context.params;

  let body: {
    role?: unknown;
    status?: unknown;
    password?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return NextResponse.json({ message: "Staff user not found." }, { status: 404 });

  if (targetUser.id === admin.id && body.status === "SUSPENDED") {
    return NextResponse.json({ message: "You cannot suspend your own administrator account." }, { status: 400 });
  }

  const newRole =
    typeof body.role === "string" && validStaffRoles.includes(body.role as UserRole)
      ? (body.role as UserRole)
      : targetUser.role;

  const newStatus =
    body.status === "ACTIVE" || body.status === "SUSPENDED"
      ? (body.status as AccountStatus)
      : targetUser.status;

  let newPasswordHash: string | undefined = undefined;
  if (typeof body.password === "string" && body.password.trim()) {
    const passwordErr = validatePassword(body.password);
    if (passwordErr) return NextResponse.json({ message: passwordErr }, { status: 400 });
    newPasswordHash = await hashPassword(body.password);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUser.id },
      data: {
        role: newRole,
        status: newStatus,
        ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "STAFF_USER_UPDATED",
        entityType: "User",
        entityId: targetUser.id,
        summary: `Updated staff user ${targetUser.email} (Role: ${newRole}, Status: ${newStatus}).`,
      },
    });
  });

  // If suspended or password changed, safely revoke all active sessions immediately
  if (newStatus === "SUSPENDED" || newPasswordHash) {
    await revokeAllSessions(targetUser.id);
  }

  return NextResponse.json({ message: "Staff user updated." });
}

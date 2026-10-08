import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import type { UserRole } from "@prisma/client";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") return null;
  return user;
}

const validStaffRoles: UserRole[] = ["OPERATIONS", "SUPPORT", "FINANCE", "ADMIN"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: { role: { in: validStaffRoles } },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      mfaEnabledAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let body: { email?: unknown; password?: unknown; role?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid staff payload." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? (body.role as UserRole) : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Valid email address is required." }, { status: 400 });
  }

  if (!role || !validStaffRoles.includes(role)) {
    return NextResponse.json({ message: "Choose a valid staff role (OPERATIONS, SUPPORT, FINANCE, ADMIN)." }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ message: passwordError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "STAFF_USER_CREATED",
        entityType: "User",
        entityId: created.id,
        summary: `Created staff account ${email} with role ${role}.`,
      },
    });

    return created;
  });

  return NextResponse.json({ staff: newUser, message: "Staff account created successfully." }, { status: 201 });
}

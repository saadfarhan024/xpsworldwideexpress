import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "gde_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function createSession(userId: string) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { merchantProfile: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(isStaff(user.role) ? "/admin" : "/account");
  return user;
}

export async function requireAdminPortal() {
  const user = await requireUser();
  if (!isStaff(user.role)) {
    redirect(user.role === "MERCHANT" ? "/account" : "/login");
  }
  return user;
}

export const requireStaffPortal = requireAdminPortal;

export async function requireMerchant() {
  const user = await requireUser();
  if (user.role !== "MERCHANT" || !user.merchantProfile) redirect(isStaff(user.role) ? "/admin" : "/login");
  return user;
}

export async function requireFinanceOrAdmin() {
  const user = await requireUser();
  if (!isFinanceOrAdmin(user.role)) redirect(user.role === "MERCHANT" ? "/account" : "/admin");
  return user;
}

export async function requireOperationsOrAdmin() {
  const user = await requireUser();
  if (!isOperationsOrAdmin(user.role)) redirect(user.role === "MERCHANT" ? "/account" : "/admin");
  return user;
}

export async function requireSupportOrAdmin() {
  const user = await requireUser();
  if (!isSupportOrAdmin(user.role)) redirect(user.role === "MERCHANT" ? "/account" : "/admin");
  return user;
}

export function isStaff(role: UserRole | string) {
  return role === "ADMIN" || role === "OPERATIONS" || role === "SUPPORT" || role === "FINANCE";
}

export function isFinanceOrAdmin(role: UserRole | string) {
  return role === "ADMIN" || role === "FINANCE";
}

export function isOperationsOrAdmin(role: UserRole | string) {
  return role === "ADMIN" || role === "OPERATIONS";
}

export function isSupportOrAdmin(role: UserRole | string) {
  return role === "ADMIN" || role === "SUPPORT";
}

import { NextResponse } from "next/server";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser, revokeAllSessions, deleteSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ message: "Not authorized." }, { status: 401 });

  let input: { currentPassword?: unknown; newPassword?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return NextResponse.json({ message: "Invalid password change request." }, { status: 400 });
  }

  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  const passwordError = validatePassword(newPassword);
  if (!currentPassword || passwordError) return NextResponse.json({ message: passwordError ?? "Enter your current password." }, { status: 400 });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) return NextResponse.json({ message: "Your current password is incorrect." }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id, summary: "User changed their password." } });
  await revokeAllSessions(user.id);
  await deleteSession();
  return NextResponse.json({ message: "Your password has been changed. Please sign in again." });
}

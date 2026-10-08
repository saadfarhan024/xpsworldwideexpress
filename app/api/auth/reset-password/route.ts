import { NextResponse } from "next/server";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { revokeAllSessions } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`reset-password:ip:${ip}`, RATE_LIMITS.resetPassword.limit, RATE_LIMITS.resetPassword.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  let input: { token?: unknown; password?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return NextResponse.json({ message: "Invalid password reset request." }, { status: 400 });
  }

  const token = typeof input.token === "string" ? input.token : "";
  const password = typeof input.password === "string" ? input.password : "";
  const passwordError = validatePassword(password);
  if (!token || passwordError) {
    return NextResponse.json({
      message: passwordError ?? "Enter a valid reset link and a password that meets the requirements.",
    }, { status: 400 });
  }

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ message: "This password reset link has expired or was already used." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const updated = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.updateMany({
      where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return false;

    await transaction.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    return true;
  });

  if (!updated) return NextResponse.json({ message: "This password reset link has expired or was already used." }, { status: 400 });

  await revokeAllSessions(reset.userId);
  return NextResponse.json({ message: "Your password has been updated. You can now log in." });
}

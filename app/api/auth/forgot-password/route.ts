import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const genericResponse = { message: "If an account matches this email address, reset instructions will be sent shortly." };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`forgot-password:ip:${ip}`, RATE_LIMITS.forgotPassword.limit, RATE_LIMITS.forgotPassword.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  let input: { email?: unknown };
  try {
    input = await request.json() as { email?: unknown };
  } catch {
    return NextResponse.json(genericResponse);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json(genericResponse);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const token = createToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    try {
      await sendPasswordResetEmail({ to: email, token });
    } catch (error) {
      console.error("Password reset email could not be sent:", error);
    }
  }

  return NextResponse.json(genericResponse);
}

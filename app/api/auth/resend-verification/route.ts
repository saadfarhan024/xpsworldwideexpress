import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const genericResponse = {
  message: "If an unverified account matches this email address, a new verification link will be sent shortly.",
};

const RESEND_MIN_INTERVAL_MS = 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`resend-verification:ip:${ip}`, RATE_LIMITS.resendVerification.limit, RATE_LIMITS.resendVerification.windowMs);
  if (!ipLimit.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } });
  }

  let input: { email?: unknown };
  try {
    input = await request.json() as { email?: unknown };
  } catch {
    return NextResponse.json(genericResponse);
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json(genericResponse);

  const emailLimit = checkRateLimit(`resend-verification:email:${email}`, RATE_LIMITS.resendVerification.limit, RATE_LIMITS.resendVerification.windowMs);
  if (!emailLimit.allowed) {
    return NextResponse.json(genericResponse);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
      merchantProfile: { select: { contactName: true } },
      emailVerifications: {
        where: { usedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (user?.status === "PENDING_EMAIL_VERIFICATION") {
    const latest = user.emailVerifications[0];
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_MIN_INTERVAL_MS) {
      return NextResponse.json(genericResponse);
    }

    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const token = createToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      await sendVerificationEmail({
        to: email,
        contactName: user.merchantProfile?.contactName ?? "there",
        token,
      });
    } catch (error) {
      console.error("Resend verification email could not be sent:", error);
    }
  }

  return NextResponse.json(genericResponse);
}

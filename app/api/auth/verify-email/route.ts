import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`verify-email:ip:${ip}`, RATE_LIMITS.verifyEmail.limit, RATE_LIMITS.verifyEmail.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  let input: { token?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return NextResponse.json({ message: "This verification link is invalid." }, { status: 400 });
  }

  const token = typeof input.token === "string" ? input.token : "";
  if (!token) return NextResponse.json({ message: "This verification link is invalid." }, { status: 400 });

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    return NextResponse.json({ message: "This verification link has expired or was already used." }, { status: 400 });
  }

  const now = new Date();
  const verified = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.emailVerificationToken.updateMany({
      where: { id: verification.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return false;

    await transaction.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: now, status: "PENDING_APPROVAL" },
    });
    await transaction.auditLog.create({
      data: {
        actorId: verification.userId,
        action: "MERCHANT_EMAIL_VERIFIED",
        entityType: "User",
        entityId: verification.userId,
        summary: "Merchant email address verified; application is awaiting review.",
      },
    });
    return true;
  });

  if (!verified) return NextResponse.json({ message: "This verification link has expired or was already used." }, { status: 400 });
  return NextResponse.json({ message: "Email verified. Your application is now awaiting XPS review." });
}

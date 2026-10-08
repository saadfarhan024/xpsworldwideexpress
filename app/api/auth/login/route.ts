import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`login:ip:${ip}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  let input: { email?: unknown; password?: unknown };
  try {
    input = await request.json() as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ message: "Invalid sign-in request." }, { status: 400 });
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) {
    return NextResponse.json({ message: "Enter your email address and password." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ message: "Email address or password is incorrect." }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    const message = user.status === "PENDING_EMAIL_VERIFICATION"
      ? "Verify your email before signing in. You can request a new verification link if needed."
      : user.status === "PENDING_APPROVAL"
        ? "Your email is verified and your account is awaiting GDE approval."
        : "This account cannot sign in. Please contact GDE support for assistance.";
    return NextResponse.json({
      message,
      ...(user.status === "PENDING_EMAIL_VERIFICATION" ? { resendVerification: true } : {}),
    }, { status: 403 });
  }

  await createSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const destination = user.role !== "MERCHANT" ? "/admin" : "/account";
  return NextResponse.json({ destination });
}

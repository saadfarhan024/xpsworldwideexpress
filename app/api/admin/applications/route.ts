import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendApplicationDecisionEmail } from "@/lib/email";

async function getAdmin() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return null;
  return user.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const applications = await prisma.user.findMany({
    where: { role: "MERCHANT", status: { in: ["PENDING_APPROVAL", "PENDING_EMAIL_VERIFICATION"] } },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      merchantProfile: {
        select: {
          companyName: true,
          contactName: true,
          phone: true,
          pickupAddress: true,
          city: true,
          website: true,
          accountNature: true,
          productType: true,
          monthlyShipmentVolume: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let input: { userId?: unknown; decision?: unknown; reason?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const userId = typeof input.userId === "string" ? input.userId : "";
  const decision = input.decision;
  const reason = typeof input.reason === "string" ? input.reason.trim().slice(0, 500) : "";
  const isApproval = decision === "approve" || decision === "verify_and_approve";
  if (!userId || (!isApproval && decision !== "reject") || (decision === "reject" && !reason)) {
    return NextResponse.json({ message: "Choose approve or provide a rejection reason." }, { status: 400 });
  }

  const application = await prisma.user.findFirst({
    where: { id: userId, role: "MERCHANT", status: { in: ["PENDING_APPROVAL", "PENDING_EMAIL_VERIFICATION"] } },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      merchantProfile: { select: { id: true, companyName: true, contactName: true } },
    },
  });
  if (!application?.merchantProfile) {
    return NextResponse.json({ message: "This application is no longer pending." }, { status: 404 });
  }

  const approved = isApproval;
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: application.id },
      data: {
        status: approved ? "ACTIVE" : "REJECTED",
        ...(approved && !application.emailVerifiedAt ? { emailVerifiedAt: now } : {}),
      },
    }),
    prisma.merchantProfile.update({
      where: { id: application.merchantProfile.id },
      data: approved
        ? { approvedAt: now, rejectedAt: null, rejectionReason: null }
        : { rejectedAt: now, rejectionReason: reason, approvedAt: null },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: approved ? "MERCHANT_APPLICATION_APPROVED" : "MERCHANT_APPLICATION_REJECTED",
        entityType: "User",
        entityId: application.id,
        summary: approved
          ? `Merchant application approved (previous status: ${application.status}).`
          : `Merchant application rejected: ${reason}`,
      },
    }),
  ]);

  try {
    await sendApplicationDecisionEmail({
      to: application.email,
      contactName: application.merchantProfile.contactName,
      companyName: application.merchantProfile.companyName,
      approved,
      reason: approved ? undefined : reason,
    });
  } catch (error) {
    console.error("Application decision email could not be sent:", error);
  }

  return NextResponse.json({ message: approved ? "Application approved." : "Application rejected." });
}

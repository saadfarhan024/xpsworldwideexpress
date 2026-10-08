import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") return null;
  return user;
}

const DEFAULT_SETTINGS: Record<string, string> = {
  service_cities: JSON.stringify([
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Gujranwala",
  ]),
  service_tiers: JSON.stringify(["Domestic Overnight", "Same-Day Express", "Economy Ground"]),
  daily_cutoff_time: "17:00",
  support_phone: "+92 300 1234567",
  support_email: "support@xpsworldwideexpress.com",
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const stored = await prisma.appSetting.findMany();
  const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

  for (const s of stored) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json({ settings: settingsMap });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const [key, val] of Object.entries(body)) {
      if (typeof val === "string") {
        await tx.appSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "APP_SETTINGS_UPDATED",
        entityType: "AppSetting",
        entityId: "system",
        summary: `Admin updated system settings: ${Object.keys(body).join(", ")}.`,
      },
    });
  });

  return NextResponse.json({ message: "System settings saved." });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PAKISTAN_CITIES } from "@/lib/pakistan-cities";
import { prisma } from "@/lib/db";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function requireActiveMerchant() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid pickup profile." }, { status: 400 });
  }

  const shipperName = clean(input.shipperName);
  const shipperPhone = clean(input.shipperPhone);
  const shipperEmail = clean(input.shipperEmail).toLowerCase();
  const origin = clean(input.origin);
  const shipperAddress = clean(input.shipperAddress);
  if (!shipperName || shipperName.length > 160 || !shipperPhone || shipperPhone.length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipperEmail) || !(PAKISTAN_CITIES as readonly string[]).includes(origin) || !shipperAddress || shipperAddress.length > 1000) {
    return NextResponse.json({ message: "Enter a name, phone, valid email, Pakistan city, and address." }, { status: 400 });
  }

  const profile = await prisma.pickupProfile.create({
    data: { merchantId: user.merchantProfile.id, shipperName, shipperPhone, shipperEmail, origin, shipperAddress },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "PICKUP_PROFILE_CREATED", entityType: "PickupProfile", entityId: profile.id, summary: `Pickup profile ${profile.id} created.` } });
  return NextResponse.json({ profile }, { status: 201 });
}

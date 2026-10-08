import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function requireActiveMerchant() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) return null;
  return user;
}

function profilePayload(user: NonNullable<Awaited<ReturnType<typeof requireActiveMerchant>>>) {
  const profile = user!.merchantProfile!;
  return {
    email: user!.email,
    companyName: profile.companyName,
    contactName: profile.contactName,
    phone: profile.phone,
    pickupAddress: profile.pickupAddress,
    city: profile.city,
    website: profile.website,
    accountNature: profile.accountNature,
    productType: profile.productType,
    monthlyShipmentVolume: profile.monthlyShipmentVolume,
    hasLogo: Boolean(profile.logoStorageKey),
  };
}

export async function GET() {
  const user = await requireActiveMerchant();
  if (!user) return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  return NextResponse.json({ profile: profilePayload(user) });
}

export async function PATCH(request: Request) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid profile update." }, { status: 400 });
  }

  const companyName = clean(input.companyName);
  const contactName = clean(input.contactName);
  const phone = clean(input.phone);
  const pickupAddress = clean(input.pickupAddress);
  const city = clean(input.city);
  const website = clean(input.website) || null;
  const accountNature = clean(input.accountNature);
  const productType = clean(input.productType);
  const monthlyShipmentVolume = clean(input.monthlyShipmentVolume);

  if (!companyName || !contactName || !phone || !pickupAddress || !city || !accountNature || !productType || !monthlyShipmentVolume) {
    return NextResponse.json({ message: "Please complete all required profile fields." }, { status: 400 });
  }

  if (website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(website)) {
    return NextResponse.json({ message: "Enter a valid website address." }, { status: 400 });
  }

  const updated = await prisma.merchantProfile.update({
    where: { id: user.merchantProfile.id },
    data: {
      companyName,
      contactName,
      phone,
      pickupAddress,
      city,
      website,
      accountNature,
      productType,
      monthlyShipmentVolume,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "MERCHANT_PROFILE_UPDATED",
      entityType: "MerchantProfile",
      entityId: updated.id,
      summary: "Merchant business profile updated.",
    },
  });

  return NextResponse.json({
    profile: {
      email: user.email,
      companyName: updated.companyName,
      contactName: updated.contactName,
      phone: updated.phone,
      pickupAddress: updated.pickupAddress,
      city: updated.city,
      website: updated.website,
      accountNature: updated.accountNature,
      productType: updated.productType,
      monthlyShipmentVolume: updated.monthlyShipmentVolume,
      hasLogo: Boolean(updated.logoStorageKey),
    },
    message: "Profile updated.",
  });
}

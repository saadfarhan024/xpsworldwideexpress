import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { deleteStoredFile, logoAbsolutePath, saveMerchantLogo } from "@/lib/uploads";

async function requireActiveMerchant() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "MERCHANT" || !user.merchantProfile) return null;
  return user;
}

const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET() {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile?.logoStorageKey) {
    return NextResponse.json({ message: "No logo uploaded." }, { status: 404 });
  }

  try {
    const absolutePath = logoAbsolutePath(user.merchantProfile.logoStorageKey);
    const data = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Logo file is unavailable." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a logo image to upload." }, { status: 400 });
  }

  try {
    const previousKey = user.merchantProfile.logoStorageKey;
    const storageKey = await saveMerchantLogo(user.merchantProfile.id, file);
    await prisma.merchantProfile.update({
      where: { id: user.merchantProfile.id },
      data: { logoStorageKey: storageKey },
    });
    await deleteStoredFile(previousKey);
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "MERCHANT_LOGO_UPDATED",
        entityType: "MerchantProfile",
        entityId: user.merchantProfile.id,
        summary: "Merchant logo uploaded.",
      },
    });
    return NextResponse.json({ message: "Logo uploaded.", hasLogo: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload logo.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE() {
  const user = await requireActiveMerchant();
  if (!user?.merchantProfile) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const previousKey = user.merchantProfile.logoStorageKey;
  if (!previousKey) return NextResponse.json({ message: "No logo to remove." }, { status: 404 });

  await prisma.merchantProfile.update({
    where: { id: user.merchantProfile.id },
    data: { logoStorageKey: null },
  });
  await deleteStoredFile(previousKey);
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "MERCHANT_LOGO_DELETED",
      entityType: "MerchantProfile",
      entityId: user.merchantProfile.id,
      summary: "Merchant logo removed.",
    },
  });

  return NextResponse.json({ message: "Logo removed.", hasLogo: false });
}

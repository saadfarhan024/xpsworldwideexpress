import { NextResponse } from "next/server";
import { decryptField, encryptField } from "@/lib/auth/crypto";
import { getCurrentUser, isFinanceOrAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { maskSecret } from "@/lib/uploads";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function requireBankAccess() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || !isFinanceOrAdmin(user.role)) return null;
  return user;
}

type RouteContext = { params: Promise<{ merchantId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const actor = await requireBankAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { merchantId } = await context.params;
  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      bankDetail: true,
    },
  });
  if (!merchant) return NextResponse.json({ message: "Merchant not found." }, { status: 404 });

  const detail = merchant.bankDetail;
  let accountNumber: string | null = null;
  let iban: string | null = null;
  try {
    accountNumber = detail?.encryptedAccountNumber ? decryptField(detail.encryptedAccountNumber) : null;
    iban = detail?.encryptedIban ? decryptField(detail.encryptedIban) : null;
  } catch (error) {
    console.error("Could not decrypt bank fields:", error);
    return NextResponse.json({ message: "Stored bank details could not be read." }, { status: 500 });
  }

  return NextResponse.json({
    merchant: {
      id: merchant.id,
      companyName: merchant.companyName,
      contactName: merchant.contactName,
    },
    bank: {
      bankName: detail?.bankName ?? null,
      accountTitle: detail?.accountTitle ?? null,
      accountNumberMasked: maskSecret(accountNumber),
      accountNumber,
      branchName: detail?.branchName ?? null,
      branchCode: detail?.branchCode ?? null,
      swiftCode: detail?.swiftCode ?? null,
      ibanMasked: maskSecret(iban),
      iban,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await requireBankAccess();
  if (!actor) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { merchantId } = await context.params;
  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: { id: true, bankDetail: { select: { id: true } } },
  });
  if (!merchant) return NextResponse.json({ message: "Merchant not found." }, { status: 404 });

  let input: Record<string, unknown>;
  try {
    input = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid bank update." }, { status: 400 });
  }

  const accountNumber = clean(input.accountNumber);
  const iban = clean(input.iban);
  const data = {
    bankName: clean(input.bankName) || null,
    accountTitle: clean(input.accountTitle) || null,
    encryptedAccountNumber: accountNumber ? encryptField(accountNumber) : null,
    branchName: clean(input.branchName) || null,
    branchCode: clean(input.branchCode) || null,
    swiftCode: clean(input.swiftCode) || null,
    encryptedIban: iban ? encryptField(iban) : null,
  };

  if (merchant.bankDetail) {
    await prisma.merchantBankDetail.update({ where: { id: merchant.bankDetail.id }, data });
  } else {
    await prisma.merchantBankDetail.create({ data: { merchantId: merchant.id, ...data } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "MERCHANT_BANK_DETAILS_UPDATED",
      entityType: "MerchantProfile",
      entityId: merchant.id,
      summary: "Merchant bank details updated by finance/admin staff.",
    },
  });

  return NextResponse.json({
    message: "Bank details updated.",
    bank: {
      bankName: data.bankName,
      accountTitle: data.accountTitle,
      accountNumberMasked: maskSecret(accountNumber || null),
      branchName: data.branchName,
      branchCode: data.branchCode,
      swiftCode: data.swiftCode,
      ibanMasked: maskSecret(iban || null),
    },
  });
}

import { NextResponse } from "next/server";
import { encryptField } from "@/lib/auth/crypto";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { checkRateLimit, RATE_LIMIT_MESSAGE, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/auth/request";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

type RegistrationInput = {
  company?: string;
  contact?: string;
  phone?: string;
  email?: string;
  pickupAddress?: string;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  iban?: string;
  website?: string;
  city?: string;
  accountNature?: string;
  productType?: string;
  shipmentVolume?: string;
  password?: string;
};

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const emailPattern = /^\S+@\S+\.\S+$/;

const successMessage =
  "Check your email to verify your address. If you do not see it, you can request a new link from the resend verification page.";

function bankCreateData(input: RegistrationInput) {
  const accountNumber = clean(input.accountNumber);
  const iban = clean(input.iban);
  const bankFields = [input.bankName, input.accountTitle, accountNumber, input.branchName, input.branchCode, input.swiftCode, iban].map(clean);
  if (!bankFields.some(Boolean)) return undefined;
  return {
    bankName: clean(input.bankName) || null,
    accountTitle: clean(input.accountTitle) || null,
    encryptedAccountNumber: accountNumber ? encryptField(accountNumber) : null,
    branchName: clean(input.branchName) || null,
    branchCode: clean(input.branchCode) || null,
    swiftCode: clean(input.swiftCode) || null,
    encryptedIban: iban ? encryptField(iban) : null,
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = checkRateLimit(`register:ip:${ip}`, RATE_LIMITS.register.limit, RATE_LIMITS.register.windowMs);
  if (!limited.allowed) {
    return NextResponse.json({ message: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  let input: RegistrationInput;
  try {
    input = await request.json() as RegistrationInput;
  } catch {
    return NextResponse.json({ message: "Invalid registration request." }, { status: 400 });
  }

  const company = clean(input.company);
  const contact = clean(input.contact);
  const phone = clean(input.phone);
  const email = clean(input.email).toLowerCase();
  const pickupAddress = clean(input.pickupAddress);
  const city = clean(input.city);
  const accountNature = clean(input.accountNature);
  const productType = clean(input.productType);
  const shipmentVolume = clean(input.shipmentVolume);
  const password = input.password ?? "";
  const website = clean(input.website) || null;
  const passwordError = validatePassword(password);

  if (!company || !contact || !phone || !emailPattern.test(email) || !pickupAddress || !city || !accountNature || !productType || !shipmentVolume || passwordError) {
    return NextResponse.json({
      message: passwordError && company && contact && phone && emailPattern.test(email) && pickupAddress && city && accountNature && productType && shipmentVolume
        ? passwordError
        : "Please complete all required registration fields.",
    }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
      merchantProfile: { select: { id: true } },
    },
  });

  if (existingUser && existingUser.status !== "PENDING_EMAIL_VERIFICATION") {
    return NextResponse.json({ message: "An account already exists for this email address." }, { status: 409 });
  }

  const verificationToken = createToken();
  const passwordHash = await hashPassword(password);
  const bankData = bankCreateData(input);
  const profileData = {
    companyName: company,
    contactName: contact,
    phone,
    pickupAddress,
    city,
    website,
    accountNature,
    productType,
    monthlyShipmentVolume: shipmentVolume,
  };

  if (existingUser?.status === "PENDING_EMAIL_VERIFICATION" && existingUser.merchantProfile) {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: existingUser.id },
        data: { passwordHash },
      });
      await transaction.merchantProfile.update({
        where: { id: existingUser.merchantProfile!.id },
        data: profileData,
      });
      await transaction.merchantBankDetail.deleteMany({ where: { merchantId: existingUser.merchantProfile!.id } });
      if (bankData) {
        await transaction.merchantBankDetail.create({
          data: { merchantId: existingUser.merchantProfile!.id, ...bankData },
        });
      }
      await transaction.emailVerificationToken.deleteMany({ where: { userId: existingUser.id, usedAt: null } });
      await transaction.emailVerificationToken.create({
        data: {
          userId: existingUser.id,
          tokenHash: hashToken(verificationToken),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: existingUser.id,
          action: "MERCHANT_REGISTRATION_RECLAIMED",
          entityType: "User",
          entityId: existingUser.id,
          summary: "Unverified merchant registration updated; a new verification email was requested.",
        },
      });
    });
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        status: "PENDING_EMAIL_VERIFICATION",
        emailVerifications: {
          create: {
            tokenHash: hashToken(verificationToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        merchantProfile: {
          create: {
            ...profileData,
            ...(bankData ? { bankDetail: { create: bankData } } : {}),
          },
        },
      },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "MERCHANT_REGISTRATION_SUBMITTED",
        entityType: "User",
        entityId: user.id,
        summary: "Merchant registration submitted; email verification is pending.",
      },
    });
  }

  try {
    await sendVerificationEmail({ to: email, contactName: contact, token: verificationToken });
  } catch (error) {
    console.error("Registration email could not be sent:", error);
    return NextResponse.json({
      message: "Your application was saved, but the verification email could not be delivered. Use the resend verification page to request a new link.",
    }, { status: 201 });
  }

  return NextResponse.json({ message: successMessage }, { status: 201 });
}

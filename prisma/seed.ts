import "dotenv/config";
import { hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env before seeding an administrator.");
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      passwordHash: await hashPassword(password),
    },
    create: {
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Administrator ready: ${email}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

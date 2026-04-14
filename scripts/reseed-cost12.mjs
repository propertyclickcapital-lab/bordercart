import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const accounts = [
  { email: "buyer@bordercart.com", password: "Buyer123!", role: "CUSTOMER", name: "Test Buyer" },
  { email: "admin@bordercart.com", password: "Admin123!", role: "ADMIN", name: "Admin" },
  { email: "warehouse@bordercart.com", password: "Warehouse123!", role: "WAREHOUSE_OPERATOR", name: "Warehouse" },
];

for (const a of accounts) {
  const hash = await bcrypt.hash(a.password, 12);
  const existing = await prisma.user.findUnique({ where: { email: a.email } });
  const refCode = existing?.referralCode || randomBytes(4).toString("hex").toUpperCase();
  await prisma.user.upsert({
    where: { email: a.email },
    update: { passwordHash: hash, role: a.role, name: a.name, tier: "DEFAULT" },
    create: {
      email: a.email,
      name: a.name,
      passwordHash: hash,
      role: a.role,
      tier: "DEFAULT",
      referralCode: refCode,
      tierStatus: { create: {} },
      notificationPrefs: { create: {} },
    },
  });
  const verify = await prisma.user.findUnique({ where: { email: a.email } });
  const ok = await bcrypt.compare(a.password, verify.passwordHash);
  console.log(`${a.email}: role=${verify.role} hash=cost12 verify=${ok}`);
}

await prisma.$disconnect();

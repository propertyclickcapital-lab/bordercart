import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const accounts = [
  { email: "admin@bordercart.com", password: "Admin123!", role: "ADMIN", name: "Admin" },
  { email: "buyer@bordercart.com", password: "Buyer123!", role: "CUSTOMER", name: "Buyer" },
  { email: "warehouse@bordercart.com", password: "Warehouse123!", role: "WAREHOUSE_OPERATOR", name: "Warehouse" },
];

for (const a of accounts) {
  const passwordHash = await bcrypt.hash(a.password, 10);
  const refCode = randomBytes(4).toString("hex").toUpperCase();
  await prisma.user.upsert({
    where: { email: a.email },
    update: { passwordHash, role: a.role, name: a.name },
    create: {
      email: a.email,
      name: a.name,
      passwordHash,
      role: a.role,
      referralCode: refCode,
      tierStatus: { create: {} },
      notificationPrefs: { create: {} },
    },
  });
}

const users = await prisma.user.findMany({
  where: { email: { in: accounts.map((a) => a.email) } },
  select: { id: true, email: true, role: true, tier: true, referralCode: true },
});

console.log("\nSeeded accounts:");
for (const u of users) console.log(`  ${u.email} → role=${u.role} tier=${u.tier} ref=${u.referralCode}`);

await prisma.$disconnect();

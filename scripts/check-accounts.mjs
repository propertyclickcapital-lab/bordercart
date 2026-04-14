import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const emails = ["admin@bordercart.com", "buyer@bordercart.com", "warehouse@bordercart.com"];
const passwords = { "admin@bordercart.com": "Admin123!", "buyer@bordercart.com": "Buyer123!", "warehouse@bordercart.com": "Warehouse123!" };

for (const email of emails) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) { console.log(`${email}: MISSING`); continue; }
  const hasHash = !!u.passwordHash;
  const match = hasHash ? await bcrypt.compare(passwords[email], u.passwordHash) : false;
  console.log(`${email}: role=${u.role} tier=${u.tier} hash=${hasHash ? "yes" : "NO"} passwordMatches=${match}`);
}

await prisma.$disconnect();

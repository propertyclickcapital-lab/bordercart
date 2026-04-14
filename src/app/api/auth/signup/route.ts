import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode } from "@/lib/referral";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  phone: z.string().optional(),
  ref: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password, name, phone, ref } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  let referredById: string | null = null;
  if (ref) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: ref.toUpperCase() } });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email, name, phone, passwordHash, referredById,
      tierStatus: { create: {} },
      notificationPrefs: { create: {} },
    },
  });
  await ensureReferralCode(user.id);
  return NextResponse.json({ id: user.id, email: user.email });
}

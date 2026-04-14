import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode } from "@/lib/referral";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = await ensureReferralCode(session.user.id);
  const [user, referralCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { creditMXN: true } }),
    prisma.user.count({ where: { referredById: session.user.id } }),
  ]);
  return NextResponse.json({ referralCode: code, referralCount, creditMXN: Number(user?.creditMXN ?? 0) });
}

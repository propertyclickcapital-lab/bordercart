import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export const REFERRAL_CREDIT_MXN = 100;

export function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.referralCode) return user.referralCode;

  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const clash = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!clash) {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    }
  }
  throw new Error("Could not generate referral code");
}

export async function processReferralReward(referrerId: string, _orderId: string) {
  await prisma.user.update({
    where: { id: referrerId },
    data: { creditMXN: { increment: REFERRAL_CREDIT_MXN } },
  });
}

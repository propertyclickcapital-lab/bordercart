import { UserTier } from "@prisma/client";

export const TIER_RATES: Record<UserTier, number> = {
  DEFAULT: 0.30,
  ACTIVE: 0.25,
  POWER: 0.20,
  VIP: 0.15,
};

export const TIER_THRESHOLDS = {
  DEFAULT_TO_ACTIVE_ORDERS: 3,
  ACTIVE_TO_POWER_SPEND_MXN: 5000,
  POWER_TO_VIP_SPEND_MXN: 15000,
};

export function getEligibleTier(orderCount: number, totalSpendMXN: number): UserTier {
  if (totalSpendMXN >= TIER_THRESHOLDS.POWER_TO_VIP_SPEND_MXN) return "VIP";
  if (totalSpendMXN >= TIER_THRESHOLDS.ACTIVE_TO_POWER_SPEND_MXN) return "POWER";
  if (orderCount >= TIER_THRESHOLDS.DEFAULT_TO_ACTIVE_ORDERS) return "ACTIVE";
  return "DEFAULT";
}

export function getTierLabel(tier: UserTier): string {
  return { DEFAULT: "Explorer", ACTIVE: "Active", POWER: "Power", VIP: "VIP" }[tier];
}

export interface TierProgress {
  current: UserTier;
  next: UserTier | null;
  progress: number;
  message: string;
}

export function calculateTierProgress(tier: UserTier, orderCount: number, totalSpendMXN: number): TierProgress {
  if (tier === "DEFAULT") {
    const remaining = TIER_THRESHOLDS.DEFAULT_TO_ACTIVE_ORDERS - orderCount;
    return {
      current: "DEFAULT",
      next: "ACTIVE",
      progress: Math.min(orderCount / TIER_THRESHOLDS.DEFAULT_TO_ACTIVE_ORDERS, 1),
      message: remaining > 0 ? `${remaining} more order${remaining === 1 ? "" : "s"} to unlock Active pricing.` : "Almost there!",
    };
  }
  if (tier === "ACTIVE") {
    const remaining = TIER_THRESHOLDS.ACTIVE_TO_POWER_SPEND_MXN - totalSpendMXN;
    return {
      current: "ACTIVE",
      next: "POWER",
      progress: Math.min(totalSpendMXN / TIER_THRESHOLDS.ACTIVE_TO_POWER_SPEND_MXN, 1),
      message: remaining > 0 ? `Spend $${Math.ceil(remaining).toLocaleString("es-MX")} MXN more to reach Power.` : "Power tier unlocked!",
    };
  }
  if (tier === "POWER") {
    const remaining = TIER_THRESHOLDS.POWER_TO_VIP_SPEND_MXN - totalSpendMXN;
    return {
      current: "POWER",
      next: "VIP",
      progress: Math.min(totalSpendMXN / TIER_THRESHOLDS.POWER_TO_VIP_SPEND_MXN, 1),
      message: remaining > 0 ? `Spend $${Math.ceil(remaining).toLocaleString("es-MX")} MXN more to reach VIP.` : "VIP tier unlocked!",
    };
  }
  return { current: "VIP", next: null, progress: 1, message: "You have our best pricing. Thank you." };
}

export function getTierProgressMessage(tier: UserTier, orderCount: number, totalSpendMXN: number): string {
  return calculateTierProgress(tier, orderCount, totalSpendMXN).message;
}

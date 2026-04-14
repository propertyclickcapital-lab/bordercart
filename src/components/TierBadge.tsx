import { Badge } from "@/components/ui/badge";
import { getTierLabel } from "@/lib/pricing/tiers";
import type { UserTier } from "@prisma/client";

export function TierBadge({ tier }: { tier: UserTier }) {
  const v = tier === "VIP" ? "gold" : tier === "POWER" ? "orange" : tier === "ACTIVE" ? "blue" : "default";
  return <Badge variant={v as any}>{getTierLabel(tier)}</Badge>;
}

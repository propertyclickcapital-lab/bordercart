import { calculateTierProgress, getTierLabel } from "@/lib/pricing/tiers";
import type { UserTier } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export function TierProgress({ tier, orderCount, totalSpendMXN }: { tier: UserTier; orderCount: number; totalSpendMXN: number }) {
  const p = calculateTierProgress(tier, orderCount, totalSpendMXN);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--orange-light)]">
            <Trophy className="h-4 w-4 text-[var(--orange)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Current tier</p>
            <p className="text-base font-semibold">{getTierLabel(p.current)}</p>
          </div>
        </div>
        {p.next && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Next</p>
            <Badge variant="blue">{getTierLabel(p.next)}</Badge>
          </div>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg)]">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--blue-dark)] transition-all duration-700" style={{ width: `${p.progress * 100}%` }} />
      </div>
      <p className="mt-3 text-sm text-[var(--ink)]">{p.message}</p>
    </div>
  );
}

import { formatMXN } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

export function PriceDisplay({ amount, className }: { amount: number | string; className?: string }) {
  return (
    <div className={cn("animate-fade-up", className)}>
      <div className="text-[var(--blue)] tracking-tight leading-none font-extrabold" style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}>
        {formatMXN(amount)}
      </div>
      <p className="mt-2 text-sm text-[var(--ink-2)] font-medium">All-in price. No surprises.</p>
    </div>
  );
}

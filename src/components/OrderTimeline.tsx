import { Check } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STEPS: { key: OrderStatus; label: string; short: string }[] = [
  { key: "quote_created", label: "Quote Created", short: "Quote" },
  { key: "awaiting_payment", label: "Awaiting Payment", short: "Payment" },
  { key: "pending_purchase", label: "Pending Purchase", short: "Pending" },
  { key: "purchased_from_store", label: "Purchased from Store", short: "Purchased" },
  { key: "in_transit_to_san_diego", label: "In Transit to San Diego", short: "Transit" },
  { key: "received_at_warehouse", label: "Received at Warehouse", short: "Warehouse" },
  { key: "forwarded_to_mexico", label: "Forwarded to Mexico", short: "Forwarded" },
  { key: "in_last_mile_delivery", label: "Out for Delivery", short: "Delivery" },
  { key: "delivered", label: "Delivered", short: "Delivered" },
];

export function OrderTimelineStepper({ current }: { current: OrderStatus }) {
  const isTerminal = current === "cancelled" || current === "issue_flagged";
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center min-w-max">
        {STEPS.map((step, i) => {
          const completed = !isTerminal && i < currentIdx;
          const isCurrent = !isTerminal && i === currentIdx;
          const future = isTerminal || i > currentIdx;
          return (
            <li key={step.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <span className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  completed && "bg-[var(--blue)] border-[var(--blue)] text-white",
                  isCurrent && "bg-[var(--blue)] border-[var(--blue)] text-white animate-blue-pulse",
                  future && "bg-white border-[var(--border)] text-[var(--ink-3)]"
                )}>
                  {completed ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <p className={cn(
                  "mt-2 text-xs text-center max-w-[90px]",
                  (completed || isCurrent) && "text-[var(--ink)] font-medium",
                  future && "text-[var(--ink-3)]"
                )}>{step.short}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-12 h-0.5 mx-1 mt-[-20px]", completed ? "bg-[var(--blue)]" : "bg-[var(--border)]")} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrderTimelineVertical({
  current, history,
}: {
  current: OrderStatus;
  history: { status: OrderStatus; createdAt: string; note: string | null }[];
}) {
  const isTerminal = current === "cancelled" || current === "issue_flagged";
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-5 py-1">
      {STEPS.map((step, i) => {
        const completed = !isTerminal && i < currentIdx;
        const isCurrent = !isTerminal && i === currentIdx;
        const future = isTerminal || i > currentIdx;
        const historyItem = history.find((h) => h.status === step.key);
        return (
          <li key={step.key} className="pl-5 relative">
            <span className={cn(
              "absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white",
              completed && "bg-[var(--blue)]",
              isCurrent && "bg-[var(--blue)] animate-blue-pulse",
              future && "bg-[var(--border)]"
            )}>
              {completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <p className={cn(
                "text-sm",
                (completed || isCurrent) && "text-[var(--ink)] font-medium",
                future && "text-[var(--ink-3)]"
              )}>{step.label}</p>
              {historyItem && (
                <span className="text-xs text-[var(--ink-3)] whitespace-nowrap">
                  {new Date(historyItem.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {historyItem?.note && <p className="mt-0.5 text-xs text-[var(--ink-2)]">{historyItem.note}</p>}
          </li>
        );
      })}
      {isTerminal && (
        <li className="pl-5 relative">
          <span className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] ring-4 ring-white" />
          <p className="text-sm font-medium text-[var(--danger)]">{current === "cancelled" ? "Cancelled" : "Issue Flagged"}</p>
        </li>
      )}
    </ol>
  );
}

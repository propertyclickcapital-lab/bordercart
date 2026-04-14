import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@prisma/client";

const LABELS: Record<OrderStatus, { label: string; variant: "blue" | "orange" | "success" | "warning" | "danger" | "info" | "default" | "navy" }> = {
  quote_created: { label: "Quote", variant: "default" },
  awaiting_payment: { label: "Awaiting Payment", variant: "warning" },
  pending_purchase: { label: "Pending Purchase", variant: "info" },
  purchased_from_store: { label: "Purchased", variant: "info" },
  in_transit_to_san_diego: { label: "In Transit (US)", variant: "blue" },
  received_at_warehouse: { label: "At Warehouse", variant: "blue" },
  forwarded_to_mexico: { label: "To Mexico", variant: "blue" },
  in_last_mile_delivery: { label: "Out for Delivery", variant: "orange" },
  delivered: { label: "Delivered", variant: "success" },
  issue_flagged: { label: "Issue", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "default" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = LABELS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

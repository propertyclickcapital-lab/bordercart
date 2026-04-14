"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { ManualRequestCard } from "./ManualRequestCard";
import { useToast } from "./ui/toast";
import type { Order, OrderStatus } from "@prisma/client";

type ManualReq = React.ComponentProps<typeof ManualRequestCard>["request"];

type Payload = {
  orders: Order[];
  manualRequests: ManualReq[];
};

export function LiveActivityList({ initial, limit }: { initial: Payload; limit?: number }) {
  const [data, setData] = useState<Payload>(initial);
  const { toast } = useToast();
  const router = useRouter();
  const prevStatus = useRef<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const m of initial.manualRequests) map[m.id] = m.status;
    prevStatus.current = map;
  }, [initial.manualRequests]);

  useEffect(() => {
    let mounted = true;
    async function tick() {
      try {
        const r = await fetch("/api/orders", { cache: "no-store" });
        if (!r.ok) return;
        const next: Payload = await r.json();
        if (!mounted) return;
        for (const m of next.manualRequests) {
          const before = prevStatus.current[m.id];
          if (before === "pending" && m.status === "reviewed") {
            toast({ title: "🎉 ¡Tu precio está listo!", description: "Haz clic para comprar", variant: "success" });
            router.refresh();
          }
          prevStatus.current[m.id] = m.status;
        }
        setData(next);
      } catch {}
    }
    const id = setInterval(tick, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [router, toast]);

  const combined = [
    ...data.orders.map((o) => ({ kind: "order" as const, createdAt: new Date(o.createdAt), data: o })),
    ...data.manualRequests.map((m) => ({ kind: "manual" as const, createdAt: new Date(m.createdAt), data: m })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit ?? 999);

  if (combined.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)]">
          <Package className="h-5 w-5 text-[var(--ink-3)]" />
        </div>
        <h3 className="mt-4 font-semibold">No orders yet</h3>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Paste your first link above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {combined.map((item) =>
        item.kind === "order" ? (
          <OrderCard key={`o-${item.data.id}`} order={item.data as Order} />
        ) : (
          <ManualRequestCard key={`m-${(item.data as ManualReq).id}`} request={item.data as ManualReq} />
        )
      )}
    </div>
  );
}

type _OrderStatus = OrderStatus;

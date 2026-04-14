import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatMXN } from "@/lib/utils/currency";

export default async function AdminManualReviews() {
  const items = await prisma.manualRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true, tier: true } } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual reviews</h1>
        <p className="mt-1 text-[var(--ink-2)]">Products our scraper couldn't read. Give them a custom quote.</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center text-[var(--ink-2)]">
          No manual requests pending.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/admin/manual-reviews/${r.id}`}
              className="group flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-white p-4 hover:border-[var(--blue)] hover:shadow-md transition-all"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-2)]">
                  {format(new Date(r.createdAt), "MMM d, HH:mm")} · {r.user.email} · {r.user.tier}
                </p>
                <p className="mt-1 text-sm text-[var(--ink)] break-all line-clamp-1">{r.sourceUrl}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={r.status === "pending" ? "warning" : r.status === "reviewed" ? "success" : "info"}>
                    {r.status}
                  </Badge>
                  {r.quotedPriceMXN && <Badge variant="blue">{formatMXN(Number(r.quotedPriceMXN))}</Badge>}
                  {r.whatsappNumber && <span className="text-xs text-[var(--ink-2)]">WA: {r.whatsappNumber}</span>}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-[var(--ink-3)] group-hover:text-[var(--blue)] group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

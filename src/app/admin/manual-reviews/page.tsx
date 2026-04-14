import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { ManualReviewActions } from "@/components/ManualReviewActions";

export default async function AdminManualReviews() {
  const items = await prisma.manualRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
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
            <div key={r.id} className="rounded-lg border border-[var(--border)] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--ink-2)]">{format(new Date(r.createdAt), "MMM d, HH:mm")} · {r.user.email}</p>
                  <Link href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-[var(--blue)] hover:underline break-all">{r.sourceUrl}</Link>
                  <div className="mt-2"><Badge variant={r.status === "pending" ? "warning" : r.status === "quoted" ? "success" : "info"}>{r.status}</Badge></div>
                  {r.whatsappNumber && <p className="mt-1 text-xs text-[var(--ink-2)]">WA: {r.whatsappNumber}</p>}
                </div>
                <ManualReviewActions id={r.id} initialStatus={r.status} initialQuoted={r.quotedPriceMXN ? Number(r.quotedPriceMXN) : null} initialNote={r.adminNote ?? ""} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminManualQuoteBuilder } from "@/components/AdminManualQuoteBuilder";
import { getFxRate } from "@/lib/pricing/fx";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function AdminManualReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mr, fxRate] = await Promise.all([
    prisma.manualRequest.findUnique({
      where: { id },
      include: { user: { include: { tierStatus: true } } },
    }),
    getFxRate(),
  ]);
  if (!mr) notFound();

  const defaultTakeRate = mr.user.tier === "VIP" ? 0.15 : mr.user.tier === "POWER" ? 0.2 : mr.user.tier === "ACTIVE" ? 0.25 : 0.3;

  return (
    <div className="space-y-6">
      <Link href="/admin/manual-reviews" className="text-sm text-[var(--blue)] hover:underline">← Back</Link>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">
              Submitted {format(new Date(mr.createdAt), "MMM d, yyyy · HH:mm")}
            </p>
            <h1 className="mt-1 text-2xl font-bold">Manual review</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{mr.user.email} · {mr.user.tier} tier</p>
            {mr.whatsappNumber && <p className="text-sm text-[var(--ink-2)]">WhatsApp: {mr.whatsappNumber}</p>}
          </div>
          <Badge variant={mr.status === "pending" ? "warning" : mr.status === "reviewed" ? "success" : "info"}>
            {mr.status}
          </Badge>
        </div>
        <a
          href={mr.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--blue)] hover:underline break-all"
        >
          {mr.sourceUrl}
        </a>
      </div>

      <AdminManualQuoteBuilder
        manualRequestId={mr.id}
        sourceUrl={mr.sourceUrl}
        userEmail={mr.user.email}
        userTier={mr.user.tier}
        fxRate={fxRate}
        defaultTakeRate={defaultTakeRate}
        alreadySent={mr.status !== "pending"}
      />
    </div>
  );
}

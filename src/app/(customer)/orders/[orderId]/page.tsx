import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { OrderTimelineStepper, OrderTimelineVertical } from "@/components/OrderTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMXN } from "@/lib/utils/currency";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Share2 } from "lucide-react";
import { OrderSuccessCelebrate } from "@/components/OrderSuccessCelebrate";

export default async function OrderDetail({ params, searchParams }: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { orderId } = await params;
  const { success } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { statusHistory: { orderBy: { createdAt: "asc" } }, quote: true },
  });
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {success === "1" && <OrderSuccessCelebrate />}

      <div className="flex flex-col sm:flex-row items-start gap-5 rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
          {order.productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Order #{order.id.slice(-6).toUpperCase()}</p>
          <h1 className="mt-1 text-xl font-bold leading-tight">{order.productTitle}</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Ordered {format(new Date(order.createdAt), "MMM d, yyyy")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="text-lg font-bold text-[var(--blue)]">{formatMXN(Number(order.totalPaidMXN))}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4">Progress</h2>
        <OrderTimelineStepper current={order.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {order.trackingNumberUS && (
          <div className="rounded-lg border border-[var(--border)] bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">U.S. tracking</p>
            <p className="mt-1 font-mono text-base">{order.trackingNumberUS}</p>
            {order.carrierUS && <p className="text-xs text-[var(--ink-2)]">{order.carrierUS}</p>}
          </div>
        )}
        {order.trackingNumberMX && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--blue-light)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--blue-dark)]">Mexico tracking</p>
            <p className="mt-1 font-mono text-base">{order.trackingNumberMX}</p>
            {order.carrierMX && <p className="text-xs text-[var(--ink-2)]">{order.carrierMX}</p>}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4">Status history</h2>
        <OrderTimelineVertical
          current={order.status}
          history={order.statusHistory.map((h) => ({
            status: h.status, createdAt: h.createdAt.toISOString(), note: h.note,
          }))}
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="lg"><LifeBuoy className="h-4 w-4" /> Need help?</Button>
        <Button variant="outline" size="lg"><Share2 className="h-4 w-4" /> Share</Button>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEligibleTier } from "@/lib/pricing/tiers";
import { processReferralReward } from "@/lib/referral";
import { sendEmail, sendOrderEmail, renderOrderEmail } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await params;
  const { action, note } = await req.json();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, payment: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    if (order.status !== "awaiting_payment") {
      return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 400 });
    }
    const previousCompleted = await prisma.order.count({
      where: { userId: order.userId, NOT: { id: orderId }, status: { notIn: ["cancelled", "quote_created", "awaiting_payment"] } },
    });
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "purchased_from_store" } });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "purchased_from_store", note: note || "Manual transfer approved", changedBy: session.user.id },
      });
      await tx.payment.update({
        where: { orderId },
        data: { status: "succeeded", paidAt: new Date(), rejectionNote: null },
      });
      const ts = await tx.tierStatus.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId, orderCount: 1, totalSpendMXN: order.totalPaidMXN },
        update: { orderCount: { increment: 1 }, totalSpendMXN: { increment: order.totalPaidMXN } },
      });
      await tx.user.update({
        where: { id: order.userId },
        data: { tier: getEligibleTier(ts.orderCount, Number(ts.totalSpendMXN)) },
      });
      if (Number(order.creditAppliedMXN) > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { creditMXN: { decrement: order.creditAppliedMXN } },
        });
      }
    });
    if (previousCompleted === 0 && order.user.referredById) {
      processReferralReward(order.user.referredById, order.id).catch(() => {});
    }
    sendOrderEmail(order.userId, order.id, "purchased_from_store").catch(() => {});
    return NextResponse.json({ success: true, action: "approved" });
  }

  // reject
  await prisma.payment.update({
    where: { orderId },
    data: { status: "failed", rejectionNote: note || "Payment could not be verified" },
  });
  await prisma.orderStatusHistory.create({
    data: { orderId, status: order.status, note: `Payment rejected: ${note || "resubmit proof"}`, changedBy: session.user.id },
  });

  if (order.user.email) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "";
    const html = renderOrderEmail({
      customerName: order.user.name,
      productTitle: order.productTitle,
      productImageUrl: order.productImageUrl,
      orderId: order.id,
      statusLabel: "Necesitamos verificar tu pago",
      body: `${note || "No pudimos verificar tu comprobante. Por favor sube una nueva imagen del recibo de transferencia."}`,
      trackingUrl: `${origin}/orders/${order.id}`,
    });
    sendEmail({
      to: order.user.email,
      subject: "Necesitamos verificar tu pago — sube un nuevo comprobante",
      html,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, action: "rejected" });
}

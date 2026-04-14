import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getEligibleTier } from "@/lib/pricing/tiers";
import { processReferralReward } from "@/lib/referral";
import { sendOrderEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { paymentIntentId, orderId } = await req.json();
  if (!paymentIntentId || !orderId) {
    return NextResponse.json({ error: "paymentIntentId and orderId required" }, { status: 400 });
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
  if (!pi) return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
  if (pi.metadata?.orderId !== orderId || pi.metadata?.userId !== userId) {
    return NextResponse.json({ error: "Payment does not match order" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ success: true, orderId, alreadyProcessed: true });
  }

  if (pi.status !== "succeeded") {
    return NextResponse.json({
      success: false,
      status: pi.status,
      requiresAction: pi.status === "requires_action",
      nextAction: pi.next_action ?? null,
    });
  }

  const previousCompleted = await prisma.order.count({
    where: { userId, NOT: { id: orderId }, status: { notIn: ["cancelled", "quote_created", "awaiting_payment"] } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "purchased_from_store" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "purchased_from_store", note: "Payment received", changedBy: "stripe" },
    });
    await tx.payment.upsert({
      where: { orderId },
      create: {
        userId,
        orderId,
        stripePaymentIntentId: pi.id,
        status: "succeeded",
        amountMXN: order.totalPaidMXN,
        creditApplied: order.creditAppliedMXN,
        paidAt: new Date(),
      },
      update: { status: "succeeded", paidAt: new Date(), stripePaymentIntentId: pi.id },
    });
    const ts = await tx.tierStatus.upsert({
      where: { userId },
      create: { userId, orderCount: 1, totalSpendMXN: order.totalPaidMXN },
      update: { orderCount: { increment: 1 }, totalSpendMXN: { increment: order.totalPaidMXN } },
    });
    const eligible = getEligibleTier(ts.orderCount, Number(ts.totalSpendMXN));
    await tx.user.update({ where: { id: userId }, data: { tier: eligible } });
    if (Number(order.creditAppliedMXN) > 0) {
      await tx.user.update({ where: { id: userId }, data: { creditMXN: { decrement: order.creditAppliedMXN } } });
    }
  });

  if (previousCompleted === 0 && order.user.referredById) {
    processReferralReward(order.user.referredById, order.id).catch(() => {});
  }
  sendOrderEmail(userId, order.id, "purchased_from_store").catch(() => {});

  return NextResponse.json({ success: true, orderId });
}

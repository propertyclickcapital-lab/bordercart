import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getEligibleTier } from "@/lib/pricing/tiers";
import { processReferralReward } from "@/lib/referral";
import { sendOrderEmail } from "@/lib/notifications";

// TODO: Set STRIPE_WEBHOOK_SECRET in Vercel env from Stripe Dashboard → Developers → Webhooks.
// Until set, webhook events will be rejected and orders will remain in `awaiting_payment`.

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret || secret === "placeholder") {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const orderId = s.metadata?.orderId;
    const userId = s.metadata?.userId;
    if (!orderId || !userId) return NextResponse.json({ received: true });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return NextResponse.json({ received: true });

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
          userId, orderId,
          stripeSessionId: s.id,
          stripePaymentIntentId: (s.payment_intent as string) || null,
          status: "succeeded",
          amountMXN: order.totalPaidMXN,
          creditApplied: order.creditAppliedMXN,
          paidAt: new Date(),
        },
        update: {
          stripePaymentIntentId: (s.payment_intent as string) || null,
          status: "succeeded",
          paidAt: new Date(),
        },
      });

      const ts = await tx.tierStatus.upsert({
        where: { userId },
        create: { userId, orderCount: 1, totalSpendMXN: order.totalPaidMXN },
        update: { orderCount: { increment: 1 }, totalSpendMXN: { increment: order.totalPaidMXN } },
      });

      const eligible = getEligibleTier(ts.orderCount, Number(ts.totalSpendMXN));
      await tx.user.update({ where: { id: userId }, data: { tier: eligible } });

      if (Number(order.creditAppliedMXN) > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { creditMXN: { decrement: order.creditAppliedMXN } },
        });
      }
    });

    if (previousCompleted === 0 && order.user.referredById) {
      processReferralReward(order.user.referredById, order.id).catch(() => {});
    }

    sendOrderEmail(order.userId, order.id, "purchased_from_store").catch(() => {});
  }

  return NextResponse.json({ received: true });
}

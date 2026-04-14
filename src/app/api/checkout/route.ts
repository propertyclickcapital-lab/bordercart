import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quoteId, addressId, useCredit } = await req.json();
  if (!quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });

  const [quote, user] = await Promise.all([
    prisma.quote.findUnique({ where: { id: quoteId }, include: { product: true } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  if (!quote || !user || quote.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Quote expired" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { quoteId } });
  if (existing) return NextResponse.json({ error: "Order exists" }, { status: 409 });

  const totalMXN = Number(quote.totalMXN);
  const creditAvailable = Number(user.creditMXN);
  const creditApplied = useCredit ? Math.min(creditAvailable, Math.max(0, totalMXN - 10)) : 0;
  const chargedMXN = totalMXN - creditApplied;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      quoteId: quote.id,
      addressId: addressId || null,
      status: "awaiting_payment",
      productTitle: quote.product.title,
      productImageUrl: quote.product.imageUrl,
      totalPaidMXN: chargedMXN,
      creditAppliedMXN: creditApplied,
      statusHistory: { create: { status: "awaiting_payment", changedBy: session.user.id } },
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const lineItems: any[] = [{
    price_data: {
      currency: "mxn",
      product_data: { name: quote.product.title, images: quote.product.imageUrl ? [quote.product.imageUrl] : undefined },
      unit_amount: Math.round(totalMXN * 100),
    },
    quantity: 1,
  }];

  const discounts: any[] = [];
  if (creditApplied > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(creditApplied * 100),
      currency: "mxn",
      duration: "once",
      name: "BorderCart credit",
    });
    discounts.push({ coupon: coupon.id });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: session.user.email || undefined,
    line_items: lineItems,
    discounts: discounts.length ? discounts : undefined,
    metadata: { orderId: order.id, quoteId: quote.id, userId: session.user.id },
    success_url: `${origin}/orders/${order.id}?success=1`,
    cancel_url: `${origin}/quote/${quote.id}?cancelled=1`,
  });

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      orderId: order.id,
      stripeSessionId: stripeSession.id,
      status: "pending",
      amountMXN: chargedMXN,
      creditApplied,
    },
  });

  return NextResponse.json({ url: stripeSession.url });
}

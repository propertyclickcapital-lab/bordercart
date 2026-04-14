import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { quoteId, addressId, useCredit, method } = await req.json();
  if (!quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });

  const [quote, user] = await Promise.all([
    prisma.quote.findUnique({ where: { id: quoteId }, include: { product: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!quote || !user || quote.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Quote expired" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { quoteId } });
  if (existing && existing.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Order already processed" }, { status: 409 });
  }

  const totalMXN = Number(quote.totalMXN);
  const creditAvailable = Number(user.creditMXN);
  const creditApplied = useCredit ? Math.min(creditAvailable, Math.max(0, totalMXN - 10)) : 0;
  const chargedMXN = Math.max(0, totalMXN - creditApplied);
  const amountCents = Math.round(chargedMXN * 100);

  const order = existing
    ? await prisma.order.update({
        where: { id: existing.id },
        data: {
          addressId: addressId || existing.addressId,
          totalPaidMXN: chargedMXN,
          creditAppliedMXN: creditApplied,
        },
      })
    : await prisma.order.create({
        data: {
          userId,
          quoteId: quote.id,
          addressId: addressId || null,
          status: "awaiting_payment",
          productTitle: quote.product.title,
          productImageUrl: quote.product.imageUrl,
          totalPaidMXN: chargedMXN,
          creditAppliedMXN: creditApplied,
          statusHistory: { create: { status: "awaiting_payment", changedBy: userId } },
        },
      });

  const paymentMethodTypes: string[] =
    method === "spei"
      ? ["customer_balance"]
      : method === "oxxo"
      ? ["oxxo"]
      : ["card", "oxxo"];

  const piParams: any = {
    amount: amountCents,
    currency: "mxn",
    payment_method_types: paymentMethodTypes,
    metadata: {
      orderId: order.id,
      userId,
      quoteId: quote.id,
      productTitle: quote.product.title,
      storeName: quote.product.store,
      creditAppliedMXN: creditApplied.toString(),
    },
    description: `BorderCart Order — ${quote.product.title}`,
    receipt_email: session.user.email || undefined,
  };

  if (method === "spei") {
    piParams.payment_method_data = { type: "customer_balance" };
    piParams.payment_method_options = {
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: { type: "mx_bank_transfer" },
      },
    };
    if (!user.email) return NextResponse.json({ error: "Email required for SPEI" }, { status: 400 });
    let customerId: string | null = null;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data[0]) customerId = customers.data[0].id;
    else {
      const c = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId } });
      customerId = c.id;
    }
    piParams.customer = customerId;
    piParams.confirm = true;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(piParams);

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        userId,
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        amountMXN: chargedMXN,
        creditApplied,
      },
      update: {
        stripePaymentIntentId: paymentIntent.id,
        amountMXN: chargedMXN,
        creditApplied,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      nextAction: paymentIntent.next_action ?? null,
      orderId: order.id,
      totalMXN: chargedMXN,
      product: {
        title: quote.product.title,
        imageUrl: quote.product.imageUrl,
        store: quote.product.store,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not create payment intent" },
      { status: 400 }
    );
  }
}

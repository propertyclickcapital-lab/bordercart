import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFxRate } from "@/lib/pricing/fx";
import { calculateOrderPrice } from "@/lib/pricing/engine";
import { getActivePricingRule } from "@/lib/pricing-rule";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await prisma.importedProduct.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [fxRate, pricingRule] = await Promise.all([getFxRate(), getActivePricingRule()]);
  const breakdown = calculateOrderPrice({
    productPriceUSD: Number(product.priceUSD),
    userTier: user.tier,
    fxRate,
    pricingRule,
  });

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      productId: product.id,
      productPriceUSD: product.priceUSD,
      fxRate,
      fxSpreadPercent: pricingRule.fxSpreadPercent,
      takeRatePercent: breakdown.takeRatePercent,
      shippingMarginUSD: pricingRule.shippingMarginUSD,
      handlingFeeUSD: pricingRule.handlingFeeUSD,
      customsBufferPercent: pricingRule.customsBufferPercent,
      minMarginMXN: pricingRule.minMarginMXN,
      totalMXN: breakdown.totalMXN,
      deliveryDaysMin: breakdown.deliveryDaysMin,
      deliveryDaysMax: breakdown.deliveryDaysMax,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return NextResponse.json(quote);
}

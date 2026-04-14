import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActivePricingRule } from "@/lib/pricing-rule";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rule = await getActivePricingRule();
  return NextResponse.json(rule);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const rule = await getActivePricingRule();
  const updated = await prisma.pricingRule.update({
    where: { id: rule.id },
    data: {
      takeRateDefault: body.takeRateDefault ?? rule.takeRateDefault,
      takeRateActive: body.takeRateActive ?? rule.takeRateActive,
      takeRatePower: body.takeRatePower ?? rule.takeRatePower,
      takeRateVip: body.takeRateVip ?? rule.takeRateVip,
      fxSpreadPercent: body.fxSpreadPercent ?? rule.fxSpreadPercent,
      shippingMarginUSD: body.shippingMarginUSD ?? rule.shippingMarginUSD,
      handlingFeeUSD: body.handlingFeeUSD ?? rule.handlingFeeUSD,
      customsBufferPercent: body.customsBufferPercent ?? rule.customsBufferPercent,
      minMarginMXN: body.minMarginMXN ?? rule.minMarginMXN,
    },
  });
  return NextResponse.json(updated);
}

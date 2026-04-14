import { getActivePricingRule } from "@/lib/pricing-rule";
import { PricingEditor } from "@/components/PricingEditor";

export default async function AdminPricing() {
  const rule = await getActivePricingRule();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing rules</h1>
        <p className="mt-1 text-[var(--ink-2)]">Changes apply to all new quotes.</p>
      </div>
      <PricingEditor rule={{
        takeRateDefault: Number(rule.takeRateDefault),
        takeRateActive: Number(rule.takeRateActive),
        takeRatePower: Number(rule.takeRatePower),
        takeRateVip: Number(rule.takeRateVip),
        fxSpreadPercent: Number(rule.fxSpreadPercent),
        shippingMarginUSD: Number(rule.shippingMarginUSD),
        handlingFeeUSD: Number(rule.handlingFeeUSD),
        customsBufferPercent: Number(rule.customsBufferPercent),
        minMarginMXN: Number(rule.minMarginMXN),
      }} />
    </div>
  );
}

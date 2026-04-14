import { UserTier, PricingRule } from "@prisma/client";
import { TIER_RATES } from "./tiers";

export interface PricingInputs {
  productPriceUSD: number;
  userTier: UserTier;
  fxRate: number;
  pricingRule: PricingRule;
}

export interface PricingBreakdown {
  productPriceUSD: number;
  fxRate: number;
  fxSpreadPercent: number;
  effectiveFx: number;
  subtotalMXN: number;
  takeRatePercent: number;
  marginMXN: number;
  shippingMarginMXN: number;
  handlingFeeMXN: number;
  customsBufferMXN: number;
  totalMXN: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
}

export function calculateOrderPrice(inputs: PricingInputs): PricingBreakdown {
  const { productPriceUSD, userTier, fxRate, pricingRule } = inputs;

  const takeRate = TIER_RATES[userTier];
  const fxSpread = Number(pricingRule.fxSpreadPercent);
  const shippingUSD = Number(pricingRule.shippingMarginUSD);
  const handlingUSD = Number(pricingRule.handlingFeeUSD);
  const customsBuffer = Number(pricingRule.customsBufferPercent);
  const minMarginMXN = Number(pricingRule.minMarginMXN);

  const effectiveFx = fxRate * (1 + fxSpread);
  const productBaseMXN = productPriceUSD * effectiveFx;
  const shippingMarginMXN = shippingUSD * effectiveFx;
  const handlingFeeMXN = handlingUSD * effectiveFx;
  const subtotalMXN = productBaseMXN + shippingMarginMXN + handlingFeeMXN;
  const customsBufferMXN = subtotalMXN * customsBuffer;

  const rawMargin = subtotalMXN * takeRate;
  const marginMXN = Math.max(rawMargin, minMarginMXN);

  const totalMXN = Math.round(subtotalMXN + customsBufferMXN + marginMXN);

  return {
    productPriceUSD,
    fxRate,
    fxSpreadPercent: fxSpread,
    effectiveFx,
    subtotalMXN,
    takeRatePercent: takeRate,
    marginMXN,
    shippingMarginMXN,
    handlingFeeMXN,
    customsBufferMXN,
    totalMXN,
    deliveryDaysMin: 7,
    deliveryDaysMax: 14,
  };
}

import { prisma } from "./prisma";

export async function getActivePricingRule() {
  let rule = await prisma.pricingRule.findFirst({ where: { isActive: true } });
  if (!rule) rule = await prisma.pricingRule.create({ data: { name: "default" } });
  return rule;
}

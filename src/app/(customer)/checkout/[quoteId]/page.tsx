import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CustomCheckout } from "@/components/CustomCheckout";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { quoteId } = await params;

  const [quote, addresses, user] = await Promise.all([
    prisma.quote.findUnique({ where: { id: quoteId }, include: { product: true } }),
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { creditMXN: true, name: true, email: true } }),
  ]);
  if (!quote || quote.userId !== session.user.id) notFound();

  return (
    <CustomCheckout
      quote={{
        id: quote.id,
        totalMXN: Number(quote.totalMXN),
        deliveryDaysMin: quote.deliveryDaysMin,
        deliveryDaysMax: quote.deliveryDaysMax,
        product: {
          title: quote.product.title,
          imageUrl: quote.product.imageUrl,
          store: quote.product.store,
        },
      }}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        street: a.street,
        exteriorNumber: a.exteriorNumber,
        interiorNumber: a.interiorNumber,
        colonia: a.colonia,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      }))}
      user={{
        name: user?.name || "",
        email: user?.email || "",
        creditMXN: Number(user?.creditMXN ?? 0),
      }}
      publishableKey={process.env.STRIPE_PUBLISHABLE_KEY || ""}
      bank={{
        bankName: process.env.BANK_NAME || "",
        accountName: process.env.ACCOUNT_NAME || "",
        clabe: process.env.CLABE || "",
        accountNumber: process.env.ACCOUNT_NUMBER || "",
      }}
    />
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { formatMXN } from "@/lib/utils/currency";

export default async function CheckoutPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { quoteId } = await params;

  const [quote, addresses, user] = await Promise.all([
    prisma.quote.findUnique({ where: { id: quoteId }, include: { product: true } }),
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { creditMXN: true } }),
  ]);
  if (!quote || quote.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="rounded-lg border border-[var(--border)] bg-white p-5 flex items-center gap-4 shadow-sm">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
          {quote.product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{quote.product.title}</p>
          <p className="text-sm text-[var(--ink-2)]">Delivered in {quote.deliveryDaysMin}–{quote.deliveryDaysMax} days</p>
        </div>
        <p className="text-2xl font-bold text-[var(--blue)]">{formatMXN(Number(quote.totalMXN))}</p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <CheckoutForm
          quoteId={quote.id}
          addresses={addresses.map((a) => ({
            id: a.id, label: a.label, street: a.street,
            exteriorNumber: a.exteriorNumber, interiorNumber: a.interiorNumber,
            colonia: a.colonia, city: a.city, state: a.state, postalCode: a.postalCode, isDefault: a.isDefault,
          }))}
          totalMXN={Number(quote.totalMXN)}
          creditMXN={Number(user?.creditMXN ?? 0)}
        />
      </div>

      <p className="text-center text-xs text-[var(--ink-2)]">🔒 Secure checkout with Stripe.</p>
    </div>
  );
}

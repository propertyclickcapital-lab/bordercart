import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN, formatUSD } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { BuyNowButton } from "@/components/BuyNowButton";
import { QuoteCountdown } from "@/components/QuoteCountdown";
import { WishlistHeart } from "@/components/WishlistHeart";
import { ShieldCheck, MapPin, Package } from "lucide-react";
import { getTierLabel } from "@/lib/pricing/tiers";
import { CancelledBanner } from "@/components/CancelledBanner";
import { SpecialQuoteView } from "@/components/SpecialQuoteView";

export default async function QuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { product: true, user: true },
  });
  if (!quote || quote.userId !== session.user.id) notFound();

  if (quote.adminSetPrice) {
    return (
      <div className="mx-auto max-w-5xl py-4">
        <SpecialQuoteView
          quoteId={quote.id}
          totalMXN={Number(quote.totalMXN)}
          productTitle={quote.product.title}
          productImageUrl={quote.product.imageUrl}
          store={quote.product.store}
          deliveryDaysMin={quote.deliveryDaysMin}
          deliveryDaysMax={quote.deliveryDaysMax}
          expiresAt={quote.expiresAt.toISOString()}
          userTier={quote.user.tier}
        />
      </div>
    );
  }

  const saved = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: quote.productId } },
  });

  const tierSavings = quote.user.tier !== "DEFAULT";

  return (
    <div className="mx-auto max-w-5xl py-4">
      <CancelledBanner />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative">
          <div className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm overflow-hidden">
            <Badge variant="orange" className="absolute top-5 left-5 z-10">{quote.product.store.toUpperCase()}</Badge>
            <div className="absolute top-5 right-5 z-10">
              <WishlistHeart productId={quote.productId} initialSaved={!!saved} wishlistId={saved?.id} />
            </div>
            <div className="flex items-center justify-center aspect-square bg-[var(--bg)] rounded-md">
              {quote.product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quote.product.imageUrl} alt="" className="max-h-full max-w-full object-contain p-6" />
              ) : <div className="text-[var(--ink-3)] text-sm">No image</div>}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold leading-tight">{quote.product.title}</h1>
          <p className="mt-2 text-sm text-[var(--ink-2)]">
            From <span className="font-medium text-[var(--ink)]">{quote.product.store}</span>
            {Number(quote.productPriceUSD) > 0 && (
              <> · <span className="line-through">{formatUSD(Number(quote.productPriceUSD))} USD</span></>
            )}
          </p>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Your price delivered</p>
            <p className="text-[clamp(2.5rem,8vw,5rem)] font-extrabold text-[var(--blue)] leading-none mt-1 animate-fade-up">
              {formatMXN(Number(quote.totalMXN))}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">All-in price. Nothing hidden.</p>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-[var(--blue-light)] px-3 py-1.5 text-sm font-medium text-[var(--blue-dark)]">
            <Package className="h-4 w-4" />
            Arrives in {quote.deliveryDaysMin}–{quote.deliveryDaysMax} days 📦
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--ink-2)]">
            <span className="flex items-center gap-1.5">🔒 Secure</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Protected</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Tracked</span>
          </div>

          {tierSavings && (
            <div className="mt-5">
              <Badge variant="orange">{getTierLabel(quote.user.tier)} pricing applied — you saved on this order</Badge>
            </div>
          )}

          <div className="mt-7"><BuyNowButton quoteId={quote.id} /></div>
          <div className="mt-3 text-center"><QuoteCountdown expiresAt={quote.expiresAt.toISOString()} /></div>
        </div>
      </div>
    </div>
  );
}

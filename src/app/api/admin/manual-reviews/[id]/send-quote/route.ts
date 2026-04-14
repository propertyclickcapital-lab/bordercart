import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendWhatsAppMessage, renderOrderEmail } from "@/lib/notifications";
import { formatMXN } from "@/lib/utils/currency";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const mr = await prisma.manualRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!mr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    title,
    imageUrl,
    store,
    productCostUSD,
    shippingToSdUSD,
    shippingToMxUSD,
    customsBufferPercent,
    handlingFeeUSD,
    commissionPercent,
    fxRateUsed,
    totalMXN,
    adminNote,
    deliveryDaysMin = 7,
    deliveryDaysMax = 14,
  } = body ?? {};

  if (!title || !totalMXN) {
    return NextResponse.json({ error: "title and totalMXN required" }, { status: 400 });
  }

  const product = await prisma.importedProduct.create({
    data: {
      sourceUrl: mr.sourceUrl,
      store: store || new URL(mr.sourceUrl).hostname.replace(/^www\./, ""),
      title: String(title).trim(),
      imageUrl: imageUrl || null,
      priceUSD: Number(productCostUSD) || 0,
      currency: "USD",
      isSupported: true,
    },
  });

  const quote = await prisma.quote.create({
    data: {
      userId: mr.userId,
      productId: product.id,
      productPriceUSD: Number(productCostUSD) || 0,
      fxRate: Number(fxRateUsed) || 17.5,
      fxSpreadPercent: 0,
      takeRatePercent: Number(commissionPercent) || 0,
      shippingMarginUSD: (Number(shippingToSdUSD) || 0) + (Number(shippingToMxUSD) || 0),
      handlingFeeUSD: Number(handlingFeeUSD) || 0,
      customsBufferPercent: Number(customsBufferPercent) || 0,
      minMarginMXN: 0,
      totalMXN: Number(totalMXN),
      deliveryDaysMin,
      deliveryDaysMax,
      productCostUSD: Number(productCostUSD) || 0,
      shippingToSdUSD: Number(shippingToSdUSD) || 0,
      shippingToMxUSD: Number(shippingToMxUSD) || 0,
      commissionPercent: Number(commissionPercent) || 0,
      fxRateUsed: Number(fxRateUsed) || 17.5,
      adminSetPrice: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.manualRequest.update({
    where: { id },
    data: {
      status: "reviewed",
      quotedPriceMXN: Number(totalMXN),
      adminNote: adminNote || null,
    },
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || "";
  const quoteUrl = `${origin}/quote/${quote.id}`;

  if (mr.user.email) {
    const html = renderOrderEmail({
      customerName: mr.user.name,
      productTitle: product.title,
      productImageUrl: product.imageUrl,
      orderId: quote.id,
      statusLabel: "Tu precio está listo 🎉",
      body: `Preparamos un precio especial para ti: <strong>${formatMXN(Number(totalMXN))} MXN</strong>. Aprovéchalo dentro de las próximas 24 horas.`,
      trackingUrl: quoteUrl,
    });
    sendEmail({
      to: mr.user.email,
      subject: `Tu precio está listo — ${formatMXN(Number(totalMXN))}`,
      html,
    }).catch(() => {});
  }

  if (mr.whatsappNumber) {
    sendWhatsAppMessage(
      mr.whatsappNumber,
      `🎉 ¡Tu precio está listo! ${product.title} — ${formatMXN(Number(totalMXN))}. Compra ahora: ${quoteUrl}`
    ).catch(() => {});
  }

  return NextResponse.json({ success: true, quoteId: quote.id, quoteUrl });
}

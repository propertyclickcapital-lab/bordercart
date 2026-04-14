import axios from "axios";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderPrice } from "@/lib/pricing/engine";
import { getFxRate } from "@/lib/pricing/fx";
import { getActivePricingRule } from "@/lib/pricing-rule";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      "Product";

    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;

    let priceUSD = 0;
    const rawPrice =
      $('meta[property="og:price:amount"]').attr("content") ||
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[itemprop="price"]').attr("content") ||
      $("[data-price]").attr("data-price") ||
      null;

    if (rawPrice) {
      priceUSD = parseFloat(rawPrice.replace(/[^0-9.]/g, "")) || 0;
    }

    if (!priceUSD) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || "{}");
          const product = Array.isArray(json)
            ? json.find((j: any) => j["@type"] === "Product")
            : json["@type"] === "Product"
            ? json
            : null;
          if (product?.offers?.price) priceUSD = parseFloat(product.offers.price) || 0;
          if (product?.offers?.lowPrice) priceUSD = parseFloat(product.offers.lowPrice) || 0;
        } catch {}
      });
    }

    const hostname = new URL(url).hostname.replace("www.", "");

    if (!title || title === "Product") {
      throw new Error("Could not extract product data");
    }

    const product = await prisma.importedProduct.create({
      data: {
        sourceUrl: url,
        store: hostname,
        title: title.trim(),
        imageUrl,
        priceUSD: priceUSD || 50,
        currency: "USD",
        isSupported: true,
      },
    });

    const [fxRate, pricingRule, user] = await Promise.all([
      getFxRate(),
      getActivePricingRule(),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const breakdown = calculateOrderPrice({
      productPriceUSD: priceUSD || 50,
      userTier: user?.tier || "DEFAULT",
      fxRate,
      pricingRule,
    });

    const quote = await prisma.quote.create({
      data: {
        userId,
        productId: product.id,
        productPriceUSD: priceUSD || 50,
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

    return NextResponse.json({ success: true, quoteId: quote.id });
  } catch {
    const manualRequest = await prisma.manualRequest.create({
      data: { userId, sourceUrl: url, status: "pending" },
    });
    return NextResponse.json({ manual: true, requestId: manualRequest.id });
  }
}

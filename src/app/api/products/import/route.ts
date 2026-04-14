import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderPrice } from "@/lib/pricing/engine";
import { getFxRate } from "@/lib/pricing/fx";
import { getActivePricingRule } from "@/lib/pricing-rule";
import { scrapeWithOxylabs } from "@/lib/scraper/oxylabs";
import { logScrape } from "@/lib/scraper/fetch";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const hostname = new URL(url).hostname.replace(/^www\./, "");

  try {
    const html = await scrapeWithOxylabs(url);
    const $ = cheerio.load(html);

    let title = "";
    let imageUrl: string | null = null;
    let priceUSD = 0;
    let method = "";

    // 1) JSON-LD — most reliable
    $('script[type="application/ld+json"]').each((_, el) => {
      if (title && priceUSD) return;
      try {
        const json = JSON.parse($(el).html() || "{}");
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const type = item["@type"];
          if (type === "Product" || type === "IndividualProduct") {
            if (!title) title = item.name || "";
            if (!imageUrl) imageUrl = Array.isArray(item.image) ? item.image[0] : item.image || null;
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers?.price && !priceUSD) priceUSD = parseFloat(String(offers.price).replace(/[^0-9.]/g, "")) || 0;
            if (offers?.lowPrice && !priceUSD) priceUSD = parseFloat(String(offers.lowPrice).replace(/[^0-9.]/g, "")) || 0;
          }
        }
      } catch {}
    });
    if (title && priceUSD) method = "jsonld";

    // 2) Open Graph
    if (!title)
      title =
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        "";
    if (!imageUrl)
      imageUrl =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[property="og:image:url"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        null;
    if (!priceUSD) {
      const ogPrice =
        $('meta[property="og:price:amount"]').attr("content") ||
        $('meta[property="product:price:amount"]').attr("content");
      if (ogPrice) priceUSD = parseFloat(ogPrice.replace(/[^0-9.]/g, "")) || 0;
    }
    if (!method && title && priceUSD) method = "og";

    // 3) Nike specific
    if (!priceUSD && hostname.includes("nike.com")) {
      const nikePrice =
        $('[data-test="product-price"]').text() ||
        $('[class*="product-price"]').first().text() ||
        $('script:contains("currentPrice")').first().html() ||
        "";
      if (nikePrice) {
        const match = nikePrice.match(/\$?([\d,]+\.?\d*)/);
        if (match) priceUSD = parseFloat(match[1].replace(",", "")) || 0;
      }
      if (!title) title = $('h1[data-test="product-title"]').text() || $("h1").first().text();
      if (!imageUrl) imageUrl = $('[data-test="product-image"] img').attr("src") || $("picture img").first().attr("src") || null;
      if (priceUSD) method ||= "nike";
    }

    // 4) Target specific
    if (!priceUSD && hostname.includes("target.com")) {
      const targetPrice =
        $('[data-test="product-price"]').text() || $('[class*="CurrentPriceStyle"]').first().text() || "";
      if (targetPrice) priceUSD = parseFloat(targetPrice.replace(/[^0-9.]/g, "")) || 0;
      if (!title) title = $('[data-test="product-title"]').text() || $("h1").first().text();
      if (priceUSD) method ||= "target";
    }

    // 5) Lululemon specific
    if (!priceUSD && hostname.includes("lululemon.com")) {
      const lulPrice =
        $('[data-test="price"]').text() ||
        $('[class*="price"]').filter((_, el) => $(el).text().includes("$")).first().text() ||
        "";
      if (lulPrice) priceUSD = parseFloat(lulPrice.replace(/[^0-9.]/g, "")) || 0;
      if (priceUSD) method ||= "lululemon";
    }

    // 6) Sephora specific
    if (!priceUSD && hostname.includes("sephora.com")) {
      const sepPrice =
        $('[data-comp="Price"]').text() ||
        $('span[class*="css"]').filter((_, el) => !!$(el).text().match(/^\$[\d.]+$/)).first().text() ||
        "";
      if (sepPrice) priceUSD = parseFloat(sepPrice.replace(/[^0-9.]/g, "")) || 0;
      if (priceUSD) method ||= "sephora";
    }

    // 7) Bath & Body Works
    if (!priceUSD && hostname.includes("bathandbodyworks.com")) {
      const bbwPrice =
        $('[class*="product-price"]').first().text() || $('[class*="price"]').first().text() || "";
      if (bbwPrice) priceUSD = parseFloat(bbwPrice.replace(/[^0-9.]/g, "")) || 0;
      if (priceUSD) method ||= "bathandbodyworks";
    }

    // 8) Apple specific
    if (!priceUSD && hostname.includes("apple.com")) {
      const applePrice =
        $('[class*="price"]').first().text() || $('meta[name="price"]').attr("content") || "";
      if (applePrice) priceUSD = parseFloat(String(applePrice).replace(/[^0-9.]/g, "")) || 0;
      if (priceUSD) method ||= "apple";
    }

    // 9) Last resort — scan visible text for lone $xx.xx tokens
    if (!priceUSD) {
      $("*").each((_, el) => {
        if (priceUSD) return;
        const text = $(el).text().trim();
        if (text.match(/^\$[\d,]+\.?\d{0,2}$/) && !text.includes("\n")) {
          const price = parseFloat(text.replace(/[^0-9.]/g, ""));
          if (price > 1 && price < 10000) priceUSD = price;
        }
      });
      if (priceUSD) method ||= "lastresort";
    }

    if (!method) method = title && priceUSD ? "og" : "none";

    console.log("EXTRACTED:", {
      hostname,
      method,
      title: title.slice(0, 80),
      imageUrl: imageUrl?.slice(0, 80),
      priceUSD,
    });

    if (!title || title.length < 3) {
      logScrape(hostname, false, "no title extracted", method).catch(() => {});
      throw new Error("Could not extract product data");
    }

    logScrape(hostname, priceUSD > 0, priceUSD > 0 ? null : "no price extracted", method).catch(() => {});

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
  } catch (err) {
    console.log("IMPORT_FAILED:", { hostname, error: (err as Error)?.message });
    logScrape(hostname, false, (err as Error)?.message, "manual-review").catch(() => {});
    const manualRequest = await prisma.manualRequest.create({
      data: { userId, sourceUrl: url, status: "pending" },
    });
    return NextResponse.json({ manual: true, requestId: manualRequest.id });
  }
}

import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "../fetch";
import type { ScrapedProduct } from "../types";

export async function scrapeWalmart(url: string): Promise<ScrapedProduct> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    let title = "";
    let priceUSD = 0;
    let imageUrl: string | null = null;

    const ldJson = $('script[type="application/ld+json"]').first().text();
    try {
      const data = JSON.parse(ldJson);
      title = data.name || "";
      priceUSD = parseFloat(data.offers?.price || data.offers?.[0]?.price || "0");
      imageUrl = Array.isArray(data.image) ? data.image[0] : data.image || null;
    } catch {}

    if (!title) title = $('h1[itemprop="name"]').text().trim() || $("h1").first().text().trim();
    if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr("content") || null;
    if (!priceUSD) {
      const p = $('[itemprop="price"]').attr("content") || $('[data-automation-id="product-price"]').text();
      priceUSD = parseFloat((p || "0").replace(/[^0-9.]/g, ""));
    }

    const ok = !!title && priceUSD > 0;
    logScrape("walmart", ok);
    return { sourceUrl: url, store: "walmart", title: title || "Walmart product", imageUrl, priceUSD, currency: "USD", availability: null, isSupported: ok };
  } catch (e: any) {
    logScrape("walmart", false, e?.message);
    return { sourceUrl: url, store: "walmart", title: "Walmart product (manual review)", imageUrl: null, priceUSD: 0, currency: "USD", availability: null, isSupported: false };
  }
}

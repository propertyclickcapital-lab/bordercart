import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "../fetch";
import type { ScrapedProduct } from "../types";

export async function scrapeBestbuy(url: string): Promise<ScrapedProduct> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $(".sku-title h1").text().trim() || $('meta[property="og:title"]').attr("content") || "";
    const imageUrl = $('meta[property="og:image"]').attr("content") || null;
    const priceText = $(".priceView-customer-price span").first().text() || $('meta[itemprop="price"]').attr("content") || "";
    let priceUSD = parseFloat(priceText.replace(/[^0-9.]/g, ""));
    if (!priceUSD) {
      const m = html.match(/"currentPrice":\s*([\d.]+)/);
      if (m) priceUSD = parseFloat(m[1]);
    }
    const ok = !!title && priceUSD > 0;
    logScrape("bestbuy", ok);
    return { sourceUrl: url, store: "bestbuy", title: title || "Best Buy product", imageUrl, priceUSD: priceUSD || 0, currency: "USD", availability: null, isSupported: ok };
  } catch (e: any) {
    logScrape("bestbuy", false, e?.message);
    return { sourceUrl: url, store: "bestbuy", title: "Best Buy product (manual review)", imageUrl: null, priceUSD: 0, currency: "USD", availability: null, isSupported: false };
  }
}

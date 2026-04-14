import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "../fetch";
import type { ScrapedProduct } from "../types";

export async function scrapeTarget(url: string): Promise<ScrapedProduct> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $('h1[data-test="product-title"]').text().trim() || $('meta[property="og:title"]').attr("content") || "";
    const imageUrl = $('meta[property="og:image"]').attr("content") || null;
    const priceMeta = $('[data-test="product-price"]').first().text() || $('meta[itemprop="price"]').attr("content") || "";
    let priceUSD = parseFloat(priceMeta.replace(/[^0-9.]/g, ""));
    if (!priceUSD) {
      const m = html.match(/"current_retail":\s*([\d.]+)/);
      if (m) priceUSD = parseFloat(m[1]);
    }
    const ok = !!title && priceUSD > 0;
    logScrape("target", ok);
    return { sourceUrl: url, store: "target", title: title || "Target product", imageUrl, priceUSD: priceUSD || 0, currency: "USD", availability: null, isSupported: ok };
  } catch (e: any) {
    logScrape("target", false, e?.message);
    return { sourceUrl: url, store: "target", title: "Target product (manual review)", imageUrl: null, priceUSD: 0, currency: "USD", availability: null, isSupported: false };
  }
}

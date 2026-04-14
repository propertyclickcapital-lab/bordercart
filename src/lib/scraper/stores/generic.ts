import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "../fetch";
import { detectStore } from "../registry";
import type { ScrapedProduct } from "../types";

export async function scrapeGeneric(url: string): Promise<ScrapedProduct> {
  const store = detectStore(url)?.key || "other";
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('[itemprop="name"]').first().text().trim() ||
      $("title").text().trim() ||
      "";
    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('[itemprop="image"]').attr("content") ||
      $('[itemprop="image"]').attr("src") ||
      null;

    let priceUSD = 0;
    const metaPrice =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="og:price:amount"]').attr("content") ||
      $('meta[itemprop="price"]').attr("content") ||
      $('[itemprop="price"]').attr("content");
    if (metaPrice) priceUSD = parseFloat(metaPrice);

    if (!priceUSD) {
      $('script[type="application/ld+json"]').each((_, el) => {
        if (priceUSD) return;
        try {
          const data = JSON.parse($(el).text());
          const items = Array.isArray(data) ? data : [data];
          for (const it of items) {
            const type = it?.["@type"] || it?.["@graph"]?.[0]?.["@type"];
            if (type && String(type).toLowerCase().includes("product")) {
              const offer = it.offers?.[0] || it.offers;
              const p = offer?.price || offer?.lowPrice;
              if (p) { priceUSD = parseFloat(String(p)); return; }
            }
          }
        } catch {}
      });
    }

    const ok = !!title && priceUSD > 0;
    logScrape(store, ok);
    return {
      sourceUrl: url, store, title: title || "Product (manual review)",
      imageUrl, priceUSD: priceUSD || 0, currency: "USD", availability: null, isSupported: ok,
    };
  } catch (e: any) {
    logScrape(store, false, e?.message);
    return { sourceUrl: url, store, title: "Product (manual review)", imageUrl: null, priceUSD: 0, currency: "USD", availability: null, isSupported: false };
  }
}

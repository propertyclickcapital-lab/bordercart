import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "../fetch";
import type { ScrapedProduct } from "../types";

export async function scrapeAmazon(url: string): Promise<ScrapedProduct> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $("#productTitle").text().trim() || $("span#title").text().trim() || "";
    const priceWhole = $(".a-price-whole").first().text().replace(/[.,]/g, "").trim();
    const priceFrac = $(".a-price-fraction").first().text().trim();
    const priceText = $(".a-offscreen").first().text().trim();
    let priceUSD = 0;
    if (priceWhole) priceUSD = parseFloat(`${priceWhole}.${priceFrac || "00"}`);
    if (!priceUSD && priceText) priceUSD = parseFloat(priceText.replace(/[^0-9.]/g, ""));
    const imageUrl =
      $("#landingImage").attr("src") ||
      $("img#imgBlkFront").attr("src") ||
      $("img.a-dynamic-image").first().attr("src") ||
      null;
    const availability = $("#availability span").first().text().trim() || null;

    const ok = !!title && priceUSD > 0;
    logScrape("amazon", ok);
    return {
      sourceUrl: url, store: "amazon", title: title || "Amazon product",
      imageUrl, priceUSD: isFinite(priceUSD) ? priceUSD : 0,
      currency: "USD", availability, isSupported: ok,
    };
  } catch (e: any) {
    logScrape("amazon", false, e?.message);
    return { sourceUrl: url, store: "amazon", title: "Amazon product (manual review)", imageUrl: null, priceUSD: 0, currency: "USD", availability: null, isSupported: false };
  }
}

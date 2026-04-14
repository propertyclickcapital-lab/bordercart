import * as cheerio from "cheerio";
import { fetchHtml, logScrape } from "./fetch";
import type { SearchHit, GoogleResult } from "./types";

async function searchAmazon(q: string): Promise<SearchHit[]> {
  try {
    const html = await fetchHtml(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`);
    const $ = cheerio.load(html);
    const hits: SearchHit[] = [];
    $('[data-component-type="s-search-result"]').each((_, el) => {
      if (hits.length >= 8) return false;
      const $el = $(el);
      const title = $el.find("h2 span").first().text().trim();
      const href = $el.find("h2 a").attr("href");
      const imageUrl = $el.find("img.s-image").attr("src") || null;
      const priceWhole = $el.find(".a-price-whole").first().text().replace(/[,.]/g, "");
      const priceFrac = $el.find(".a-price-fraction").first().text();
      const priceUSD = priceWhole ? parseFloat(`${priceWhole}.${priceFrac || "00"}`) : 0;
      if (!title || !href || priceUSD <= 0) return;
      const sourceUrl = href.startsWith("http") ? href : `https://www.amazon.com${href}`;
      hits.push({ title, imageUrl, priceUSD, store: "amazon", sourceUrl });
    });
    logScrape("amazon-search", hits.length > 0);
    return hits;
  } catch (e: any) {
    logScrape("amazon-search", false, e?.message);
    return [];
  }
}

async function searchWalmart(q: string): Promise<SearchHit[]> {
  try {
    const html = await fetchHtml(`https://www.walmart.com/search?q=${encodeURIComponent(q)}`);
    const $ = cheerio.load(html);
    const hits: SearchHit[] = [];
    $('[data-item-id]').each((_, el) => {
      if (hits.length >= 8) return false;
      const $el = $(el);
      const title =
        $el.find('[data-automation-id="product-title"]').first().text().trim() ||
        $el.find("span.w_DJ").first().text().trim();
      const href = $el.find("a[link-identifier]").first().attr("href") || $el.find("a").first().attr("href");
      const imageUrl = $el.find("img").first().attr("src") || null;
      const priceText =
        $el.find('[data-automation-id="product-price"] .w_iUH7').first().text() ||
        $el.find("div.mr1").first().text();
      const priceUSD = parseFloat((priceText.match(/[\d.,]+/)?.[0] || "0").replace(/,/g, ""));
      if (!title || !href || priceUSD <= 0) return;
      const sourceUrl = href.startsWith("http") ? href : `https://www.walmart.com${href}`;
      hits.push({ title, imageUrl, priceUSD, store: "walmart", sourceUrl });
    });
    logScrape("walmart-search", hits.length > 0);
    return hits;
  } catch (e: any) {
    logScrape("walmart-search", false, e?.message);
    return [];
  }
}

export async function searchAllStores(query: string): Promise<SearchHit[]> {
  const [amz, wmt] = await Promise.all([searchAmazon(query), searchWalmart(query)]);
  const merged: SearchHit[] = [];
  const total = Math.max(amz.length, wmt.length);
  for (let i = 0; i < total; i++) {
    if (amz[i]) merged.push(amz[i]);
    if (wmt[i]) merged.push(wmt[i]);
    if (merged.length >= 12) break;
  }
  return merged.slice(0, 12);
}

export async function searchGoogle(query: string): Promise<GoogleResult[]> {
  try {
    const q = encodeURIComponent(`${query} site:amazon.com OR site:walmart.com OR site:target.com`);
    const html = await fetchHtml(`https://www.google.com/search?q=${q}`);
    const $ = cheerio.load(html);
    const out: GoogleResult[] = [];
    $("a").each((_, el) => {
      if (out.length >= 3) return false;
      const href = $(el).attr("href") || "";
      const m = href.match(/\/url\?q=(https?:\/\/[^&]+)/);
      const raw = m ? decodeURIComponent(m[1]) : null;
      if (!raw) return;
      const title = $(el).find("h3").first().text().trim();
      if (!title) return;
      let store = "other";
      if (raw.includes("amazon.com")) store = "amazon";
      else if (raw.includes("walmart.com")) store = "walmart";
      else if (raw.includes("target.com")) store = "target";
      if (!["amazon", "walmart", "target"].includes(store)) return;
      out.push({ title, sourceUrl: raw, store });
    });
    logScrape("google-search", out.length > 0);
    return out;
  } catch (e: any) {
    logScrape("google-search", false, e?.message);
    return [];
  }
}

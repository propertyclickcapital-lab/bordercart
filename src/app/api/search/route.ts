import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import * as cheerio from "cheerio";
import { searchGoogle } from "@/lib/scraper/search";
import { logScrape } from "@/lib/scraper/fetch";
import { oxylabsConfigured, searchWithOxylabs } from "@/lib/scraper/oxylabs";

type Hit = { title: string; imageUrl: string | null; priceUSD: number; store: string; sourceUrl: string };

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
};

async function get(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: HEADERS,
    timeout: 15000,
    maxRedirects: 5,
    responseType: "text",
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return typeof data === "string" ? data : String(data);
}

async function searchAmazon(q: string): Promise<Hit[]> {
  try {
    const html = await get(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`);
    const $ = cheerio.load(html);
    const hits: Hit[] = [];
    $('[data-component-type="s-search-result"]').each((_, el) => {
      if (hits.length >= 8) return false;
      const $el = $(el);
      const title = $el.find("h2 a span").first().text().trim();
      const href = $el.find("h2 a").attr("href");
      const imageUrl = $el.find("img.s-image").attr("src") || null;
      const priceWhole = $el.find(".a-price-whole").first().text().replace(/[,.]/g, "").trim();
      const priceFrac = $el.find(".a-price-fraction").first().text().trim();
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

async function searchWalmart(q: string): Promise<Hit[]> {
  try {
    const html = await get(`https://www.walmart.com/search?q=${encodeURIComponent(q)}`);
    const $ = cheerio.load(html);
    const hits: Hit[] = [];
    $("[data-item-id]").each((_, el) => {
      if (hits.length >= 8) return false;
      const $el = $(el);
      const title = $el.find("span.lh-title").first().text().trim();
      const priceText = $el.find('[data-automation="product-price"]').first().text();
      const priceUSD = parseFloat((priceText.match(/[\d.,]+/)?.[0] || "0").replace(/,/g, ""));
      const href = $el.find("a[link-identifier]").first().attr("href") || $el.find("a").first().attr("href");
      const imageUrl = $el.find("img").first().attr("src") || null;
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

async function searchTarget(q: string): Promise<Hit[]> {
  try {
    const html = await get(`https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`);
    const $ = cheerio.load(html);
    const hits: Hit[] = [];
    $('[data-test="@web/site-top-of-funnel/ProductCardWrapper"], a[data-test="product-title"]').each((_, el) => {
      if (hits.length >= 8) return false;
      const $card = $(el).closest("[data-test]");
      const title =
        $card.find('[data-test="product-title"]').first().text().trim() ||
        $(el).text().trim();
      const priceText = $card.find('[data-test="current-price"]').first().text();
      const priceUSD = parseFloat((priceText.match(/[\d.,]+/)?.[0] || "0").replace(/,/g, ""));
      const href = $card.find('a[data-test="product-title"]').attr("href") || $(el).attr("href");
      const imageUrl = $card.find("picture img").first().attr("src") || null;
      if (!title || !href || priceUSD <= 0) return;
      const sourceUrl = href.startsWith("http") ? href : `https://www.target.com${href}`;
      hits.push({ title, imageUrl, priceUSD, store: "target", sourceUrl });
    });
    logScrape("target-search", hits.length > 0);
    return hits;
  } catch (e: any) {
    logScrape("target-search", false, e?.message);
    return [];
  }
}

const MOCK_RESULTS: Hit[] = [
  { title: "Nike Air Force 1", priceUSD: 120, store: "amazon", sourceUrl: "https://www.amazon.com/s?k=nike+air+force+1", imageUrl: null },
  { title: "Apple AirPods Pro", priceUSD: 249, store: "amazon", sourceUrl: "https://www.amazon.com/s?k=airpods+pro", imageUrl: null },
  { title: 'Samsung 4K TV 55"', priceUSD: 499, store: "walmart", sourceUrl: "https://www.walmart.com/search?q=samsung+4k+tv", imageUrl: null },
  { title: "Levi's 501 Jeans", priceUSD: 59, store: "walmart", sourceUrl: "https://www.walmart.com/search?q=levis+501", imageUrl: null },
  { title: "Nike Running Shoes", priceUSD: 89, store: "target", sourceUrl: "https://www.target.com/s?searchTerm=nike+shoes", imageUrl: null },
  { title: "Apple Watch Series 9", priceUSD: 399, store: "target", sourceUrl: "https://www.target.com/s?searchTerm=apple+watch", imageUrl: null },
];

function normalizeOxylabsItem(raw: any, fallbackStore: string): Hit | null {
  if (!raw) return null;
  const title = raw.title || raw.name || raw.product_title;
  const priceRaw =
    raw.price ??
    raw.price_value ??
    raw.pricing?.price ??
    raw.price_str ??
    raw.currentPrice;
  const priceUSD = typeof priceRaw === "number" ? priceRaw : parseFloat(String(priceRaw || "0").replace(/[^0-9.]/g, ""));
  const url = raw.url || raw.link || raw.product_url;
  const imageUrl = raw.url_image || raw.thumbnail || raw.image || raw.image_url || null;
  if (!title || !url || !priceUSD) return null;
  return { title: String(title).trim(), imageUrl, priceUSD, store: fallbackStore, sourceUrl: String(url) };
}

async function oxylabsSearch(q: string): Promise<{ results: Hit[]; googleSuggestions: { title: string; sourceUrl: string; store: string }[] }> {
  const results: Hit[] = [];
  const googleSuggestions: { title: string; sourceUrl: string; store: string }[] = [];

  const [amzOk, wmtOk, gOk] = await Promise.allSettled([
    searchWithOxylabs(q, "amazon"),
    searchWithOxylabs(q, "walmart"),
    searchWithOxylabs(q, "google_shopping"),
  ]);

  function collect(settled: PromiseSettledResult<any>, store: string): Hit[] {
    if (settled.status !== "fulfilled") {
      logScrape(`oxylabs-${store}`, false, (settled.reason as Error)?.message).catch(() => {});
      return [];
    }
    logScrape(`oxylabs-${store}`, true).catch(() => {});
    const content = settled.value;
    const list: any[] =
      content?.results?.organic ??
      content?.results ??
      content?.products ??
      content?.items ??
      [];
    return list.map((x) => normalizeOxylabsItem(x, store)).filter((x): x is Hit => !!x).slice(0, 8);
  }

  const amz = collect(amzOk, "amazon");
  const wmt = collect(wmtOk, "walmart");
  const total = Math.max(amz.length, wmt.length);
  for (let i = 0; i < total; i++) {
    if (amz[i]) results.push(amz[i]);
    if (wmt[i]) results.push(wmt[i]);
    if (results.length >= 12) break;
  }

  if (gOk.status === "fulfilled") {
    const list: any[] =
      gOk.value?.results?.organic ?? gOk.value?.results?.paid ?? gOk.value?.results ?? [];
    for (const item of list) {
      if (googleSuggestions.length >= 3) break;
      const title = item.title || item.product_title;
      const url = item.url || item.link || item.product_url;
      if (!title || !url) continue;
      let store = "other";
      if (url.includes("amazon.com")) store = "amazon";
      else if (url.includes("walmart.com")) store = "walmart";
      else if (url.includes("target.com")) store = "target";
      googleSuggestions.push({ title: String(title), sourceUrl: String(url), store });
    }
  }

  return { results: results.slice(0, 12), googleSuggestions };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [], googleSuggestions: [] });

  if (oxylabsConfigured()) {
    try {
      const out = await oxylabsSearch(q);
      if (out.results.length > 0) return NextResponse.json(out);
      // fall through to direct scrape if Oxylabs returned empty
    } catch (e) {
      logScrape("oxylabs-search", false, (e as Error)?.message).catch(() => {});
    }
  }

  const [amz, wmt, tgt, googleSuggestions] = await Promise.all([
    searchAmazon(q),
    searchWalmart(q),
    searchTarget(q),
    searchGoogle(q),
  ]);

  const results: Hit[] = [];
  const total = Math.max(amz.length, wmt.length, tgt.length);
  for (let i = 0; i < total; i++) {
    if (amz[i]) results.push(amz[i]);
    if (wmt[i]) results.push(wmt[i]);
    if (tgt[i]) results.push(tgt[i]);
    if (results.length >= 12) break;
  }

  if (results.length === 0) {
    return NextResponse.json({ results: MOCK_RESULTS, googleSuggestions, mock: true });
  }

  return NextResponse.json({ results: results.slice(0, 12), googleSuggestions });
}

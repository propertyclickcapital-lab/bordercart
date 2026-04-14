import axios from "axios";
import * as cheerio from "cheerio";

const TEST_URL = process.argv[2] || "https://www.nike.com/t/air-force-1-07-mens-shoes-5QFp5Z";

const ox = await axios.post(
  "https://realtime.oxylabs.io/v1/queries",
  { source: "universal", url: TEST_URL, render: "html", geo_location: "United States", locale: "en-us" },
  { auth: { username: "crossborder_2CqEu", password: "evanamor21EC+" }, timeout: 90000 }
);
const html = ox.data.results[0].content;

const hostname = new URL(TEST_URL).hostname.replace(/^www\./, "");
const $ = cheerio.load(html);

let title = "";
let imageUrl = null;
let priceUSD = 0;
let method = "";

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

if (!title) title = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr("content") || null;
if (!priceUSD) {
  const og = $('meta[property="og:price:amount"]').attr("content") || $('meta[property="product:price:amount"]').attr("content");
  if (og) priceUSD = parseFloat(og.replace(/[^0-9.]/g, "")) || 0;
}
if (!method && title && priceUSD) method = "og";

if (!priceUSD && hostname.includes("nike.com")) {
  const nikePrice =
    $('[data-test="product-price"]').text() ||
    $('[class*="product-price"]').first().text() ||
    $('script:contains("currentPrice")').first().html() || "";
  const m = nikePrice.match(/\$?([\d,]+\.?\d*)/);
  if (m) priceUSD = parseFloat(m[1].replace(",", "")) || 0;
  if (!title) title = $('h1[data-test="product-title"]').text() || $("h1").first().text();
  if (!imageUrl) imageUrl = $('[data-test="product-image"] img').attr("src") || $("picture img").first().attr("src") || null;
  if (priceUSD) method ||= "nike";
}
if (!priceUSD && hostname.includes("target.com")) {
  const t = $('[data-test="product-price"]').text() || $('[class*="CurrentPriceStyle"]').first().text();
  if (t) priceUSD = parseFloat(t.replace(/[^0-9.]/g, "")) || 0;
  if (!title) title = $('[data-test="product-title"]').text() || $("h1").first().text();
  if (priceUSD) method ||= "target";
}
if (!priceUSD && hostname.includes("lululemon.com")) {
  const l = $('[data-test="price"]').text() || $('[class*="price"]').filter((_, el) => $(el).text().includes("$")).first().text();
  if (l) priceUSD = parseFloat(l.replace(/[^0-9.]/g, "")) || 0;
  if (priceUSD) method ||= "lululemon";
}
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

if (!method) method = "none";

console.log(JSON.stringify({
  url: TEST_URL,
  hostname,
  method,
  title: title.slice(0, 80),
  imageUrl: imageUrl?.slice(0, 80),
  priceUSD,
  htmlLength: html.length,
}, null, 2));

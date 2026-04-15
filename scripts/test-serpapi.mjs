import axios from "axios";

const SERPAPI_KEY = "63aa869377857104d9a1d13544adba7bdf400ab2f22ccd247e80bbfc2f0ccc71";

function extractSlugFromUrl(url) {
  const pathname = new URL(url).pathname;
  return pathname
    .replace(/\//g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\.(html|htm|php|aspx)$/i, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2 && !/^(dp|ip|p|t|us|en|product|item|shop|buy|store|www|com|html|htm)$/i.test(w))
    .slice(0, 8)
    .join(" ");
}

function getStoreName(url) {
  return new URL(url).hostname.replace("www.", "").split(".")[0];
}

async function importByUrl(url) {
  const slug = extractSlugFromUrl(url);
  const storeName = getStoreName(url);
  const q = `${slug} ${storeName}`.trim();
  console.log(`URL: ${url}`);
  console.log(`Query: "${q}"`);
  const r = await axios.get("https://serpapi.com/search.json", {
    params: { engine: "google_shopping", q, gl: "us", hl: "en", api_key: SERPAPI_KEY },
    timeout: 20000,
  });
  const list = r.data.shopping_results || [];
  if (!list.length) { console.log("  (no shopping_results)"); return; }
  let best = list[0];
  for (const x of list) if (x.source?.toLowerCase().includes(storeName.toLowerCase())) { best = x; break; }
  console.log(`  title: ${best.title?.slice(0, 80)}`);
  console.log(`  price: ${best.price}`);
  console.log(`  source: ${best.source}`);
  console.log(`  thumbnail: ${best.thumbnail ? "yes" : "no"}`);
  console.log(`  link: ${(best.link || "").slice(0, 80)}`);
  console.log(`  total results: ${list.length}`);
}

async function search(q) {
  console.log(`SEARCH: "${q}"`);
  const r = await axios.get("https://serpapi.com/search.json", {
    params: { engine: "google_shopping", q, gl: "us", hl: "en", api_key: SERPAPI_KEY },
    timeout: 20000,
  });
  const list = (r.data.shopping_results || []).slice(0, 6);
  console.log(`  ${list.length} hits (top 6):`);
  for (const x of list) {
    console.log(`  - ${x.title?.slice(0, 70)} | ${x.price} | ${x.source}`);
  }
}

const urls = [
  "https://www.nike.com/t/air-force-1-07-mens-shoes-5QFp5Z",
  "https://www.amazon.com/dp/B09V3KXJPB",
  "https://www.lululemon.com/en-us/p/align-high-rise-pant/LW5ARAS.html",
];

for (const u of urls) {
  console.log("\n===============================");
  try { await importByUrl(u); } catch (e) { console.log("  ERROR:", e.response?.data || e.message); }
}

console.log("\n===============================");
try { await search("nike air force 1"); } catch (e) { console.log("  ERROR:", e.response?.data || e.message); }

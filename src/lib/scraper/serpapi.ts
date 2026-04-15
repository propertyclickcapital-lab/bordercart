import axios from "axios";

const SERPAPI_KEY = process.env.SERPAPI_KEY!;
const SERPAPI_URL = "https://serpapi.com/search.json";

export interface ProductResult {
  title: string;
  imageUrl: string | null;
  priceUSD: number;
  store: string;
  sourceUrl: string;
}

function extractSlugFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname
      .replace(/\//g, " ")
      .replace(/[-_]/g, " ")
      .replace(/\.(html|htm|php|aspx)$/i, "")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(
        (w) =>
          w.length > 2 &&
          !/^(dp|ip|p|t|us|en|product|item|shop|buy|store|www|com|html|htm)$/i.test(w)
      )
      .slice(0, 8)
      .join(" ");
  } catch {
    return "";
  }
}

function getStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "").split(".")[0];
  } catch {
    return "US Store";
  }
}

export async function searchProductByUrl(url: string): Promise<ProductResult> {
  const slug = extractSlugFromUrl(url);
  const storeName = getStoreName(url);
  const query = `${slug} ${storeName}`.trim();

  if (!query || query.length < 5) throw new Error("Could not extract search query from URL");

  const response = await axios.get(SERPAPI_URL, {
    params: {
      engine: "google_shopping",
      q: query,
      gl: "us",
      hl: "en",
      api_key: SERPAPI_KEY,
    },
    timeout: 15000,
  });

  const results = response.data.shopping_results || [];
  if (results.length === 0) throw new Error("No results found");

  // Prefer results from the same store
  let best = results[0];
  for (const r of results) {
    if (r.source?.toLowerCase().includes(storeName.toLowerCase())) {
      best = r;
      break;
    }
  }

  return {
    title: best.title || "",
    imageUrl: best.thumbnail || null,
    priceUSD: parseFloat(String(best.price || "0").replace(/[^0-9.]/g, "")) || 0,
    store: best.source || storeName,
    sourceUrl: best.link || url,
  };
}

export async function searchProducts(query: string): Promise<ProductResult[]> {
  const response = await axios.get(SERPAPI_URL, {
    params: {
      engine: "google_shopping",
      q: query,
      gl: "us",
      hl: "en",
      api_key: SERPAPI_KEY,
    },
    timeout: 15000,
  });

  const results = response.data.shopping_results || [];

  return results
    .slice(0, 12)
    .map((item: any) => ({
      title: item.title || "",
      imageUrl: item.thumbnail || null,
      priceUSD: parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0,
      store: item.source || "US Store",
      sourceUrl: item.link || "",
    }))
    .filter((r: ProductResult) => r.title && r.priceUSD > 0);
}

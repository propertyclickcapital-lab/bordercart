import { NextRequest, NextResponse } from "next/server";
import { searchWithOxylabs } from "@/lib/scraper/oxylabs";

type Hit = { title: string; imageUrl: string | null; priceUSD: number; store: string; sourceUrl: string };

function normStore(s: string | undefined | null): string {
  if (!s) return "other";
  const l = String(s).toLowerCase();
  if (l.includes("amazon")) return "amazon";
  if (l.includes("walmart")) return "walmart";
  if (l.includes("target")) return "target";
  if (l.includes("best buy") || l.includes("bestbuy")) return "bestbuy";
  if (l.includes("nike")) return "nike";
  return l.replace(/\s+/g, "-");
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query) return NextResponse.json({ results: [] });

  try {
    const [amazonResults, googleResults] = await Promise.allSettled([
      searchWithOxylabs(query, "amazon"),
      searchWithOxylabs(query, "google_shopping"),
    ]);

    const results: Hit[] = [];

    // Parse Amazon results
    if (amazonResults.status === "fulfilled") {
      const items = amazonResults.value?.results || [];
      items.slice(0, 6).forEach((item: any) => {
        const sourceUrl = item.asin
          ? `https://www.amazon.com/dp/${item.asin}`
          : item.url;
        if (!sourceUrl) return;
        results.push({
          title: item.title,
          imageUrl: item.url_image || item.image || null,
          priceUSD: parseFloat(String(item.price || item.price_upper || 0).replace(/[^0-9.]/g, "")) || 0,
          store: "amazon",
          sourceUrl,
        });
      });
    }

    // Parse Google Shopping results
    if (googleResults.status === "fulfilled") {
      const items = googleResults.value?.results?.organic || [];
      items.slice(0, 6).forEach((item: any) => {
        if (!item.url) return;
        results.push({
          title: item.title,
          imageUrl: item.image || null,
          priceUSD: parseFloat(String(item.price || 0).replace(/[^0-9.]/g, "")) || 0,
          store: normStore(item.merchant || item.seller),
          sourceUrl: item.url,
        });
      });
    }

    return NextResponse.json({ results: results.slice(0, 12) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/scraper/serpapi";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await searchProducts(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

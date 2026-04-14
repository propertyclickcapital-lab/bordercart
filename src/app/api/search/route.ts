import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchAllStores, searchGoogle } from "@/lib/scraper/search";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [], googleSuggestions: [] });

  const [results, googleSuggestions] = await Promise.all([searchAllStores(q), searchGoogle(q)]);
  return NextResponse.json({ results, googleSuggestions });
}

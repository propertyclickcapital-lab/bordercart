const FALLBACK_RATE = 17.5;
const CACHE_MS = 15 * 60 * 1000;

let cached: { rate: number; ts: number } | null = null;

export async function getFxRate(): Promise<number> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_MS) return cached.rate;
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { next: { revalidate: 900 } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const rate = data?.rates?.MXN;
    if (typeof rate === "number" && rate > 0) {
      cached = { rate, ts: now };
      return rate;
    }
    throw new Error();
  } catch {
    cached = { rate: FALLBACK_RATE, ts: now };
    return FALLBACK_RATE;
  }
}

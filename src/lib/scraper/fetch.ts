import axios from "axios";
import { prisma } from "../prisma";
import { oxylabsConfigured, scrapeWithOxylabs } from "./oxylabs";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
];

async function directFetch(url: string, timeoutMs: number): Promise<string> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const { data } = await axios.get<string>(url, {
    headers: {
      "User-Agent": ua,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: timeoutMs,
    maxRedirects: 5,
    responseType: "text",
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return typeof data === "string" ? data : String(data);
}

export async function fetchHtml(url: string, timeoutMs = 30000): Promise<string> {
  if (oxylabsConfigured()) {
    try {
      return await scrapeWithOxylabs(url);
    } catch (e) {
      logScrape("oxylabs-fallback", false, (e as Error)?.message).catch(() => {});
      return directFetch(url, timeoutMs);
    }
  }
  return directFetch(url, timeoutMs);
}

export async function logScrape(store: string, success: boolean, errorMessage?: string, method?: string) {
  try {
    await prisma.scrapingLog.create({
      data: { store, success, errorMessage: errorMessage ?? null, method: method ?? null },
    });
  } catch {
    // ignore
  }
}

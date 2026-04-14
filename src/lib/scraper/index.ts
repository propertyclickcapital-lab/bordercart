import { detectStore } from "./registry";
import { scrapeAmazon } from "./stores/amazon";
import { scrapeWalmart } from "./stores/walmart";
import { scrapeTarget } from "./stores/target";
import { scrapeBestbuy } from "./stores/bestbuy";
import { scrapeGeneric } from "./stores/generic";
import type { ScrapedProduct } from "./types";

export type { ScrapedProduct };

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const store = detectStore(url);
  switch (store?.key) {
    case "amazon": return scrapeAmazon(url);
    case "walmart": return scrapeWalmart(url);
    case "target": return scrapeTarget(url);
    case "bestbuy": return scrapeBestbuy(url);
    default: return scrapeGeneric(url);
  }
}

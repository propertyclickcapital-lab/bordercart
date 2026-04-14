export interface ScrapedProduct {
  sourceUrl: string;
  store: string;
  title: string;
  imageUrl: string | null;
  priceUSD: number;
  currency: string;
  availability: string | null;
  isSupported: boolean;
  rawData?: Record<string, unknown>;
}

export interface SearchHit {
  title: string;
  imageUrl: string | null;
  priceUSD: number;
  store: string;
  sourceUrl: string;
}

export interface GoogleResult {
  title: string;
  sourceUrl: string;
  store: string;
}

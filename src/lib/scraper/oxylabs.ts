import axios from "axios";

const OXYLABS_URL = "https://realtime.oxylabs.io/v1/querys";

export function oxylabsConfigured(): boolean {
  return !!process.env.OXYLABS_USERNAME && !!process.env.OXYLABS_PASSWORD;
}

export async function scrapeWithOxylabs(url: string): Promise<string> {
  const response = await axios.post(
    OXYLABS_URL,
    {
      source: "universal",
      url,
      render: "html",
      browser_instructions: [{ type: "wait", value: 2000 }],
    },
    {
      auth: {
        username: process.env.OXYLABS_USERNAME!,
        password: process.env.OXYLABS_PASSWORD!,
      },
      timeout: 30000,
    }
  );
  return response.data.results[0].content;
}

export async function searchWithOxylabs(
  query: string,
  store: "amazon" | "walmart" | "google_shopping" = "google_shopping"
): Promise<any> {
  const sourceMap = {
    amazon: "amazon_search",
    walmart: "walmart_search",
    google_shopping: "google_shopping",
  };
  const response = await axios.post(
    OXYLABS_URL,
    {
      source: sourceMap[store],
      query,
      parse: true,
      context: [{ key: "language", value: "en_us" }],
    },
    {
      auth: {
        username: process.env.OXYLABS_USERNAME!,
        password: process.env.OXYLABS_PASSWORD!,
      },
      timeout: 30000,
    }
  );
  return response.data.results[0].content;
}

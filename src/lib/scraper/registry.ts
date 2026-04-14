export type StoreCategory =
  | "Electronics" | "Fashion" | "Beauty" | "Home" | "Sports"
  | "Shoes" | "Luxury" | "Auto" | "Pets" | "Baby" | "Books" | "Office" | "Food";

export interface StoreConfig {
  key: string;
  name: string;
  domain: string;
  category: StoreCategory;
  color: string;
  supported?: boolean;
}

export const STORE_REGISTRY: StoreConfig[] = [
  // Electronics
  { key: "amazon", name: "Amazon", domain: "amazon.com", category: "Electronics", color: "#ff9900", supported: true },
  { key: "bestbuy", name: "Best Buy", domain: "bestbuy.com", category: "Electronics", color: "#003b72", supported: true },
  { key: "newegg", name: "Newegg", domain: "newegg.com", category: "Electronics", color: "#f60" },
  { key: "apple", name: "Apple", domain: "apple.com", category: "Electronics", color: "#0f1111" },
  { key: "bh", name: "B&H Photo", domain: "bhphotovideo.com", category: "Electronics", color: "#333" },
  { key: "microcenter", name: "Micro Center", domain: "microcenter.com", category: "Electronics", color: "#e30613" },

  // General marketplace
  { key: "walmart", name: "Walmart", domain: "walmart.com", category: "Home", color: "#0071ce", supported: true },
  { key: "target", name: "Target", domain: "target.com", category: "Home", color: "#cc0000", supported: true },
  { key: "costco", name: "Costco", domain: "costco.com", category: "Home", color: "#005daa" },
  { key: "samsclub", name: "Sam's Club", domain: "samsclub.com", category: "Home", color: "#0078bb" },

  // Fashion
  { key: "hm", name: "H&M", domain: "hm.com", category: "Fashion", color: "#e50010" },
  { key: "zara", name: "Zara", domain: "zara.com", category: "Fashion", color: "#0f1111" },
  { key: "gap", name: "Gap", domain: "gap.com", category: "Fashion", color: "#002868" },
  { key: "oldnavy", name: "Old Navy", domain: "oldnavy.com", category: "Fashion", color: "#003da5" },
  { key: "forever21", name: "Forever 21", domain: "forever21.com", category: "Fashion", color: "#ffcc00" },
  { key: "asos", name: "ASOS", domain: "asos.com", category: "Fashion", color: "#0f1111" },
  { key: "urbanoutfitters", name: "Urban Outfitters", domain: "urbanoutfitters.com", category: "Fashion", color: "#6d3f00" },
  { key: "anthropologie", name: "Anthropologie", domain: "anthropologie.com", category: "Fashion", color: "#7d3c00" },
  { key: "freepeople", name: "Free People", domain: "freepeople.com", category: "Fashion", color: "#8b6f47" },
  { key: "nordstrom", name: "Nordstrom", domain: "nordstrom.com", category: "Fashion", color: "#0f1111" },
  { key: "macys", name: "Macy's", domain: "macys.com", category: "Fashion", color: "#e21a2c" },
  { key: "bloomingdales", name: "Bloomingdale's", domain: "bloomingdales.com", category: "Fashion", color: "#0f1111" },
  { key: "kohls", name: "Kohl's", domain: "kohls.com", category: "Fashion", color: "#8e44ad" },
  { key: "jcpenney", name: "JCPenney", domain: "jcpenney.com", category: "Fashion", color: "#cc0000" },
  { key: "bananarepublic", name: "Banana Republic", domain: "bananarepublic.gap.com", category: "Fashion", color: "#0f1111" },
  { key: "pacsun", name: "PacSun", domain: "pacsun.com", category: "Fashion", color: "#0f1111" },
  { key: "ralphlauren", name: "Ralph Lauren", domain: "ralphlauren.com", category: "Fashion", color: "#00395e" },
  { key: "tommyhilfiger", name: "Tommy Hilfiger", domain: "tommy.com", category: "Fashion", color: "#002d72" },
  { key: "calvinklein", name: "Calvin Klein", domain: "calvinklein.us", category: "Fashion", color: "#0f1111" },

  // Luxury
  { key: "saks", name: "Saks Fifth Avenue", domain: "saksfifthavenue.com", category: "Luxury", color: "#0f1111" },
  { key: "neimanmarcus", name: "Neiman Marcus", domain: "neimanmarcus.com", category: "Luxury", color: "#7a1f2b" },
  { key: "coach", name: "Coach", domain: "coach.com", category: "Luxury", color: "#895531" },
  { key: "michaelkors", name: "Michael Kors", domain: "michaelkors.com", category: "Luxury", color: "#0f1111" },
  { key: "katespade", name: "Kate Spade", domain: "katespade.com", category: "Luxury", color: "#000" },

  // Shoes
  { key: "nike", name: "Nike", domain: "nike.com", category: "Shoes", color: "#0f1111", supported: true },
  { key: "adidas", name: "Adidas", domain: "adidas.com", category: "Shoes", color: "#0f1111" },
  { key: "footlocker", name: "Foot Locker", domain: "footlocker.com", category: "Shoes", color: "#000" },
  { key: "dsw", name: "DSW", domain: "dsw.com", category: "Shoes", color: "#e31837" },
  { key: "stevemadden", name: "Steve Madden", domain: "stevemadden.com", category: "Shoes", color: "#000" },
  { key: "vans", name: "Vans", domain: "vans.com", category: "Shoes", color: "#000" },
  { key: "converse", name: "Converse", domain: "converse.com", category: "Shoes", color: "#000" },
  { key: "skechers", name: "Skechers", domain: "skechers.com", category: "Shoes", color: "#004aa3" },
  { key: "ugg", name: "UGG", domain: "ugg.com", category: "Shoes", color: "#7b4e2f" },

  // Beauty
  { key: "sephora", name: "Sephora", domain: "sephora.com", category: "Beauty", color: "#000" },
  { key: "ulta", name: "Ulta", domain: "ulta.com", category: "Beauty", color: "#c41d57" },
  { key: "bathandbodyworks", name: "Bath & Body Works", domain: "bathandbodyworks.com", category: "Beauty", color: "#003c7e" },
  { key: "walgreens", name: "Walgreens", domain: "walgreens.com", category: "Beauty", color: "#e31837" },
  { key: "cvs", name: "CVS", domain: "cvs.com", category: "Beauty", color: "#cc0000" },

  // Home
  { key: "ikea", name: "IKEA", domain: "ikea.com", category: "Home", color: "#0058a3" },
  { key: "homedepot", name: "Home Depot", domain: "homedepot.com", category: "Home", color: "#f96302" },
  { key: "lowes", name: "Lowe's", domain: "lowes.com", category: "Home", color: "#004990" },
  { key: "wayfair", name: "Wayfair", domain: "wayfair.com", category: "Home", color: "#7a3ba3" },
  { key: "crateandbarrel", name: "Crate & Barrel", domain: "crateandbarrel.com", category: "Home", color: "#000" },
  { key: "williamssonoma", name: "Williams-Sonoma", domain: "williams-sonoma.com", category: "Home", color: "#000" },
  { key: "potterybarn", name: "Pottery Barn", domain: "potterybarn.com", category: "Home", color: "#624a2e" },
  { key: "westelm", name: "West Elm", domain: "westelm.com", category: "Home", color: "#000" },

  // Sports
  { key: "dicks", name: "Dick's Sporting Goods", domain: "dickssportinggoods.com", category: "Sports", color: "#00704a" },
  { key: "rei", name: "REI", domain: "rei.com", category: "Sports", color: "#004225" },
  { key: "underarmour", name: "Under Armour", domain: "underarmour.com", category: "Sports", color: "#000" },
  { key: "lululemon", name: "Lululemon", domain: "lululemon.com", category: "Sports", color: "#d52b1e" },
  { key: "patagonia", name: "Patagonia", domain: "patagonia.com", category: "Sports", color: "#003366" },
  { key: "northface", name: "The North Face", domain: "thenorthface.com", category: "Sports", color: "#000" },

  // Baby / Toys
  { key: "toysrus", name: "Toys R Us", domain: "toysrus.com", category: "Baby", color: "#003893" },
  { key: "lego", name: "LEGO", domain: "lego.com", category: "Baby", color: "#ffcf00" },
  { key: "carters", name: "Carter's", domain: "carters.com", category: "Baby", color: "#c41e3a" },

  // Pets
  { key: "petsmart", name: "PetSmart", domain: "petsmart.com", category: "Pets", color: "#004990" },
  { key: "petco", name: "Petco", domain: "petco.com", category: "Pets", color: "#1e5aa3" },
  { key: "chewy", name: "Chewy", domain: "chewy.com", category: "Pets", color: "#1b3bdd" },

  // Auto
  { key: "autozone", name: "AutoZone", domain: "autozone.com", category: "Auto", color: "#f58220" },

  // Office / Books
  { key: "staples", name: "Staples", domain: "staples.com", category: "Office", color: "#cc0000" },
  { key: "barnesnoble", name: "Barnes & Noble", domain: "barnesandnoble.com", category: "Books", color: "#006934" },

  // Health / Food
  { key: "gnc", name: "GNC", domain: "gnc.com", category: "Food", color: "#000" },
  { key: "iherb", name: "iHerb", domain: "iherb.com", category: "Food", color: "#00a859" },
];

export function detectStore(url: string): StoreConfig | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return STORE_REGISTRY.find((s) => host === s.domain || host.endsWith(`.${s.domain}`)) || null;
  } catch {
    return null;
  }
}

export function isSupported(url: string): boolean {
  return !!detectStore(url)?.supported;
}

export function storesByCategory(): Record<StoreCategory, StoreConfig[]> {
  const grouped: Partial<Record<StoreCategory, StoreConfig[]>> = {};
  for (const s of STORE_REGISTRY) {
    (grouped[s.category] ||= []).push(s);
  }
  return grouped as Record<StoreCategory, StoreConfig[]>;
}

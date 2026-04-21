import axios from 'axios'

const SERPAPI_KEY = process.env.SERPAPI_KEY!
const SERPAPI_URL = 'https://serpapi.com/search.json'

export interface ProductResult {
  title: string
  imageUrl: string | null
  priceUSD: number
  store: string
  sourceUrl: string
  availableSizes: string[]
  availableColors: string[]
  variantImages: string[]
}

function extractAsin(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                url.match(/\/([A-Z0-9]{10})(?:\/|\?|$)/)
  return match?.[1] || null
}

function extractWalmartName(url: string): string {
  const match = url.match(/\/ip\/([^\/\?]+)/)
  if (match) return decodeURIComponent(match[1]).replace(/-/g, ' ')
  return ''
}

function extractSlug(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const slug = pathname
      .split('/')
      .filter(s => s.length > 3)
      .pop() || ''
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/\.(html|htm|php|aspx)$/i, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

function getStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '').split('.')[0]
  } catch {
    return 'US Store'
  }
}

function extractPrice(raw: any): number {
  if (!raw) return 0
  const match = String(raw).match(/[\d,]+\.?\d{0,2}/)
  if (!match) return 0
  const price = parseFloat(match[0].replace(',', ''))
  if (price < 1 || price > 50000) return 0
  return price
}

function scoreMatch(result: any, slugWords: string[], storeName: string): number {
  let score = 0
  const title = (result.title || '').toLowerCase()
  const source = (result.source || '').toLowerCase()
  if (source.includes(storeName.toLowerCase())) score += 50
  slugWords.forEach(word => { if (title.includes(word)) score += 10 })
  if (result.price) score += 5
  if (result.thumbnail) score += 5
  return score
}

function extractColors(results: any[]): string[] {
  const colorList = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey', 'gray', 'navy', 'beige', 'cream', 'gold', 'silver', 'tan', 'coral', 'teal', 'burgundy', 'maroon', 'olive', 'mint', 'lavender']
  const found = new Set<string>()
  results.forEach(r => {
    const title = (r.title || '').toLowerCase()
    colorList.forEach(color => {
      if (title.includes(color)) found.add(color.charAt(0).toUpperCase() + color.slice(1))
    })
  })
  return Array.from(found).slice(0, 12)
}

function extractSizes(results: any[]): string[] {
  const found = new Set<string>()
  results.forEach(r => {
    const title = r.title || ''
    // Shoe sizes: 5, 5.5, 6 ... 15, with optional US/UK/EU
    const shoeMatches = title.match(/\b([5-9]|1[0-5])(?:\.5)?\s*(?:US|UK|EU|M|W)?\b/g)
    if (shoeMatches) shoeMatches.forEach((s: string) => found.add(s.trim()))
    // Clothing sizes
    const clothingMatches = title.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\b/g)
    if (clothingMatches) clothingMatches.forEach((s: string) => found.add(s.trim()))
    // Waist/inseam for pants
    const pantMatches = title.match(/\b([2-4][0-9])(?:x[0-9]+)?\b/g)
    if (pantMatches) pantMatches.forEach((s: string) => found.add(s.trim()))
  })
  // Sort sizes logically
  const clothingOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL']
  return Array.from(found)
    .sort((a, b) => {
      const ai = clothingOrder.indexOf(a)
      const bi = clothingOrder.indexOf(b)
      if (ai >= 0 && bi >= 0) return ai - bi
      return parseFloat(a) - parseFloat(b) || a.localeCompare(b)
    })
    .slice(0, 16)
}

export async function searchProductByUrl(url: string): Promise<ProductResult> {
  const hostname = new URL(url).hostname.replace('www.', '')
  const storeName = getStoreName(url)
  let query = ''

  // Build precise query per store
  if (hostname.includes('amazon')) {
    const asin = extractAsin(url)
    query = asin ? asin : extractSlug(url)
  } else if (hostname.includes('walmart')) {
    query = extractWalmartName(url) || extractSlug(url)
  } else {
    query = `${extractSlug(url)} ${storeName}`
  }

  if (!query || query.length < 3) throw new Error('Could not build query from URL')

  const response = await axios.get(SERPAPI_URL, {
    params: {
      engine: 'google_shopping',
      q: query,
      gl: 'us',
      hl: 'en',
      num: 20,
      api_key: SERPAPI_KEY,
    },
    timeout: 15000,
  })

  const results = response.data.shopping_results || []
  if (results.length === 0) throw new Error('No results found')

  // Score and rank results
  const slugWords = query.toLowerCase().split(' ').filter(w => w.length > 3)
  const scored = results.map((r: any) => ({
    ...r,
    _score: scoreMatch(r, slugWords, storeName)
  }))
  scored.sort((a: any, b: any) => b._score - a._score)
  const best = scored[0]

  // Extract variants from all results
  const colors = extractColors(results)
  const sizes = extractSizes(results)
  const variantImages = results
    .map((r: any) => r.thumbnail)
    .filter((img: string | null) => img && img !== best.thumbnail)
    .filter((img: string, i: number, arr: string[]) => arr.indexOf(img) === i)
    .slice(0, 8)

  return {
    title: best.title || '',
    imageUrl: best.thumbnail || null,
    priceUSD: extractPrice(best.price || best.extracted_price),
    store: best.source || storeName,
    sourceUrl: url,
    availableSizes: sizes,
    availableColors: colors,
    variantImages,
  }
}

export async function searchProducts(query: string): Promise<ProductResult[]> {
  const response = await axios.get(SERPAPI_URL, {
    params: {
      engine: 'google_shopping',
      q: query,
      gl: 'us',
      hl: 'en',
      num: 20,
      api_key: SERPAPI_KEY,
    },
    timeout: 15000,
  })

  const results = response.data.shopping_results || []

  return results.slice(0, 12).map((item: any) => ({
    title: item.title || '',
    imageUrl: item.thumbnail || null,
    priceUSD: extractPrice(item.price || item.extracted_price),
    store: item.source || 'US Store',
    sourceUrl: item.link || '',
    availableSizes: [],
    availableColors: [],
    variantImages: [],
  })).filter((r: ProductResult) => r.title && r.priceUSD > 0)
}

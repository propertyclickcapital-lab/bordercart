import axios from 'axios'

const DEFAULT_URL = 'https://www.nike.com/t/court-vision-low-next-nature-mens-shoes-zX42Np'

async function test(targetUrl: string) {
  console.log('\n===============================')
  console.log('Testing URL:', targetUrl)
  console.log('===============================')

  const response = await axios.post(
    'https://realtime.oxylabs.io/v1/queries',
    {
      source: 'universal',
      url: targetUrl,
      render: 'html',
      geo_location: 'United States',
      locale: 'en-us',
      browser_instructions: [
        {
          type: 'wait_for_element',
          selector: { type: 'css', value: 'h1' },
          wait_time_s: 10,
        },
        {
          type: 'wait',
          wait_time_s: 3,
        },
      ],
    },
    {
      auth: {
        username: 'crossborder_2CqEu',
        password: 'evanamor21EC+',
      },
      timeout: 60000,
    }
  )

  const html = response.data.results[0].content
  console.log('Status:', response.status)
  console.log('HTML length:', html.length)
  console.log('First 1000 chars:', html.substring(0, 1000))

  // Check for price
  const priceMatch = html.match(/\$[\d,]+\.?\d{0,2}/)
  console.log('First price found:', priceMatch?.[0])

  // Check for product title
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s)
  console.log('H1:', h1Match?.[1]?.replace(/<[^>]*>/g, '').trim().substring(0, 100))

  // Check for JSON-LD
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
  console.log('JSON-LD found:', !!jsonLdMatch)
  if (jsonLdMatch) console.log('JSON-LD preview:', jsonLdMatch[1].substring(0, 300))
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : [DEFAULT_URL]

;(async () => {
  for (const u of urls) {
    try {
      await test(u)
    } catch (err: any) {
      console.error('ERROR for', u, ':', err.response?.data || err.message)
    }
  }
})()

interface Competitor {
  name: string
  domain: string
  address: string
  placeId: string
  distance?: string
  seMetrics?: SEMetrics
}

interface SEMetrics {
  organicKeywords?: number
  organicTraffic?: number
  domainAuthority?: number
}

interface PlaceResult {
  displayName?: { text: string }
  websiteUri?: string
  formattedAddress?: string
  id?: string
}

const COMPETITOR_TIMEOUT_MS = 10_000
const MAX_RESULTS = 5
const USER_AGENT = 'ZintasBot/1.0 (+https://zintas.ai)'
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'

async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), COMPETITOR_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...options?.headers,
      },
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractDomain(websiteUri: string): string {
  try {
    const url = new URL(websiteUri)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function normalizeDomain(domain: string): string {
  return domain.replace(/^www\./, '').toLowerCase()
}

async function enrichWithSEMetrics(
  competitors: Competitor[]
): Promise<Competitor[]> {
  const seRankingKey = process.env.SE_RANKING_API_KEY
  if (!seRankingKey || competitors.length === 0) return competitors

  // Enrich each competitor with SE Ranking data (best-effort)
  const enriched = await Promise.all(
    competitors.map(async (competitor) => {
      try {
        const response = await fetchWithTimeout(
          `https://api.seranking.com/research/competitors?domain=${encodeURIComponent(competitor.domain)}`,
          {
            headers: {
              Authorization: `Bearer ${seRankingKey}`,
            },
          }
        )

        if (!response.ok) return competitor

        const data = (await response.json()) as Record<string, unknown>
        const seMetrics: SEMetrics = {
          organicKeywords: typeof data.organic_keywords === 'number' ? data.organic_keywords : undefined,
          organicTraffic: typeof data.organic_traffic === 'number' ? data.organic_traffic : undefined,
          domainAuthority: typeof data.domain_authority === 'number' ? data.domain_authority : undefined,
        }

        return { ...competitor, seMetrics }
      } catch {
        return competitor
      }
    })
  )

  return enriched
}

export async function findCompetitors(
  location: string,
  vertical: string,
  excludeDomain: string
): Promise<Competitor[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    const textQuery = `${vertical} in ${location}`

    const response = await fetchWithTimeout(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.websiteUri,places.formattedAddress,places.id',
      },
      body: JSON.stringify({ textQuery, maxResultCount: 10 }),
    })

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as Record<string, unknown>
    const places = (data.places as PlaceResult[]) ?? []

    const normalizedExclude = normalizeDomain(excludeDomain)

    const competitors: Competitor[] = places
      .map((place) => {
        const domain = place.websiteUri ? extractDomain(place.websiteUri) : ''
        return {
          name: place.displayName?.text ?? '',
          domain,
          address: place.formattedAddress ?? '',
          placeId: place.id ?? '',
        }
      })
      .filter((c) => c.domain && normalizeDomain(c.domain) !== normalizedExclude)
      .slice(0, MAX_RESULTS)

    // Enrich with SE Ranking data if configured
    return enrichWithSEMetrics(competitors)
  } catch {
    return []
  }
}

export type { Competitor, SEMetrics }

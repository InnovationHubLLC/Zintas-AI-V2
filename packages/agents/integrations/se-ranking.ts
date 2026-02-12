interface KeywordData {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  competition: number
}

interface PositionData {
  keyword: string
  position: number
  previousPosition: number | null
  url: string
  searchVolume: number
}

interface SEApiKeywordResult {
  keyword?: string
  search_volume?: number
  keyword_difficulty?: number
  cpc?: number
  competition?: number
}

interface SEApiPositionResult {
  keyword?: string
  position?: number
  previous_position?: number
  url?: string
  search_volume?: number
}

const BASE_URL = 'https://api.seranking.com'
const BATCH_DELAY_MS = 500
const KEYWORD_BATCH_SIZE = 10
const PROJECT_KEYWORD_BATCH_SIZE = 50
const RETRY_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mapKeywordData(raw: SEApiKeywordResult): KeywordData {
  return {
    keyword: raw.keyword ?? '',
    searchVolume: raw.search_volume ?? 0,
    difficulty: raw.keyword_difficulty ?? 0,
    cpc: raw.cpc ?? 0,
    competition: raw.competition ?? 0,
  }
}

function mapPositionData(raw: SEApiPositionResult): PositionData {
  return {
    keyword: raw.keyword ?? '',
    position: raw.position ?? 0,
    previousPosition: raw.previous_position ?? null,
    url: raw.url ?? '',
    searchVolume: raw.search_volume ?? 0,
  }
}

export class SERankingClient {
  private readonly apiKey: string

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.SE_RANKING_API_KEY
    if (!key) {
      throw new Error('SE_RANKING_API_KEY is required')
    }
    this.apiKey = key
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const url = `${BASE_URL}${path}`
    const headers: Record<string, string> = {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, { ...options, headers })

    // Handle 429 - rate limited, wait for Retry-After then retry
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get('Retry-After') ?? '1',
        10
      )
      await sleep(retryAfter * 1000)
      return this.request<T>(path, options, retryCount + 1)
    }

    // Handle 401 - invalid API key
    if (response.status === 401) {
      throw new Error('Invalid SE Ranking API key. Check SE_RANKING_API_KEY.')
    }

    // Handle 500 - retry once after 2 seconds
    if (response.status === 500 && retryCount < 1) {
      await sleep(RETRY_DELAY_MS)
      return this.request<T>(path, options, retryCount + 1)
    }

    if (!response.ok) {
      throw new Error(`SE Ranking API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Research keywords and return volume, difficulty, CPC, competition.
   */
  async keywordResearch(keywords: string[]): Promise<KeywordData[]> {
    const results = await this.request<SEApiKeywordResult[]>(
      '/research/keywords',
      {
        method: 'POST',
        body: JSON.stringify({ keywords }),
      }
    )

    return results.map(mapKeywordData)
  }

  /**
   * Get organic keywords a competitor domain ranks for.
   */
  async getCompetitorKeywords(domain: string): Promise<KeywordData[]> {
    const results = await this.request<SEApiKeywordResult[]>(
      `/research/competitors?domain=${encodeURIComponent(domain)}`
    )

    return results.map(mapKeywordData)
  }

  /**
   * Create a new rank tracking project.
   * Returns the project ID.
   */
  async createProject(name: string, domain: string): Promise<string> {
    const result = await this.request<{ id: string }>(
      '/projects',
      {
        method: 'POST',
        body: JSON.stringify({ name, domain }),
      }
    )

    return result.id
  }

  /**
   * Add keywords to a project for rank tracking.
   * Sends in batches of max 50 with 500ms delay between batches.
   */
  async addKeywordsToProject(
    projectId: string,
    keywords: string[]
  ): Promise<void> {
    for (let i = 0; i < keywords.length; i += PROJECT_KEYWORD_BATCH_SIZE) {
      const batch = keywords.slice(i, i + PROJECT_KEYWORD_BATCH_SIZE)

      await this.request<unknown>(
        `/projects/${encodeURIComponent(projectId)}/keywords`,
        {
          method: 'POST',
          body: JSON.stringify({ keywords: batch }),
        }
      )

      // Delay between batches (skip after last batch)
      if (i + PROJECT_KEYWORD_BATCH_SIZE < keywords.length) {
        await sleep(BATCH_DELAY_MS)
      }
    }
  }

  /**
   * Get current rank positions for tracked keywords in a project.
   */
  async getPositions(projectId: string): Promise<PositionData[]> {
    const results = await this.request<SEApiPositionResult[]>(
      `/projects/${encodeURIComponent(projectId)}/positions`
    )

    return results.map(mapPositionData)
  }

  /**
   * Research up to 100 keywords in batches of 10 with 500ms delay.
   * Deduplicates results by keyword.
   */
  async bulkKeywordResearch(seeds: string[]): Promise<KeywordData[]> {
    const allResults: KeywordData[] = []

    for (let i = 0; i < seeds.length; i += KEYWORD_BATCH_SIZE) {
      const batch = seeds.slice(i, i + KEYWORD_BATCH_SIZE)
      const results = await this.keywordResearch(batch)
      allResults.push(...results)

      // Delay between batches (skip after last batch)
      if (i + KEYWORD_BATCH_SIZE < seeds.length) {
        await sleep(BATCH_DELAY_MS)
      }
    }

    // Deduplicate by keyword using Map
    const dedupMap = new Map<string, KeywordData>()
    for (const item of allResults) {
      if (!dedupMap.has(item.keyword)) {
        dedupMap.set(item.keyword, item)
      }
    }

    return Array.from(dedupMap.values())
  }
}

export type { KeywordData, PositionData }

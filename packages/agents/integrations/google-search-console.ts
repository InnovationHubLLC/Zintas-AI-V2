import { refreshTokenIfNeeded } from '@packages/db/google-tokens'
import type { GoogleTokens } from '@packages/db/encryption'

interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface TrendData {
  date: string
  clicks: number
  impressions: number
  position: number
}

interface SearchAnalyticsRow {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[]
}

interface SiteEntry {
  siteUrl?: string
  permissionLevel?: string
}

interface SitesListResponse {
  siteEntry?: SiteEntry[]
}

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3/sites'

export class GSCClient {
  private readonly clientId: string

  constructor(clientId: string) {
    this.clientId = clientId
  }

  private async getTokens(): Promise<GoogleTokens> {
    return refreshTokenIfNeeded(this.clientId)
  }

  private async request<T>(
    url: string,
    tokens: GoogleTokens,
    options?: RequestInit,
    isRetry = false
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) ?? {}),
      },
    })

    // Handle 401 - token expired, refresh and retry once
    if (response.status === 401 && !isRetry) {
      const freshTokens = await this.getTokens()
      return this.request<T>(url, freshTokens, options, true)
    }

    // Handle 403 - no access
    if (response.status === 403) {
      throw new Error(
        'Access denied to Google Search Console. Verify the site is added and permissions are granted.'
      )
    }

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Get top search queries for a site.
   */
  async getTopQueries(params: {
    siteUrl: string
    startDate: string
    endDate: string
    rowLimit?: number
  }): Promise<GSCQuery[]> {
    const tokens = await this.getTokens()
    const encodedSite = encodeURIComponent(params.siteUrl)
    const url = `${GSC_API_BASE}/${encodedSite}/searchAnalytics/query`

    const data = await this.request<SearchAnalyticsResponse>(url, tokens, {
      method: 'POST',
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        rowLimit: params.rowLimit ?? 100,
        dimensions: ['query'],
      }),
    })

    return (data.rows ?? []).map((row) => ({
      query: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }))
  }

  /**
   * Get top pages for a site.
   */
  async getTopPages(params: {
    siteUrl: string
    startDate: string
    endDate: string
    rowLimit?: number
  }): Promise<GSCPage[]> {
    const tokens = await this.getTokens()
    const encodedSite = encodeURIComponent(params.siteUrl)
    const url = `${GSC_API_BASE}/${encodedSite}/searchAnalytics/query`

    const data = await this.request<SearchAnalyticsResponse>(url, tokens, {
      method: 'POST',
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        rowLimit: params.rowLimit ?? 100,
        dimensions: ['page'],
      }),
    })

    return (data.rows ?? []).map((row) => ({
      page: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }))
  }

  /**
   * Get monthly trend data for a specific query.
   */
  async getQueryTrends(params: {
    siteUrl: string
    query: string
    months: number
  }): Promise<TrendData[]> {
    const tokens = await this.getTokens()
    const encodedSite = encodeURIComponent(params.siteUrl)
    const url = `${GSC_API_BASE}/${encodedSite}/searchAnalytics/query`

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - params.months)

    const data = await this.request<SearchAnalyticsResponse>(url, tokens, {
      method: 'POST',
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['date'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'query',
                expression: params.query,
              },
            ],
          },
        ],
      }),
    })

    return (data.rows ?? []).map((row) => ({
      date: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      position: row.position ?? 0,
    }))
  }

  /**
   * Get list of verified sites.
   */
  async getSiteList(): Promise<string[]> {
    const tokens = await this.getTokens()
    const data = await this.request<SitesListResponse>(GSC_API_BASE, tokens)

    return (data.siteEntry ?? [])
      .map((entry) => entry.siteUrl ?? '')
      .filter(Boolean)
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type { GSCQuery, GSCPage, TrendData }

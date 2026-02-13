import { refreshTokenIfNeeded } from '@packages/db/google-tokens'
import type { GoogleTokens } from '@packages/db/encryption'
import { ChatAnthropic } from '@langchain/anthropic'

// ── Types ────────────────────────────────────────────────────────

interface GBPLocation {
  locationId: string
  name: string
  address: string
  phone: string
  categories: string[]
  websiteUrl: string
}

interface GBPPostInput {
  body: string
  topicType: 'STANDARD' | 'OFFER' | 'EVENT'
  callToAction?: {
    actionType: string
    url: string
  }
  mediaUrl?: string
}

interface GBPPostResult {
  name: string
  state: string
  topicType: string
  createTime: string
}

interface GBPReview {
  reviewId: string
  reviewer: string
  rating: number
  comment: string
  createTime: string
  reviewReply: string | null
}

interface GBPInsights {
  views: number
  searches: number
  actions: number
  calls: number
  websiteClicks: number
  directionRequests: number
}

interface CategorySuggestion {
  category: string
  reason: string
}

// ── API response types ───────────────────────────────────────────

interface LocationResponse {
  name?: string
  title?: string
  storefrontAddress?: {
    addressLines?: string[]
    locality?: string
    administrativeArea?: string
    postalCode?: string
  }
  phoneNumbers?: { primaryPhone?: string }
  categories?: { primaryCategory?: { displayName?: string }; additionalCategories?: { displayName?: string }[] }
  websiteUri?: string
}

interface LocationsListResponse {
  locations?: LocationResponse[]
}

interface LocalPostResponse {
  name?: string
  state?: string
  topicType?: string
  createTime?: string
}

interface ReviewResponse {
  name?: string
  reviewer?: { displayName?: string }
  starRating?: string
  comment?: string
  createTime?: string
  reviewReply?: { comment?: string }
}

interface ReviewsListResponse {
  reviews?: ReviewResponse[]
}

// ── Constants ────────────────────────────────────────────────────

const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GBP_ACCOUNTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'

const DENTAL_CATEGORIES = [
  'Dentist',
  'Cosmetic Dentist',
  'Pediatric Dentist',
  'Orthodontist',
  'Oral Surgeon',
  'Endodontist',
  'Periodontist',
  'Emergency Dental Service',
  'Dental Implants Provider',
  'Teeth Whitening Service',
]

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

// ── Service ──────────────────────────────────────────────────────

export class GBPService {
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

    if (response.status === 401 && !isRetry) {
      const freshTokens = await this.getTokens()
      return this.request<T>(url, freshTokens, options, true)
    }

    if (response.status === 403) {
      throw new Error(
        'Access denied to Google Business Profile. Verify permissions are granted.'
      )
    }

    if (!response.ok) {
      throw new Error(`GBP API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Get all GBP locations for the account.
   */
  async getLocations(): Promise<GBPLocation[]> {
    const tokens = await this.getTokens()

    // First get accounts
    const accountsData = await this.request<{ accounts?: { name?: string }[] }>(
      GBP_ACCOUNTS_API,
      tokens
    )

    const accountName = accountsData.accounts?.[0]?.name
    if (!accountName) {
      return []
    }

    // Then get locations
    const data = await this.request<LocationsListResponse>(
      `${GBP_API_BASE}/${accountName}/locations`,
      tokens
    )

    return (data.locations ?? []).map((loc) => {
      const addr = loc.storefrontAddress
      const addressParts = [
        ...(addr?.addressLines ?? []),
        addr?.locality,
        addr?.administrativeArea,
        addr?.postalCode,
      ].filter(Boolean)

      const categories = [
        loc.categories?.primaryCategory?.displayName,
        ...(loc.categories?.additionalCategories ?? []).map((c) => c.displayName),
      ].filter((c): c is string => !!c)

      return {
        locationId: loc.name ?? '',
        name: loc.title ?? '',
        address: addressParts.join(', '),
        phone: loc.phoneNumbers?.primaryPhone ?? '',
        categories,
        websiteUrl: loc.websiteUri ?? '',
      }
    })
  }

  /**
   * Create a local post on a GBP listing.
   */
  async createPost(
    locationId: string,
    post: GBPPostInput
  ): Promise<GBPPostResult> {
    const tokens = await this.getTokens()
    const url = `${GBP_API_BASE}/${locationId}/localPosts`

    const requestBody: Record<string, unknown> = {
      languageCode: 'en',
      summary: post.body,
      topicType: post.topicType,
    }

    if (post.callToAction) {
      requestBody.callToAction = {
        actionType: post.callToAction.actionType,
        url: post.callToAction.url,
      }
    }

    if (post.mediaUrl) {
      requestBody.media = [
        {
          mediaFormat: 'PHOTO',
          sourceUrl: post.mediaUrl,
        },
      ]
    }

    const data = await this.request<LocalPostResponse>(url, tokens, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    return {
      name: data.name ?? '',
      state: data.state ?? '',
      topicType: data.topicType ?? '',
      createTime: data.createTime ?? '',
    }
  }

  /**
   * Get reviews for a GBP location.
   */
  async getReviews(locationId: string): Promise<GBPReview[]> {
    const tokens = await this.getTokens()
    const url = `${GBP_API_BASE}/${locationId}/reviews`

    const data = await this.request<ReviewsListResponse>(url, tokens)

    return (data.reviews ?? []).map((r) => ({
      reviewId: r.name ?? '',
      reviewer: r.reviewer?.displayName ?? 'Anonymous',
      rating: STAR_RATING_MAP[r.starRating ?? ''] ?? 0,
      comment: r.comment ?? '',
      createTime: r.createTime ?? '',
      reviewReply: r.reviewReply?.comment ?? null,
    }))
  }

  /**
   * Generate a practice-specific review response using Claude.
   * Keeps responses under 150 words.
   */
  async generateReviewResponse(
    review: GBPReview,
    practiceProfile: Record<string, unknown>
  ): Promise<string> {
    const llm = new ChatAnthropic({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 256,
    })

    const isPositive = review.rating >= 4
    const tone = isPositive
      ? 'warm and grateful'
      : 'empathetic and professional'

    const prompt = `You are responding to a Google review for a dental practice.
Practice: ${practiceProfile.name ?? 'our practice'}
Reviewer: ${review.reviewer}
Rating: ${review.rating}/5
Review: "${review.comment}"

Guidelines:
- Keep under 150 words
- Tone: ${tone}
${isPositive ? '- Thank by name, mention the team, warm closing' : '- Show empathy, invite to contact the office directly, never argue, never disclose health information'}
- Do NOT use clinical terms or make health claims
- Sign off with the practice name

Write ONLY the response text, no quotes or metadata.`

    const response = await llm.invoke(prompt)
    return typeof response.content === 'string'
      ? response.content
      : String(response.content)
  }

  /**
   * Get GBP performance insights for a location.
   */
  async getInsights(
    locationId: string,
    period: string
  ): Promise<GBPInsights> {
    const tokens = await this.getTokens()
    const url = `${GBP_API_BASE}/${locationId}/insights?period=${period}`

    try {
      const data = await this.request<Record<string, unknown>>(url, tokens)

      return {
        views: extractMetricValue(data, 'VIEWS_MAPS') + extractMetricValue(data, 'VIEWS_SEARCH'),
        searches: extractMetricValue(data, 'QUERIES_DIRECT') + extractMetricValue(data, 'QUERIES_INDIRECT'),
        actions: extractMetricValue(data, 'ACTIONS_WEBSITE') + extractMetricValue(data, 'ACTIONS_PHONE') + extractMetricValue(data, 'ACTIONS_DRIVING_DIRECTIONS'),
        calls: extractMetricValue(data, 'ACTIONS_PHONE'),
        websiteClicks: extractMetricValue(data, 'ACTIONS_WEBSITE'),
        directionRequests: extractMetricValue(data, 'ACTIONS_DRIVING_DIRECTIONS'),
      }
    } catch {
      return {
        views: 0,
        searches: 0,
        actions: 0,
        calls: 0,
        websiteClicks: 0,
        directionRequests: 0,
      }
    }
  }

  /**
   * Suggest category optimizations for a dental practice.
   */
  async suggestCategoryOptimizations(
    locationId: string
  ): Promise<CategorySuggestion[]> {
    const tokens = await this.getTokens()
    const url = `${GBP_API_BASE}/${locationId}`

    try {
      const data = await this.request<LocationResponse>(url, tokens)

      const currentCategories = new Set<string>()
      if (data.categories?.primaryCategory?.displayName) {
        currentCategories.add(data.categories.primaryCategory.displayName)
      }
      for (const cat of data.categories?.additionalCategories ?? []) {
        if (cat.displayName) currentCategories.add(cat.displayName)
      }

      const suggestions: CategorySuggestion[] = []
      for (const dentalCat of DENTAL_CATEGORIES) {
        if (!currentCategories.has(dentalCat)) {
          suggestions.push({
            category: dentalCat,
            reason: `Adding "${dentalCat}" can improve visibility for related searches`,
          })
        }
      }

      return suggestions
    } catch {
      return []
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function extractMetricValue(
  data: Record<string, unknown>,
  metricName: string
): number {
  const metrics = data as Record<string, { metricValues?: { value?: string }[] }>
  const metric = metrics[metricName]
  if (!metric?.metricValues?.[0]?.value) return 0
  return parseInt(metric.metricValues[0].value, 10) || 0
}

export type {
  GBPLocation,
  GBPPostInput,
  GBPPostResult,
  GBPReview,
  GBPInsights,
  CategorySuggestion,
}

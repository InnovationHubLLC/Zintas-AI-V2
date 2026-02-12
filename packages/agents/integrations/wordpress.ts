interface WPCredentials {
  username: string
  applicationPassword: string
}

interface WPPostInput {
  title: string
  content: string
  status: 'publish' | 'draft' | 'pending'
  slug?: string
  excerpt?: string
  meta?: {
    yoast_wpseo_title?: string
    yoast_wpseo_metadesc?: string
    rank_math_title?: string
    rank_math_description?: string
  }
}

interface WPPost {
  id: number
  link: string
  status: string
  title: { rendered: string }
  content: { rendered: string }
}

interface WPPluginCheck {
  yoast: boolean
  rankMath: boolean
}

interface WPApiResponse {
  id?: number
  link?: string
  status?: string
  title?: { rendered?: string }
  content?: { rendered?: string }
}

interface WPRootResponse {
  namespaces?: string[]
}

export class WordPressClient {
  private readonly siteUrl: string
  private readonly credentials: WPCredentials

  constructor(siteUrl: string, credentials: WPCredentials) {
    this.siteUrl = siteUrl.replace(/\/+$/, '')
    this.credentials = credentials
  }

  private getAuthHeader(): string {
    const token = Buffer.from(
      `${this.credentials.username}:${this.credentials.applicationPassword}`
    ).toString('base64')
    return `Basic ${token}`
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.siteUrl}/wp-json/wp/v2${path}`

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...((options?.headers as Record<string, string>) ?? {}),
        },
      })
    } catch {
      throw new Error('Cannot reach WordPress site.')
    }

    if (response.status === 401) {
      throw new Error(
        'WordPress credentials invalid. Check application password.'
      )
    }

    if (response.status === 403) {
      throw new Error(
        "WordPress user doesn't have permission to publish."
      )
    }

    if (response.status === 404) {
      throw new Error(
        'WordPress REST API not found. Is it enabled?'
      )
    }

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Publish a new post to WordPress.
   */
  async publishPost(post: WPPostInput): Promise<WPPost> {
    const data = await this.request<WPApiResponse>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        status: post.status,
        slug: post.slug,
        excerpt: post.excerpt,
        meta: post.meta,
      }),
    })

    return {
      id: data.id ?? 0,
      link: data.link ?? '',
      status: data.status ?? '',
      title: { rendered: data.title?.rendered ?? '' },
      content: { rendered: data.content?.rendered ?? '' },
    }
  }

  /**
   * Update an existing post.
   */
  async updatePost(postId: number, data: Partial<WPPostInput>): Promise<WPPost> {
    const result = await this.request<WPApiResponse>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    return {
      id: result.id ?? postId,
      link: result.link ?? '',
      status: result.status ?? '',
      title: { rendered: result.title?.rendered ?? '' },
      content: { rendered: result.content?.rendered ?? '' },
    }
  }

  /**
   * Unpublish a post by setting its status to draft.
   * This is the rollback mechanism.
   */
  async unpublishPost(postId: number): Promise<void> {
    await this.request<WPApiResponse>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'draft' }),
    })
  }

  /**
   * Test connection by checking if credentials are valid.
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.siteUrl}/wp-json/wp/v2/users/me`
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Check which SEO plugins are installed.
   */
  async checkPlugins(): Promise<WPPluginCheck> {
    try {
      const url = `${this.siteUrl}/wp-json/`
      let response: Response
      try {
        response = await fetch(url, {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        })
      } catch {
        return { yoast: false, rankMath: false }
      }

      if (!response.ok) {
        return { yoast: false, rankMath: false }
      }

      const data = (await response.json()) as WPRootResponse
      const namespaces = data.namespaces ?? []

      return {
        yoast: namespaces.some((ns) => ns.startsWith('yoast')),
        rankMath: namespaces.some((ns) => ns.startsWith('rankmath')),
      }
    } catch {
      return { yoast: false, rankMath: false }
    }
  }
}

export type { WPPostInput, WPPost, WPCredentials, WPPluginCheck }

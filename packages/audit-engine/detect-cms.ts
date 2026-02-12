type CMSName = 'wordpress' | 'wix' | 'squarespace' | 'webflow' | 'ghl' | 'custom' | 'unknown' | 'error'
type Confidence = 'high' | 'medium' | 'low' | 'none'

interface CMSResult {
  cms: CMSName
  confidence: Confidence
  apiAvailable: boolean
  version?: string
  setupInstructions: string
}

const CMS_TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 5
const USER_AGENT = 'ZintasBot/1.0 (+https://zintas.ai)'
const FALLBACK_USER_AGENT = 'Mozilla/5.0 (compatible; ZintasBot/1.0)'

const INSTRUCTIONS: Record<Exclude<CMSName, 'custom' | 'unknown' | 'error'>, string> = {
  wordpress:
    'Your site runs WordPress. We need an Application Password to publish content. Go to Users → Profile → Application Passwords in your WordPress admin.',
  wix: 'Your site runs Wix. We\'ll use the Wix Content API. You\'ll need to connect your Wix account.',
  squarespace:
    'Your site runs Squarespace. Automated content publishing is limited. We\'ll prepare content for you to paste.',
  webflow:
    'Your site runs Webflow. We\'ll use the Webflow CMS API to publish content.',
  ghl: 'Your site runs GoHighLevel. We\'ll integrate via the GHL API.',
}

function normalizeUrl(domain: string): string {
  let url = domain.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`
  }
  return url
}

async function fetchWithTimeout(
  url: string,
  options?: RequestInit & { maxRedirects?: number }
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS)

  const { maxRedirects: _maxRedirects, ...fetchOptions } = options ?? {}

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        ...fetchOptions.headers,
      },
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchHtml(url: string): Promise<{ html: string; headers: Headers } | null> {
  try {
    const response = await fetchWithTimeout(url, { maxRedirects: MAX_REDIRECTS })
    if (!response.ok) return null
    const html = await response.text()
    return { html, headers: response.headers }
  } catch {
    // Try with fallback User-Agent
    try {
      const response = await fetchWithTimeout(url, {
        maxRedirects: MAX_REDIRECTS,
        headers: { 'User-Agent': FALLBACK_USER_AGENT },
      })
      if (!response.ok) return null
      const html = await response.text()
      return { html, headers: response.headers }
    } catch {
      return null
    }
  }
}

async function checkWordPress(
  url: string,
  html: string,
  headers: Headers
): Promise<CMSResult | null> {
  const htmlMarkers = html.includes('wp-content') || html.includes('wp-includes')
  const headerMarker = (headers.get('x-powered-by') ?? '').toLowerCase().includes('wordpress')

  if (!htmlMarkers && !headerMarker) return null

  let apiAvailable = false
  let version: string | undefined

  // Check /wp-json/ endpoint
  try {
    const wpJsonResponse = await fetchWithTimeout(`${url}/wp-json/`, { method: 'HEAD' })
    if (wpJsonResponse.ok) {
      // Check REST API posts endpoint
      try {
        const postsResponse = await fetchWithTimeout(`${url}/wp-json/wp/v2/posts`)
        apiAvailable = postsResponse.ok
      } catch {
        apiAvailable = false
      }
    }
  } catch {
    // wp-json not accessible
  }

  // Try to extract version from generator meta tag
  const versionMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']WordPress\s+([\d.]+)["']/i)
  if (versionMatch) {
    version = versionMatch[1]
  }

  return {
    cms: 'wordpress',
    confidence: htmlMarkers && headerMarker ? 'high' : 'high',
    apiAvailable,
    version,
    setupInstructions: INSTRUCTIONS.wordpress,
  }
}

function checkWix(html: string, headers: Headers): CMSResult | null {
  const htmlMarker = html.includes('wix.com')
  const headerMarker = Array.from(headers.keys()).some((key) =>
    key.toLowerCase().startsWith('x-wix') || key.startsWith('X-Wix')
  )

  if (!htmlMarker && !headerMarker) return null

  return {
    cms: 'wix',
    confidence: htmlMarker && headerMarker ? 'high' : 'medium',
    apiAvailable: true,
    setupInstructions: INSTRUCTIONS.wix,
  }
}

function checkSquarespace(html: string): CMSResult | null {
  const hasSquarespace = html.includes('squarespace.com') || html.includes('sqsp')

  if (!hasSquarespace) return null

  return {
    cms: 'squarespace',
    confidence: html.includes('squarespace.com') ? 'high' : 'medium',
    apiAvailable: false,
    setupInstructions: INSTRUCTIONS.squarespace,
  }
}

function checkWebflow(html: string): CMSResult | null {
  const hasWebflow = html.includes('webflow.com') || /class=["'][^"']*wf-/i.test(html)

  if (!hasWebflow) return null

  return {
    cms: 'webflow',
    confidence: html.includes('webflow.com') ? 'high' : 'medium',
    apiAvailable: true,
    setupInstructions: INSTRUCTIONS.webflow,
  }
}

function checkGHL(html: string): CMSResult | null {
  const hasGHL = html.includes('leadconnectorhq') || html.includes('gohighlevel')

  if (!hasGHL) return null

  return {
    cms: 'ghl',
    confidence: 'medium',
    apiAvailable: true,
    setupInstructions: INSTRUCTIONS.ghl,
  }
}

export async function detectCMS(domain: string): Promise<CMSResult> {
  const url = normalizeUrl(domain)

  const fetchResult = await fetchHtml(url)
  if (!fetchResult) {
    return {
      cms: 'error',
      confidence: 'none',
      apiAvailable: false,
      setupInstructions:
        'We couldn\'t reach your website. Please check the URL and try again.',
    }
  }

  const { html, headers } = fetchResult

  // Check in priority order per spec
  const wpResult = await checkWordPress(url, html, headers)
  if (wpResult) return wpResult

  const wixResult = checkWix(html, headers)
  if (wixResult) return wixResult

  const sqResult = checkSquarespace(html)
  if (sqResult) return sqResult

  const wfResult = checkWebflow(html)
  if (wfResult) return wfResult

  const ghlResult = checkGHL(html)
  if (ghlResult) return ghlResult

  return {
    cms: 'unknown',
    confidence: 'none',
    apiAvailable: false,
    setupInstructions:
      "We couldn't detect your CMS. Please select it manually.",
  }
}

export type { CMSResult, CMSName, Confidence }

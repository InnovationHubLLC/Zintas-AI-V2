type FindingStatus = 'pass' | 'warning' | 'fail' | 'error'

type AuditGrade = 'A' | 'B' | 'C' | 'D' | 'F'

interface Finding {
  category: string
  icon: string
  score: number
  maxScore: number
  status: FindingStatus
  finding: string
  recommendation: string
}

interface AuditResult {
  score: number
  grade: AuditGrade
  findings: Finding[]
}

const USER_AGENT = 'ZintasBot/1.0 (+https://zintas.ai)'
const CHECK_TIMEOUT_MS = 15_000
const PAGESPEED_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

const CHECK_META = [
  { category: 'Page Speed', icon: 'zap', maxScore: 20 },
  { category: 'Mobile Friendly', icon: 'smartphone', maxScore: 15 },
  { category: 'Meta Tags', icon: 'tag', maxScore: 15 },
  { category: 'Schema Markup', icon: 'code', maxScore: 15 },
  { category: 'Google Business Profile', icon: 'map-pin', maxScore: 15 },
  { category: 'Security (SSL)', icon: 'shield', maxScore: 10 },
  { category: 'Heading Structure', icon: 'heading', maxScore: 10 },
] as const

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

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

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

function calculateGrade(score: number): AuditGrade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function getStatus(score: number, maxScore: number): FindingStatus {
  const pct = score / maxScore
  if (pct >= 0.7) return 'pass'
  if (pct >= 0.4) return 'warning'
  return 'fail'
}

function makeErrorFinding(checkIndex: number, reason: unknown): Finding {
  const meta = CHECK_META[checkIndex]
  const message = reason instanceof Error ? reason.message : 'Check failed'

  return {
    category: meta.category,
    icon: meta.icon,
    score: 0,
    maxScore: meta.maxScore,
    status: 'error',
    finding: `Unable to complete check: ${message}`,
    recommendation: 'This check could not be completed. Try again later.',
  }
}

async function checkPageSpeed(url: string): Promise<Finding> {
  try {
    const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`
    const response = await fetchWithTimeout(apiUrl)
    const data = await response.json() as Record<string, unknown>
    const lighthouse = data.lighthouseResult as Record<string, unknown> | undefined
    const categories = lighthouse?.categories as Record<string, unknown> | undefined
    const performance = categories?.performance as Record<string, unknown> | undefined
    const rawScore = (performance?.score as number) ?? 0

    const score = Math.round(rawScore * 100 * 0.2)

    return {
      category: 'Page Speed',
      icon: 'zap',
      score,
      maxScore: 20,
      status: getStatus(score, 20),
      finding: `Mobile performance score: ${Math.round(rawScore * 100)}/100`,
      recommendation: score >= 14
        ? 'Good page speed. Keep optimizing images and scripts.'
        : 'Improve page speed by optimizing images, minifying CSS/JS, and enabling caching.',
    }
  } catch (error) {
    return makeErrorFinding(0, error)
  }
}

async function checkMobileFriendly(url: string): Promise<Finding> {
  try {
    const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=mobile&category=accessibility`
    const response = await fetchWithTimeout(apiUrl)
    const data = await response.json() as Record<string, unknown>
    const lighthouse = data.lighthouseResult as Record<string, unknown> | undefined
    const categories = lighthouse?.categories as Record<string, unknown> | undefined
    const accessibility = categories?.accessibility as Record<string, unknown> | undefined
    const rawScore = (accessibility?.score as number) ?? 0

    const scaledScore = Math.round(rawScore * 100)
    const score = scaledScore >= 70 ? 15 : Math.round(rawScore * 15)

    return {
      category: 'Mobile Friendly',
      icon: 'smartphone',
      score,
      maxScore: 15,
      status: getStatus(score, 15),
      finding: `Mobile accessibility score: ${scaledScore}/100`,
      recommendation: score >= 10
        ? 'Site is mobile-friendly. Keep responsive design updated.'
        : 'Improve mobile experience with responsive design, touch-friendly buttons, and readable fonts.',
    }
  } catch (error) {
    return makeErrorFinding(1, error)
  }
}

async function checkMetaTags(url: string): Promise<Finding> {
  try {
    const response = await fetchWithTimeout(url)
    const html = await response.text()

    let score = 0
    const details: string[] = []

    if (/<title[^>]*>.+<\/title>/i.test(html)) {
      score += 5
      details.push('Title tag found')
    } else {
      details.push('Missing title tag')
    }

    if (/<meta[^>]*name=["']description["'][^>]*>/i.test(html)) {
      score += 5
      details.push('Meta description found')
    } else {
      details.push('Missing meta description')
    }

    if (/<meta[^>]*property=["']og:/i.test(html)) {
      score += 5
      details.push('Open Graph tags found')
    } else {
      details.push('Missing Open Graph tags')
    }

    return {
      category: 'Meta Tags',
      icon: 'tag',
      score,
      maxScore: 15,
      status: getStatus(score, 15),
      finding: details.join('. '),
      recommendation: score >= 15
        ? 'All essential meta tags present.'
        : 'Add missing meta tags to improve search engine visibility and social sharing.',
    }
  } catch (error) {
    return makeErrorFinding(2, error)
  }
}

async function checkSchemaMarkup(url: string): Promise<Finding> {
  try {
    const response = await fetchWithTimeout(url)
    const html = await response.text()

    let score = 0

    if (/application\/ld\+json/i.test(html)) {
      score += 7
    }

    if (/Dentist|DentalClinic|MedicalBusiness|LocalBusiness|Physician|HealthAndBeautyBusiness/i.test(html)) {
      score += 8
    }

    return {
      category: 'Schema Markup',
      icon: 'code',
      score,
      maxScore: 15,
      status: getStatus(score, 15),
      finding: score >= 15
        ? 'Dental/medical structured data found'
        : score > 0
          ? 'Basic structured data found, but missing dental-specific schema'
          : 'No structured data (JSON-LD) found',
      recommendation: score >= 15
        ? 'Schema markup is well configured for dental practice.'
        : 'Add JSON-LD structured data with Dentist or LocalBusiness schema to improve search visibility.',
    }
  } catch (error) {
    return makeErrorFinding(3, error)
  }
}

async function checkGBP(url: string): Promise<Finding> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return {
      category: 'Google Business Profile',
      icon: 'map-pin',
      score: 7,
      maxScore: 15,
      status: 'warning',
      finding: 'Manual verification needed — API key not configured',
      recommendation: 'Verify your Google Business Profile is claimed and optimized.',
    }
  }

  try {
    const domain = new URL(normalizeUrl(url)).hostname.replace('www.', '')
    const response = await fetchWithTimeout('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.websiteUri',
      },
      body: JSON.stringify({ textQuery: domain }),
    })

    const data = await response.json() as Record<string, unknown>
    const places = data.places as Array<Record<string, unknown>> | undefined

    if (places && places.length > 0) {
      return {
        category: 'Google Business Profile',
        icon: 'map-pin',
        score: 15,
        maxScore: 15,
        status: 'pass',
        finding: 'Google Business Profile found',
        recommendation: 'Keep your GBP updated with photos, posts, and accurate hours.',
      }
    }

    return {
      category: 'Google Business Profile',
      icon: 'map-pin',
      score: 0,
      maxScore: 15,
      status: 'fail',
      finding: 'No Google Business Profile found for this domain',
      recommendation: 'Claim and optimize your Google Business Profile to appear in local search results.',
    }
  } catch (error) {
    return {
      category: 'Google Business Profile',
      icon: 'map-pin',
      score: 7,
      maxScore: 15,
      status: 'warning',
      finding: 'Could not verify Google Business Profile',
      recommendation: 'Verify your Google Business Profile is claimed and optimized.',
    }
  }
}

async function checkSSL(url: string): Promise<Finding> {
  const normalized = normalizeUrl(url)
  const isHttps = normalized.startsWith('https://')

  if (isHttps) {
    return {
      category: 'Security (SSL)',
      icon: 'shield',
      score: 10,
      maxScore: 10,
      status: 'pass',
      finding: 'Site uses HTTPS',
      recommendation: 'Good — secure connection protects visitors.',
    }
  }

  try {
    const httpsUrl = normalized.replace('http://', 'https://')
    await fetchWithTimeout(httpsUrl, { method: 'HEAD' })
    return {
      category: 'Security (SSL)',
      icon: 'shield',
      score: 5,
      maxScore: 10,
      status: 'warning',
      finding: 'HTTPS available but not the default',
      recommendation: 'Redirect all HTTP traffic to HTTPS.',
    }
  } catch {
    return {
      category: 'Security (SSL)',
      icon: 'shield',
      score: 0,
      maxScore: 10,
      status: 'fail',
      finding: 'Site does not use HTTPS',
      recommendation: 'Switch to HTTPS to protect visitors and improve rankings.',
    }
  }
}

async function checkHeadingStructure(url: string): Promise<Finding> {
  try {
    const response = await fetchWithTimeout(url)
    const html = await response.text()

    const headingRegex = /<h([1-6])[^>]*>/gi
    const headings: number[] = []
    let match = headingRegex.exec(html)
    while (match) {
      headings.push(parseInt(match[1], 10))
      match = headingRegex.exec(html)
    }

    let score = 0
    const h1Count = headings.filter((h) => h === 1).length
    const hasH2 = headings.some((h) => h === 2)

    if (h1Count === 1) {
      score += 4
    }

    if (hasH2) {
      score += 3
    }

    if (h1Count === 1 && hasH2) {
      const h1Index = headings.indexOf(1)
      const h2Index = headings.indexOf(2)
      if (h1Index < h2Index) {
        score += 3
      }
    }

    return {
      category: 'Heading Structure',
      icon: 'heading',
      score,
      maxScore: 10,
      status: getStatus(score, 10),
      finding: h1Count === 1
        ? `Proper heading structure: 1 H1, ${headings.filter((h) => h === 2).length} H2s`
        : h1Count === 0
          ? 'No H1 heading found'
          : `Multiple H1 headings found (${h1Count})`,
      recommendation: score >= 8
        ? 'Good heading structure for SEO.'
        : 'Use exactly one H1 for the main title, then H2s for sections.',
    }
  } catch (error) {
    return makeErrorFinding(6, error)
  }
}

async function runAudit(url: string): Promise<AuditResult> {
  const normalizedUrl = normalizeUrl(url)

  const checks = [
    checkPageSpeed(normalizedUrl),
    checkMobileFriendly(normalizedUrl),
    checkMetaTags(normalizedUrl),
    checkSchemaMarkup(normalizedUrl),
    checkGBP(normalizedUrl),
    checkSSL(normalizedUrl),
    checkHeadingStructure(normalizedUrl),
  ]

  const results = await Promise.allSettled(checks)

  const findings: Finding[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return makeErrorFinding(index, result.reason)
  })

  const score = findings.reduce((sum, f) => sum + f.score, 0)
  const grade = calculateGrade(score)

  return { score, grade, findings }
}

export {
  runAudit,
  calculateGrade,
  checkPageSpeed,
  checkMobileFriendly,
  checkMetaTags,
  checkSchemaMarkup,
  checkGBP,
  checkSSL,
  checkHeadingStructure,
}
export type { AuditResult, Finding, FindingStatus, AuditGrade }
export { detectCMS } from './detect-cms'
export type { CMSResult, CMSName, Confidence } from './detect-cms'
export { findCompetitors } from './competitor-finder'
export type { Competitor } from './competitor-finder'

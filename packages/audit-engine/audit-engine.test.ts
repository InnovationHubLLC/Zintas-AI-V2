import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const MOCK_HTML_FULL = `
<!DOCTYPE html>
<html>
<head>
  <title>Smith Family Dental - Best Dentist in Austin</title>
  <meta name="description" content="Top rated family dentist in Austin, TX">
  <meta property="og:title" content="Smith Family Dental">
  <script type="application/ld+json">{"@type":"Dentist","name":"Smith Family Dental"}</script>
</head>
<body>
  <h1>Welcome to Smith Family Dental</h1>
  <h2>Our Services</h2>
  <h2>About Us</h2>
  <h3>Our Team</h3>
</body>
</html>`

const MOCK_HTML_MINIMAL = `
<!DOCTYPE html>
<html>
<head></head>
<body><h2>No H1 here</h2></body>
</html>`

const MOCK_PAGESPEED_PERF = {
  lighthouseResult: {
    categories: { performance: { score: 0.85 } },
  },
}

const MOCK_PAGESPEED_A11Y = {
  lighthouseResult: {
    categories: { accessibility: { score: 0.92 } },
  },
}

const MOCK_PLACES_RESPONSE = {
  places: [{ displayName: { text: 'Smith Family Dental' }, websiteUri: 'https://example.com' }],
}

function setupFullMock(): void {
  mockFetch.mockImplementation(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url

    if (urlStr.includes('pagespeedonline') && urlStr.includes('performance')) {
      return new Response(JSON.stringify(MOCK_PAGESPEED_PERF), { status: 200 })
    }
    if (urlStr.includes('pagespeedonline') && urlStr.includes('accessibility')) {
      return new Response(JSON.stringify(MOCK_PAGESPEED_A11Y), { status: 200 })
    }
    if (urlStr.includes('places.googleapis.com')) {
      return new Response(JSON.stringify(MOCK_PLACES_RESPONSE), { status: 200 })
    }
    return new Response(MOCK_HTML_FULL, { status: 200 })
  })
}

describe('TASK-09: Free Audit Engine', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.GOOGLE_PLACES_API_KEY = 'test-places-key'
  })

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_API_KEY
  })

  describe('runAudit', () => {
    it('should return a valid AuditResult with all 7 findings', async () => {
      setupFullMock()
      const { runAudit } = await import('./index')
      const result = await runAudit('https://example.com')

      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('grade')
      expect(result).toHaveProperty('findings')
      expect(result.findings).toHaveLength(7)
    })

    it('should return score between 0 and 100', async () => {
      setupFullMock()
      const { runAudit } = await import('./index')
      const result = await runAudit('https://example.com')

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should return a valid grade', async () => {
      setupFullMock()
      const { runAudit } = await import('./index')
      const result = await runAudit('https://example.com')

      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade)
    })

    it('should include all required fields on each finding', async () => {
      setupFullMock()
      const { runAudit } = await import('./index')
      const result = await runAudit('https://example.com')

      for (const finding of result.findings) {
        expect(finding).toHaveProperty('category')
        expect(finding).toHaveProperty('icon')
        expect(finding).toHaveProperty('score')
        expect(finding).toHaveProperty('maxScore')
        expect(finding).toHaveProperty('status')
        expect(finding).toHaveProperty('finding')
        expect(finding).toHaveProperty('recommendation')
      }
    })

    it('should not crash when a check fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const { runAudit } = await import('./index')
      const result = await runAudit('https://example.com')

      expect(result.findings).toHaveLength(7)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('should normalize URL without protocol', async () => {
      setupFullMock()
      const { runAudit } = await import('./index')
      const result = await runAudit('example.com')

      expect(result.findings).toHaveLength(7)
    })
  })

  describe('calculateGrade', () => {
    it('should map scores to correct grades', async () => {
      const { calculateGrade } = await import('./index')

      expect(calculateGrade(95)).toBe('A')
      expect(calculateGrade(90)).toBe('A')
      expect(calculateGrade(80)).toBe('B')
      expect(calculateGrade(75)).toBe('B')
      expect(calculateGrade(65)).toBe('C')
      expect(calculateGrade(60)).toBe('C')
      expect(calculateGrade(45)).toBe('D')
      expect(calculateGrade(40)).toBe('D')
      expect(calculateGrade(20)).toBe('F')
      expect(calculateGrade(0)).toBe('F')
    })
  })

  describe('checkSSL', () => {
    it('should return full points for HTTPS URL', async () => {
      const { checkSSL } = await import('./index')
      const result = await checkSSL('https://example.com')

      expect(result.score).toBe(10)
      expect(result.status).toBe('pass')
    })

    it('should return 0 points for HTTP URL', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'))
      const { checkSSL } = await import('./index')
      const result = await checkSSL('http://example.com')

      expect(result.score).toBe(0)
      expect(result.status).toBe('fail')
    })
  })

  describe('checkMetaTags', () => {
    it('should return 15 points for full meta tags', async () => {
      mockFetch.mockResolvedValue(new Response(MOCK_HTML_FULL, { status: 200 }))
      const { checkMetaTags } = await import('./index')
      const result = await checkMetaTags('https://example.com')

      expect(result.score).toBe(15)
      expect(result.status).toBe('pass')
    })

    it('should return 5 points for title only', async () => {
      mockFetch.mockResolvedValue(new Response(
        '<html><head><title>Test</title></head><body></body></html>',
        { status: 200 }
      ))
      const { checkMetaTags } = await import('./index')
      const result = await checkMetaTags('https://example.com')

      expect(result.score).toBe(5)
    })

    it('should return 0 points for empty head', async () => {
      mockFetch.mockResolvedValue(new Response(MOCK_HTML_MINIMAL, { status: 200 }))
      const { checkMetaTags } = await import('./index')
      const result = await checkMetaTags('https://example.com')

      expect(result.score).toBe(0)
      expect(result.status).toBe('fail')
    })
  })

  describe('checkHeadingStructure', () => {
    it('should return full points for proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue(new Response(MOCK_HTML_FULL, { status: 200 }))
      const { checkHeadingStructure } = await import('./index')
      const result = await checkHeadingStructure('https://example.com')

      expect(result.score).toBe(10)
      expect(result.status).toBe('pass')
    })

    it('should return low score for no H1', async () => {
      mockFetch.mockResolvedValue(new Response(
        '<html><body><p>No headings at all</p></body></html>',
        { status: 200 }
      ))
      const { checkHeadingStructure } = await import('./index')
      const result = await checkHeadingStructure('https://example.com')

      expect(result.score).toBe(0)
      expect(result.status).toBe('fail')
    })
  })

  describe('checkSchemaMarkup', () => {
    it('should return full points for dental schema', async () => {
      mockFetch.mockResolvedValue(new Response(MOCK_HTML_FULL, { status: 200 }))
      const { checkSchemaMarkup } = await import('./index')
      const result = await checkSchemaMarkup('https://example.com')

      expect(result.score).toBe(15)
      expect(result.status).toBe('pass')
    })

    it('should return 0 for no schema', async () => {
      mockFetch.mockResolvedValue(new Response(MOCK_HTML_MINIMAL, { status: 200 }))
      const { checkSchemaMarkup } = await import('./index')
      const result = await checkSchemaMarkup('https://example.com')

      expect(result.score).toBe(0)
      expect(result.status).toBe('fail')
    })
  })

  describe('checkPageSpeed', () => {
    it('should scale performance score to 0-20 range', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(MOCK_PAGESPEED_PERF), { status: 200 })
      )
      const { checkPageSpeed } = await import('./index')
      const result = await checkPageSpeed('https://example.com')

      expect(result.score).toBe(17)
      expect(result.maxScore).toBe(20)
    })
  })

  describe('checkGBP', () => {
    it('should return full points when business found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(MOCK_PLACES_RESPONSE), { status: 200 })
      )
      const { checkGBP } = await import('./index')
      const result = await checkGBP('https://example.com')

      expect(result.score).toBe(15)
      expect(result.status).toBe('pass')
    })

    it('should return partial credit when API key is missing', async () => {
      delete process.env.GOOGLE_PLACES_API_KEY
      const { checkGBP } = await import('./index')
      const result = await checkGBP('https://example.com')

      expect(result.score).toBe(7)
      expect(result.status).toBe('warning')
    })
  })

  describe('no any types', () => {
    it('should not contain any type annotation in source', () => {
      const content = fs.readFileSync(path.resolve(__dirname, 'index.ts'), 'utf-8')
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})

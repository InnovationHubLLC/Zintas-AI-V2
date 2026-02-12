import { ChatAnthropic } from '@langchain/anthropic'

// ─── Type Definitions ──────────────────────────────────────────────

interface ComplianceResult {
  status: 'pass' | 'warn' | 'block'
  details: ComplianceDetail[]
}

interface ComplianceDetail {
  rule: string
  severity: 'block' | 'warn'
  phrase: string
  reason: string
  suggestion?: string
  disclaimer?: string
}

interface LLMIssue {
  rule?: string
  severity?: string
  phrase?: string
  reason?: string
  suggestion?: string
}

// ─── Rule Definitions ──────────────────────────────────────────────

interface ComplianceRule {
  name: string
  severity: 'block' | 'warn'
  patterns: RegExp[]
  reason: string
  suggestion?: string
  disclaimer?: string
  contextCheck?: (text: string, match: RegExpMatchArray) => boolean
}

const COMPLIANCE_RULES: ComplianceRule[] = [
  // BLOCK severity rules
  {
    name: 'guaranteed_results',
    severity: 'block',
    patterns: [
      /\bguaranteed\b/i,
      /\b100%\s+success\b/i,
      /\bpermanent\s+solution\b/i,
    ],
    reason: 'Do not guarantee outcomes',
    suggestion: 'Replace with qualified language like "may help" or "designed to"',
  },
  {
    name: 'diagnosis',
    severity: 'block',
    patterns: [
      /\byou have\b/i,
      /\byou suffer from\b/i,
      /\bthis means you need\b/i,
    ],
    reason: 'Only a dentist can diagnose',
    suggestion: 'Use "may indicate" or "consult your dentist to determine"',
  },
  {
    name: 'cure_language',
    severity: 'block',
    patterns: [
      /\bcure\b/i,
      /\bheal completely\b/i,
      /\beliminate forever\b/i,
    ],
    reason: 'Avoid absolute medical claims',
    suggestion: 'Use "may help improve" or "designed to address"',
  },
  {
    name: 'price_without_context',
    severity: 'block',
    patterns: [/\$\d+/],
    reason: 'Pricing must include "starting at" or disclaimer',
    suggestion: 'Add "starting at" before price or include a pricing disclaimer',
    contextCheck: (text: string, match: RegExpMatchArray): boolean => {
      const pos = match.index ?? 0
      const surrounding = text.slice(Math.max(0, pos - 200), pos + 200)
      const hasDisclaimer =
        /starting at|starts at|as low as|from|disclaimer|may vary|estimate/i.test(surrounding)
      // Only flag if there's NO disclaimer context
      return !hasDisclaimer
    },
  },

  // WARN severity rules
  {
    name: 'before_after',
    severity: 'warn',
    patterns: [/\bbefore and after\b/i, /\bresults shown\b/i],
    reason: 'Before/after claims need disclaimer',
    disclaimer: 'Individual results may vary.',
  },
  {
    name: 'insurance_claim',
    severity: 'warn',
    patterns: [/\bcovered by insurance\b/i, /\binsurance pays\b/i],
    reason: 'Insurance claims need disclaimer',
    disclaimer: 'Contact your insurance provider to verify coverage.',
  },
]

// ─── Helper Functions ──────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function runRegexChecks(text: string): ComplianceDetail[] {
  const details: ComplianceDetail[] = []

  for (const rule of COMPLIANCE_RULES) {
    for (const pattern of rule.patterns) {
      const match = text.match(pattern)
      if (match) {
        // If rule has a context check, apply it
        if (rule.contextCheck && !rule.contextCheck(text, match)) {
          continue
        }

        details.push({
          rule: rule.name,
          severity: rule.severity,
          phrase: match[0],
          reason: rule.reason,
          suggestion: rule.suggestion,
          disclaimer: rule.disclaimer,
        })

        // Only report first match per rule
        break
      }
    }
  }

  return details
}

async function runLLMCheck(text: string, vertical: string): Promise<ComplianceDetail[]> {
  try {
    const model = new ChatAnthropic({
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 1024,
    })

    const truncated = text.slice(0, 3000)

    const response = await model.invoke([
      {
        role: 'system',
        content: `You are a ${vertical} content compliance reviewer. Review content for regulatory and safety issues. Flag: specific diagnoses, treatment recommendations, guaranteed outcomes, testimonials with health claims, unsupported comparative claims. Return a JSON array of issues or empty array []. Each issue: { "rule": "string", "severity": "block"|"warn", "phrase": "exact text", "reason": "why flagged", "suggestion": "fix" }`,
      },
      {
        role: 'user',
        content: `Review this ${vertical} content for compliance issues:\n\n${truncated}`,
      },
    ])

    const responseText =
      typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content
              .filter((block): block is { type: 'text'; text: string } => 'text' in block)
              .map((block) => block.text)
              .join('')
          : ''

    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim()
    const issues = JSON.parse(jsonStr) as LLMIssue[]

    return issues.map((issue) => ({
      rule: issue.rule ?? 'llm_check',
      severity: (issue.severity === 'block' ? 'block' : 'warn') as 'block' | 'warn',
      phrase: issue.phrase ?? '',
      reason: issue.reason ?? 'Flagged by AI review',
      suggestion: issue.suggestion,
    }))
  } catch {
    // If LLM check fails, return empty — regex rules still apply
    return []
  }
}

function deduplicateDetails(details: ComplianceDetail[]): ComplianceDetail[] {
  const seen = new Set<string>()
  const result: ComplianceDetail[] = []

  for (const detail of details) {
    const key = `${detail.rule}:${detail.phrase.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(detail)
    }
  }

  return result
}

function determineStatus(details: ComplianceDetail[]): 'pass' | 'warn' | 'block' {
  if (details.some((d) => d.severity === 'block')) {
    return 'block'
  }
  if (details.some((d) => d.severity === 'warn')) {
    return 'warn'
  }
  return 'pass'
}

// ─── Main Engine ───────────────────────────────────────────────────

export const complianceEngine = {
  async check(html: string, vertical: string): Promise<ComplianceResult> {
    if (!html || html.trim().length === 0) {
      return { status: 'pass', details: [] }
    }

    const plainText = stripHtml(html)

    // Step 1: Fast regex checks
    const regexDetails = runRegexChecks(plainText)

    // Step 2: LLM check for nuanced issues
    const llmDetails = await runLLMCheck(plainText, vertical)

    // Combine and deduplicate
    const allDetails = deduplicateDetails([...regexDetails, ...llmDetails])

    // Determine overall status
    const status = determineStatus(allDetails)

    return { status, details: allDetails }
  },
}

export type { ComplianceResult, ComplianceDetail }

import { Annotation, StateGraph, START, END } from '@langchain/langgraph'
import { ChatAnthropic } from '@langchain/anthropic'
import { complianceEngine } from '@packages/compliance'
import type { ComplianceResult } from '@packages/compliance'
import { supabaseAdmin } from '@packages/db/client'
import { updateRun } from '@packages/db/queries/agent-runs'
import { getClientById } from '@packages/db/queries/clients'
import type { CreateContentPieceInput, CreateAgentActionInput } from '@packages/db/types'

// ─── Type Definitions ──────────────────────────────────────────────

interface ContentBrief {
  suggestedTitle: string
  h2Sections: string[]
  targetWordCount: number
  internalLinks: string[]
  uniqueAngles: string[]
  practiceHooks: string[]
}

interface GeneratedContent {
  html: string
  markdown: string
  wordCount: number
}

interface ContentTopic {
  keyword: string
  suggestedTitle: string
  angle: string
  estimatedVolume: number
}

interface PracticeProfile {
  services?: string[]
  city?: string
  state?: string
  practice_name?: string
  doctors?: string[]
  [key: string]: unknown
}

interface BriefResponse {
  suggestedTitle: string
  h2Sections: string[]
  targetWordCount: number
  internalLinks: string[]
  uniqueAngles: string[]
  practiceHooks: string[]
}

interface ContentResponse {
  html: string
  markdown: string
  metaTitle: string
  metaDescription: string
}

// ─── State Definition ──────────────────────────────────────────────

const GhostwriterState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  practiceProfile: Annotation<PracticeProfile>,
  topic: Annotation<ContentTopic>,
  brief: Annotation<ContentBrief | null>,
  content: Annotation<GeneratedContent | null>,
  metaTitle: Annotation<string | null>,
  metaDescription: Annotation<string | null>,
  seoScore: Annotation<number>,
  complianceResult: Annotation<ComplianceResult | null>,
  contentPieceId: Annotation<string | null>,
  queueItemId: Annotation<string | null>,
  rewriteAttempts: Annotation<number>,
  error: Annotation<string | null>,
})

type GhostwriterStateType = typeof GhostwriterState.State

// ─── Helper Functions ──────────────────────────────────────────────

function extractJSON<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr) as T
}

function countWords(text: string): number {
  return text.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Node Functions ────────────────────────────────────────────────

async function generateBrief(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-20250514',
      maxTokens: 2048,
    })

    const response = await model.invoke([
      {
        role: 'system',
        content: 'You are an expert dental SEO content strategist. Generate a detailed content brief. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Create a content brief for a dental practice blog post.

Practice profile:
${JSON.stringify(state.practiceProfile, null, 2)}

Target keyword: "${state.topic.keyword}"
Suggested title: "${state.topic.suggestedTitle}"
Angle: "${state.topic.angle}"

Return JSON:
{
  "suggestedTitle": "SEO-optimized title with keyword",
  "h2Sections": ["Section 1", "Section 2", ...],
  "targetWordCount": 1200,
  "internalLinks": ["suggested internal page links"],
  "uniqueAngles": ["angles to differentiate from competitors"],
  "practiceHooks": ["practice-specific details to weave in"]
}`,
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

    const parsed = extractJSON<BriefResponse>(responseText)

    return {
      brief: {
        suggestedTitle: parsed.suggestedTitle,
        h2Sections: parsed.h2Sections,
        targetWordCount: parsed.targetWordCount,
        internalLinks: parsed.internalLinks ?? [],
        uniqueAngles: parsed.uniqueAngles ?? [],
        practiceHooks: parsed.practiceHooks ?? [],
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in generateBrief'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

async function writeContent(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
    })

    const brief = state.brief
    const practiceName = state.practiceProfile.practice_name ?? 'our practice'
    const city = state.practiceProfile.city ?? ''
    const doctors = state.practiceProfile.doctors ?? []

    const response = await model.invoke([
      {
        role: 'system',
        content: `You are a professional dental content writer. Write warm, professional content that:
- Uses a conversational yet authoritative tone
- Weaves in practice-specific details (doctor names, location)
- Maintains 2-3% keyword density for the target keyword
- Targets 8th grade reading level
- Includes a FAQ section with 3-4 questions
- Never gives specific medical advice or diagnoses
- Uses proper HTML formatting (h1, h2, h3, p, ul, li tags)

Practice: ${practiceName}${city ? ` in ${city}` : ''}
${doctors.length > 0 ? `Doctors: ${doctors.join(', ')}` : ''}

Return JSON with html, markdown, metaTitle, metaDescription.`,
      },
      {
        role: 'user',
        content: `Write a blog post based on this brief:

Title: "${brief?.suggestedTitle ?? state.topic.suggestedTitle}"
Target keyword: "${state.topic.keyword}"
Sections: ${JSON.stringify(brief?.h2Sections ?? [])}
Target word count: ${brief?.targetWordCount ?? 1200}
Unique angles: ${JSON.stringify(brief?.uniqueAngles ?? [])}
Practice hooks: ${JSON.stringify(brief?.practiceHooks ?? [])}

Return JSON:
{
  "html": "<h1>Title</h1><p>...</p>...",
  "markdown": "# Title\n\n...",
  "metaTitle": "50-70 char SEO title",
  "metaDescription": "120-160 char meta description"
}`,
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

    const parsed = extractJSON<ContentResponse>(responseText)
    const wordCount = countWords(parsed.html)

    return {
      content: {
        html: parsed.html,
        markdown: parsed.markdown,
        wordCount,
      },
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in writeContent'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

async function scoreSEO(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    const html = state.content?.html ?? ''
    const plainText = stripHtml(html)
    const keyword = state.topic.keyword.toLowerCase()
    const title = state.metaTitle ?? ''
    const metaDesc = state.metaDescription ?? ''
    const wordCount = state.content?.wordCount ?? 0

    let score = 0

    // Primary keyword in title (+15)
    if (title.toLowerCase().includes(keyword)) {
      score += 15
    }

    // In first paragraph (+10)
    const firstParagraph = plainText.slice(0, 500).toLowerCase()
    if (firstParagraph.includes(keyword)) {
      score += 10
    }

    // In H2 headings (+5)
    const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi
    const h2Matches = html.match(h2Pattern) ?? []
    if (h2Matches.some((h2) => h2.toLowerCase().includes(keyword))) {
      score += 5
    }

    // Keyword density 1-3% (+15)
    const keywordCount = (plainText.toLowerCase().match(new RegExp(keyword, 'gi')) ?? []).length
    const totalWords = plainText.split(/\s+/).length
    const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0
    if (density >= 1 && density <= 3) {
      score += 15
    }

    // Readability — approximate by average sentence length (+10)
    const sentences = plainText.split(/[.!?]+/).filter(Boolean)
    const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
      score += 10
    }

    // Meta title length 50-70 chars (+10)
    if (title.length >= 50 && title.length <= 70) {
      score += 10
    }

    // Meta description 120-160 chars (+10)
    if (metaDesc.length >= 120 && metaDesc.length <= 160) {
      score += 10
    }

    // Has internal links (+10)
    if (/<a\s+[^>]*href/i.test(html)) {
      score += 10
    }

    // Has H2/H3 structure (+10)
    if (/<h[23][^>]*>/i.test(html)) {
      score += 10
    }

    // Word count >800 (+5)
    if (wordCount > 800) {
      score += 5
    }

    return { seoScore: Math.min(score, 100) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in scoreSEO'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

async function checkCompliance(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    const html = state.content?.html ?? ''
    const result = await complianceEngine.check(html, 'dental')
    return { complianceResult: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in checkCompliance'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

async function handleCompliance(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    const result = state.complianceResult
    if (!result) return {}

    // PASS — continue to queue
    if (result.status === 'pass') {
      return {}
    }

    // WARN — auto-inject disclaimers
    if (result.status === 'warn') {
      let html = state.content?.html ?? ''
      const disclaimers = result.details
        .filter((d) => d.disclaimer)
        .map((d) => d.disclaimer as string)

      if (disclaimers.length > 0) {
        const disclaimerHtml = disclaimers
          .map((d) => `<p class="disclaimer"><em>${d}</em></p>`)
          .join('\n')
        html = html + '\n' + disclaimerHtml
      }

      return {
        content: {
          html,
          markdown: state.content?.markdown ?? '',
          wordCount: state.content?.wordCount ?? 0,
        },
      }
    }

    // BLOCK — rewrite if attempts remaining
    if (result.status === 'block' && state.rewriteAttempts < 2) {
      const model = new ChatAnthropic({
        model: 'claude-sonnet-4-20250514',
        maxTokens: 4096,
      })

      const flaggedSections = result.details
        .filter((d) => d.severity === 'block')
        .map((d) => `- "${d.phrase}" — ${d.reason}${d.suggestion ? `. Fix: ${d.suggestion}` : ''}`)
        .join('\n')

      const response = await model.invoke([
        {
          role: 'system',
          content: 'You are a dental content compliance editor. Rewrite ONLY the flagged sections while preserving the rest of the content. Return valid JSON with html and markdown fields.',
        },
        {
          role: 'user',
          content: `Rewrite the flagged sections in this dental content:

Current HTML:
${state.content?.html ?? ''}

Compliance issues to fix:
${flaggedSections}

Return JSON: { "html": "...", "markdown": "..." }`,
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

      const parsed = extractJSON<{ html: string; markdown: string }>(responseText)

      return {
        content: {
          html: parsed.html,
          markdown: parsed.markdown,
          wordCount: countWords(parsed.html),
        },
        rewriteAttempts: state.rewriteAttempts + 1,
        complianceResult: null,
      }
    }

    // BLOCK with max retries — continue to queue with critical severity
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in handleCompliance'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

async function queueForReview(
  state: GhostwriterStateType
): Promise<Partial<GhostwriterStateType>> {
  try {
    // Create content piece
    const contentInput: CreateContentPieceInput = {
      org_id: state.orgId,
      client_id: state.clientId,
      title: state.brief?.suggestedTitle ?? state.topic.suggestedTitle,
      body_html: state.content?.html ?? null,
      body_markdown: state.content?.markdown ?? null,
      content_type: 'blog_post',
      status: 'in_review',
      target_keyword: state.topic.keyword,
      related_keywords: [],
      seo_score: state.seoScore,
      word_count: state.content?.wordCount ?? 0,
      compliance_status: state.complianceResult?.status ?? 'pass',
      compliance_details: state.complianceResult?.details ?? [],
      meta_title: state.metaTitle,
      meta_description: state.metaDescription,
      published_url: null,
      published_at: null,
    }

    const { data: contentPiece, error: contentError } = await supabaseAdmin
      .from('content_pieces')
      .insert(contentInput)
      .select()
      .single()

    if (contentError) {
      throw new Error(`Failed to create content piece: ${contentError.message}`)
    }

    const contentPieceId = (contentPiece as { id: string }).id

    // Create agent action for queue
    const isCritical = state.complianceResult?.status === 'block'
    const actionInput: CreateAgentActionInput = {
      org_id: state.orgId,
      client_id: state.clientId,
      agent: 'ghostwriter',
      action_type: 'content_review',
      autonomy_tier: 2,
      status: 'pending',
      severity: isCritical ? 'critical' : 'info',
      description: `New blog post: "${state.brief?.suggestedTitle ?? state.topic.suggestedTitle}" targeting "${state.topic.keyword}"`,
      proposed_data: {
        contentPieceId,
        seoScore: state.seoScore,
        wordCount: state.content?.wordCount ?? 0,
        complianceStatus: state.complianceResult?.status ?? 'pass',
      },
      rollback_data: {},
      content_piece_id: contentPieceId,
      approved_by: null,
      approved_at: null,
      deployed_at: null,
    }

    const { data: action, error: actionError } = await supabaseAdmin
      .from('agent_actions')
      .insert(actionInput)
      .select()
      .single()

    if (actionError) {
      throw new Error(`Failed to create agent action: ${actionError.message}`)
    }

    const queueItemId = (action as { id: string }).id

    // Update agent run as completed
    await updateRun(state.runId, {
      status: 'completed',
      result: {
        contentPieceId,
        queueItemId,
        seoScore: state.seoScore,
        complianceStatus: state.complianceResult?.status ?? 'pass',
        rewriteAttempts: state.rewriteAttempts,
      },
      completed_at: new Date().toISOString(),
    })

    return { contentPieceId, queueItemId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in queueForReview'
    await updateRun(state.runId, { status: 'failed', error: message, completed_at: new Date().toISOString() })
    return { error: message }
  }
}

// ─── Conditional Edges ─────────────────────────────────────────────

function shouldContinue(state: GhostwriterStateType): string {
  if (state.error) {
    return END
  }
  return 'next'
}

function complianceRouting(state: GhostwriterStateType): string {
  if (state.error) {
    return END
  }

  const result = state.complianceResult
  if (!result) {
    return 'queue_for_review'
  }

  // If blocked and still have retries, loop back to compliance check
  if (result.status === 'block' && state.rewriteAttempts < 2) {
    return 'check_compliance'
  }

  return 'queue_for_review'
}

// ─── Graph Construction ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createGhostwriterGraph() {
  const graph = new StateGraph(GhostwriterState)
    .addNode('generate_brief', generateBrief)
    .addNode('write_content', writeContent)
    .addNode('score_seo', scoreSEO)
    .addNode('check_compliance', checkCompliance)
    .addNode('handle_compliance', handleCompliance)
    .addNode('queue_for_review', queueForReview)
    .addEdge(START, 'generate_brief')
    .addConditionalEdges('generate_brief', shouldContinue, {
      next: 'write_content',
      [END]: END,
    })
    .addConditionalEdges('write_content', shouldContinue, {
      next: 'score_seo',
      [END]: END,
    })
    .addConditionalEdges('score_seo', shouldContinue, {
      next: 'check_compliance',
      [END]: END,
    })
    .addEdge('check_compliance', 'handle_compliance')
    .addConditionalEdges('handle_compliance', complianceRouting, {
      check_compliance: 'check_compliance',
      queue_for_review: 'queue_for_review',
      [END]: END,
    })
    .addEdge('queue_for_review', END)

  return graph.compile()
}

export type { ContentBrief, GeneratedContent, ContentTopic, PracticeProfile }

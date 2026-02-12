import { Annotation, StateGraph, START, END } from '@langchain/langgraph'
import { ChatAnthropic } from '@langchain/anthropic'
import { GSCClient } from '@packages/agents/integrations/google-search-console'
import { SERankingClient } from '@packages/agents/integrations/se-ranking'
import type { GSCQuery } from '@packages/agents/integrations/google-search-console'
import type { KeywordData } from '@packages/agents/integrations/se-ranking'
import { supabaseAdmin } from '@packages/db/client'
import { updateRun } from '@packages/db/queries/agent-runs'
import { getClientById } from '@packages/db/queries/clients'
import type { CreateKeywordInput, CreateAgentActionInput } from '@packages/db/types'

// ─── Type Definitions ──────────────────────────────────────────────

interface PrioritizedKeyword {
  keyword: string
  searchVolume: number
  difficulty: number
  priority: number
  reasoning: string
  keywordType: string
  source: string
}

interface ContentTopic {
  keyword: string
  suggestedTitle: string
  angle: string
  estimatedVolume: number
}

interface CompetitorKeywordSet {
  competitor: string
  keywords: KeywordData[]
}

interface PracticeProfile {
  services?: string[]
  city?: string
  state?: string
  practice_name?: string
  [key: string]: unknown
}

interface PrioritizeResponse {
  prioritizedKeywords: PrioritizedKeyword[]
  contentTopics: ContentTopic[]
}

// ─── State Definition ──────────────────────────────────────────────

const ScholarState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  practiceProfile: Annotation<PracticeProfile>,
  siteUrl: Annotation<string>,
  gscData: Annotation<GSCQuery[]>,
  researchedKeywords: Annotation<KeywordData[]>,
  competitorKeywords: Annotation<CompetitorKeywordSet[]>,
  gapAnalysis: Annotation<KeywordData[]>,
  prioritizedKeywords: Annotation<PrioritizedKeyword[]>,
  contentTopics: Annotation<ContentTopic[]>,
  error: Annotation<string | null>,
})

type ScholarStateType = typeof ScholarState.State

// ─── Helper Functions ──────────────────────────────────────────────

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function extractJSON<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr) as T
}

function generateSeedKeywords(profile: PracticeProfile): string[] {
  const services = profile.services ?? []
  const city = profile.city ?? ''
  const seeds: string[] = []

  for (const service of services) {
    seeds.push(`${service} near me`)
    if (city) {
      seeds.push(`${service} ${city}`)
      seeds.push(`best ${service} ${city}`)
      seeds.push(`${service} cost ${city}`)
    }
  }

  // Add common dental seed keywords if no services specified
  if (seeds.length === 0 && city) {
    const defaults = ['dentist', 'dental implants', 'teeth whitening', 'emergency dentist']
    for (const term of defaults) {
      seeds.push(`${term} ${city}`)
      seeds.push(`${term} near me`)
    }
  }

  return seeds
}

// ─── Node Functions ────────────────────────────────────────────────

async function fetchGSCData(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    const gscClient = new GSCClient(state.clientId)

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)

    const queries = await gscClient.getTopQueries({
      siteUrl: state.siteUrl,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rowLimit: 500,
    })

    return { gscData: queries }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in fetchGSCData'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

async function researchKeywords(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    const seeds = generateSeedKeywords(state.practiceProfile)
    const seClient = new SERankingClient()
    const results = await seClient.bulkKeywordResearch(seeds)

    return { researchedKeywords: results }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in researchKeywords'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

async function analyzeCompetitors(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    const client = await getClientById(state.clientId)
    const competitors = (client?.competitors ?? []) as Array<{ domain: string; name?: string }>

    const seClient = new SERankingClient()
    const competitorData: CompetitorKeywordSet[] = []

    for (const comp of competitors) {
      const keywords = await seClient.getCompetitorKeywords(comp.domain)
      competitorData.push({
        competitor: comp.name ?? comp.domain,
        keywords,
      })
    }

    return { competitorKeywords: competitorData }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in analyzeCompetitors'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

async function gapAnalysis(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    const myKeywords = new Set([
      ...state.gscData.map((q) => q.query.toLowerCase()),
      ...state.researchedKeywords.map((k) => k.keyword.toLowerCase()),
    ])

    const gaps = state.competitorKeywords.flatMap((comp) =>
      comp.keywords.filter(
        (k) =>
          !myKeywords.has(k.keyword.toLowerCase()) &&
          k.searchVolume > 50 &&
          k.difficulty < 60
      )
    )

    const topGaps = gaps
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 50)

    return { gapAnalysis: topGaps }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in gapAnalysis'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

async function prioritize(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    const model = new ChatAnthropic({
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
    })

    const allKeywords = [
      ...state.researchedKeywords.map((k) => ({ ...k, source: 'research' })),
      ...state.gapAnalysis.map((k) => ({ ...k, source: 'gap' })),
    ]

    const response = await model.invoke([
      {
        role: 'system',
        content:
          'You are an expert dental SEO strategist. Analyze keyword data and prioritize opportunities for a dental practice. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Practice profile:
${JSON.stringify(state.practiceProfile, null, 2)}

Current GSC performance (top queries):
${JSON.stringify(state.gscData.slice(0, 20), null, 2)}

Keyword opportunities (${allKeywords.length} total):
${JSON.stringify(allKeywords.slice(0, 100), null, 2)}

Tasks:
1. Rank the top 30 keywords by priority. Consider: search volume, difficulty (prefer <40), relevance to this practice's services, and local intent.
2. For the top 5 keywords, suggest a content topic (blog post title + brief angle).
3. Return JSON with this exact structure:
{
  "prioritizedKeywords": [{ "keyword": "...", "searchVolume": 0, "difficulty": 0, "priority": 1, "reasoning": "...", "keywordType": "target|gap|branded", "source": "research|gap" }],
  "contentTopics": [{ "keyword": "...", "suggestedTitle": "...", "angle": "...", "estimatedVolume": 0 }]
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

    const parsed = extractJSON<PrioritizeResponse>(responseText)

    return {
      prioritizedKeywords: parsed.prioritizedKeywords,
      contentTopics: parsed.contentTopics,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in prioritize'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

async function saveResults(
  state: ScholarStateType
): Promise<Partial<ScholarStateType>> {
  try {
    // Upsert prioritized keywords
    const keywordInputs: CreateKeywordInput[] = state.prioritizedKeywords.map(
      (kw) => ({
        org_id: state.orgId,
        client_id: state.clientId,
        keyword: kw.keyword,
        current_position: null,
        previous_position: null,
        best_position: null,
        search_volume: kw.searchVolume,
        difficulty: kw.difficulty,
        keyword_type: kw.keywordType ?? 'target',
        source: kw.source ?? 'scholar',
        serp_features: [],
        last_checked_at: null,
      })
    )

    if (keywordInputs.length > 0) {
      await supabaseAdmin
        .from('keywords')
        .upsert(keywordInputs, { onConflict: 'client_id,keyword' })
    }

    // Create agent_actions for content topic recommendations
    const actions: CreateAgentActionInput[] = state.contentTopics.map(
      (topic) => ({
        org_id: state.orgId,
        client_id: state.clientId,
        agent: 'scholar' as const,
        action_type: 'content_recommendation',
        autonomy_tier: 1,
        status: 'pending' as const,
        severity: 'info' as const,
        description: `Content topic: ${topic.suggestedTitle} — ${topic.angle}`,
        proposed_data: {
          keyword: topic.keyword,
          suggestedTitle: topic.suggestedTitle,
          angle: topic.angle,
          estimatedVolume: topic.estimatedVolume,
        },
        rollback_data: {},
        content_piece_id: null,
        approved_by: null,
        approved_at: null,
        deployed_at: null,
      })
    )

    if (actions.length > 0) {
      await supabaseAdmin.from('agent_actions').insert(actions)
    }

    // Update agent run as completed
    await updateRun(state.runId, {
      status: 'completed',
      result: {
        keywordsTracked: state.prioritizedKeywords.length,
        contentTopics: state.contentTopics.length,
        gapKeywords: state.gapAnalysis.length,
      },
      completed_at: new Date().toISOString(),
    })

    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error in saveResults'
    await updateRun(state.runId, {
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    })
    return { error: message }
  }
}

// ─── Conditional Edge ──────────────────────────────────────────────

function shouldContinue(state: ScholarStateType): string {
  if (state.error) {
    return END
  }
  return 'next'
}

// ─── Graph Construction ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createScholarGraph() {
  const graph = new StateGraph(ScholarState)
    .addNode('fetch_gsc_data', fetchGSCData)
    .addNode('research_keywords', researchKeywords)
    .addNode('analyze_competitors', analyzeCompetitors)
    .addNode('gap_analysis', gapAnalysis)
    .addNode('prioritize', prioritize)
    .addNode('save_results', saveResults)
    .addEdge(START, 'fetch_gsc_data')
    .addConditionalEdges('fetch_gsc_data', shouldContinue, {
      next: 'research_keywords',
      [END]: END,
    })
    .addConditionalEdges('research_keywords', shouldContinue, {
      next: 'analyze_competitors',
      [END]: END,
    })
    .addConditionalEdges('analyze_competitors', shouldContinue, {
      next: 'gap_analysis',
      [END]: END,
    })
    .addConditionalEdges('gap_analysis', shouldContinue, {
      next: 'prioritize',
      [END]: END,
    })
    .addConditionalEdges('prioritize', shouldContinue, {
      next: 'save_results',
      [END]: END,
    })
    .addEdge('save_results', END)

  return graph.compile()
}

export type { PrioritizedKeyword, ContentTopic, CompetitorKeywordSet, PracticeProfile }

import type { AgentAction } from '@packages/db/types'

// ── Types ────────────────────────────────────────────────────────

interface PlainEnglishWin {
  message: string
  impact: 'high' | 'medium' | 'low'
  timestamp: string
  actionType: string
}

// ── Translation Map ──────────────────────────────────────────────

type TranslationFn = (data: Record<string, unknown>) => {
  message: string
  impact: 'high' | 'medium' | 'low'
}

const translations: Record<string, TranslationFn> = {
  content_new: (data) => ({
    message: `We published '${data.title ?? 'a new article'}' targeting a keyword ${data.volume ?? 'many'} people search monthly`,
    impact: 'high',
  }),

  keyword_research: (data) => ({
    message: `We found ${data.count ?? 'new'} new keyword opportunities for your practice`,
    impact: 'medium',
  }),

  gbp_post: (data) => ({
    message: `We published a Google Business Profile update about ${data.topic ?? 'your practice'}`,
    impact: 'medium',
  }),

  meta_update: (data) => ({
    message: `We improved how Google displays your ${data.page ?? 'website'} page`,
    impact: 'medium',
  }),

  keyword_improvement: (data) => ({
    message: `Your ranking for '${data.keyword ?? 'a keyword'}' improved from #${data.prev ?? '?'} to #${data.current ?? '?'}`,
    impact: 'high',
  }),

  content_edit: (data) => ({
    message: `We updated '${data.title ?? 'existing content'}' to improve its SEO performance`,
    impact: 'medium',
  }),

  profile_update: () => ({
    message: 'We auto-populated your practice profile with information from your website',
    impact: 'low',
  }),
}

// ── Main Function ────────────────────────────────────────────────

export function toPlainEnglishWin(action: AgentAction): PlainEnglishWin {
  const data = action.proposed_data ?? {}
  const translator = translations[action.action_type]

  if (translator) {
    const { message, impact } = translator(data)
    return {
      message,
      impact,
      timestamp: action.deployed_at ?? action.created_at,
      actionType: action.action_type,
    }
  }

  // Fallback for unknown action types
  return {
    message: action.description || `An action was completed: ${action.action_type}`,
    impact: 'low',
    timestamp: action.deployed_at ?? action.created_at,
    actionType: action.action_type,
  }
}

export type { PlainEnglishWin }

// ─── Enum Union Types ────────────────────────────────────────────────

export type ManagementMode = 'managed' | 'self_service'

export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'rejected'

export type ContentType = 'blog_post' | 'service_page' | 'faq' | 'gbp_post'

export type ComplianceStatus = 'pass' | 'warn' | 'block'

export type ActionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deployed'
  | 'rolled_back'

export type Severity = 'critical' | 'warning' | 'info'

export type AgentName = 'conductor' | 'scholar' | 'ghostwriter' | 'analyst'

export type RunStatus = 'running' | 'paused' | 'completed' | 'failed'

export type GbpPostStatus = 'draft' | 'scheduled' | 'published'

export type AccountHealth = 'active' | 'disconnected' | 'error'

// ─── Row Interfaces ─────────────────────────────────────────────────

export interface Client {
  id: string
  org_id: string
  name: string
  domain: string
  management_mode: ManagementMode
  vertical: string
  health_score: number
  practice_profile: Record<string, unknown>
  google_tokens: Record<string, unknown>
  cms_type: string | null
  cms_credentials: Record<string, unknown>
  account_health: AccountHealth
  competitors: unknown[]
  onboarding_step: number | null
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ContentPiece {
  id: string
  org_id: string
  client_id: string
  title: string
  body_html: string | null
  body_markdown: string | null
  content_type: ContentType
  status: ContentStatus
  target_keyword: string | null
  related_keywords: unknown[]
  seo_score: number
  word_count: number
  compliance_status: ComplianceStatus
  compliance_details: unknown[]
  meta_title: string | null
  meta_description: string | null
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Keyword {
  id: string
  org_id: string
  client_id: string
  keyword: string
  current_position: number | null
  previous_position: number | null
  best_position: number | null
  search_volume: number
  difficulty: number
  keyword_type: string
  source: string
  serp_features: unknown[]
  last_checked_at: string | null
  created_at: string
}

export interface AgentAction {
  id: string
  org_id: string
  client_id: string
  agent: AgentName
  action_type: string
  autonomy_tier: number
  status: ActionStatus
  severity: Severity
  description: string
  proposed_data: Record<string, unknown>
  rollback_data: Record<string, unknown>
  content_piece_id: string | null
  approved_by: string | null
  approved_at: string | null
  deployed_at: string | null
  created_at: string
}

export interface Lead {
  id: string
  domain: string
  email: string | null
  audit_score: number | null
  audit_results: Record<string, unknown>
  converted: boolean
  converted_at: string | null
  source: string | null
  ip_hash: string | null
  created_at: string
}

export interface GbpPost {
  id: string
  org_id: string
  client_id: string
  post_type: string
  title: string | null
  body: string
  image_url: string | null
  cta_type: string | null
  cta_url: string | null
  status: GbpPostStatus
  scheduled_at: string | null
  published_at: string | null
  gbp_post_id: string | null
  created_at: string
}

export interface AgentRun {
  id: string
  org_id: string
  client_id: string
  agent: AgentName
  graph_id: string | null
  status: RunStatus
  trigger: string
  config: Record<string, unknown>
  result: Record<string, unknown>
  error: string | null
  started_at: string
  completed_at: string | null
  checkpoint_data: Record<string, unknown>
}

// ─── Insert Types ───────────────────────────────────────────────────

export type CreateClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>

export type CreateContentPieceInput = Omit<ContentPiece, 'id' | 'created_at' | 'updated_at'>

export type CreateKeywordInput = Omit<Keyword, 'id' | 'created_at'>

export type CreateAgentActionInput = Omit<AgentAction, 'id' | 'created_at'>

export type CreateLeadInput = Omit<Lead, 'id' | 'created_at'>

export type CreateGbpPostInput = Omit<GbpPost, 'id' | 'created_at'>

export type CreateAgentRunInput = Omit<AgentRun, 'id' | 'started_at'>

// ─── Update Types ───────────────────────────────────────────────────

export type UpdateClientInput = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>

export type UpdateContentPieceInput = Partial<Omit<ContentPiece, 'id' | 'created_at' | 'updated_at'>>

export type UpdateKeywordInput = Partial<Omit<Keyword, 'id' | 'created_at'>>

export type UpdateAgentActionInput = Partial<Omit<AgentAction, 'id' | 'created_at'>>

export type UpdateLeadInput = Partial<Omit<Lead, 'id' | 'created_at'>>

export type UpdateGbpPostInput = Partial<Omit<GbpPost, 'id' | 'created_at'>>

export type UpdateAgentRunInput = Partial<Omit<AgentRun, 'id' | 'started_at'>>

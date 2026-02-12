-- supabase/migrations/001_pilot_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE management_mode AS ENUM ('managed', 'self_service');
CREATE TYPE content_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'rejected');
CREATE TYPE content_type AS ENUM ('blog_post', 'service_page', 'faq', 'gbp_post');
CREATE TYPE compliance_status AS ENUM ('pass', 'warn', 'block');
CREATE TYPE action_status AS ENUM ('pending', 'approved', 'rejected', 'deployed', 'rolled_back');
CREATE TYPE severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE agent_name AS ENUM ('conductor', 'scholar', 'ghostwriter', 'analyst');
CREATE TYPE run_status AS ENUM ('running', 'paused', 'completed', 'failed');
CREATE TYPE gbp_post_status AS ENUM ('draft', 'scheduled', 'published');
CREATE TYPE account_health AS ENUM ('active', 'disconnected', 'error');

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  management_mode management_mode DEFAULT 'managed',
  vertical TEXT DEFAULT 'dental',
  health_score INTEGER DEFAULT 0,
  practice_profile JSONB DEFAULT '{}',
  google_tokens JSONB DEFAULT '{}',
  cms_type TEXT,
  cms_credentials JSONB DEFAULT '{}',
  account_health account_health DEFAULT 'active',
  competitors JSONB DEFAULT '[]',
  onboarding_step INTEGER,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content pieces
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body_html TEXT,
  body_markdown TEXT,
  content_type content_type NOT NULL,
  status content_status DEFAULT 'draft',
  target_keyword TEXT,
  related_keywords JSONB DEFAULT '[]',
  seo_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  compliance_status compliance_status DEFAULT 'pass',
  compliance_details JSONB DEFAULT '[]',
  meta_title TEXT,
  meta_description TEXT,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  keyword_type TEXT DEFAULT 'tracked',
  source TEXT DEFAULT 'manual',
  serp_features JSONB DEFAULT '[]',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent actions (approval queue)
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent agent_name NOT NULL,
  action_type TEXT NOT NULL,
  autonomy_tier INTEGER NOT NULL DEFAULT 2,
  status action_status DEFAULT 'pending',
  severity severity DEFAULT 'info',
  description TEXT NOT NULL,
  proposed_data JSONB DEFAULT '{}',
  rollback_data JSONB DEFAULT '{}',
  content_piece_id UUID REFERENCES content_pieces(id),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (no RLS — anonymous access via API)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  email TEXT,
  audit_score INTEGER,
  audit_results JSONB DEFAULT '{}',
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  source TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GBP posts
CREATE TABLE gbp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  post_type TEXT DEFAULT 'update',
  title TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  cta_type TEXT,
  cta_url TEXT,
  status gbp_post_status DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  gbp_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent agent_name NOT NULL,
  graph_id TEXT,
  status run_status DEFAULT 'running',
  trigger TEXT DEFAULT 'manual',
  config JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  checkpoint_data JSONB DEFAULT '{}'
);

-- RLS policies (all tables except leads)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Generic RLS policy for each table
CREATE POLICY "org_isolation" ON clients FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON content_pieces FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON keywords FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON agent_actions FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON gbp_posts FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON agent_runs FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));

-- Indexes
CREATE INDEX idx_agent_actions_status ON agent_actions(status, org_id);
CREATE INDEX idx_agent_actions_client ON agent_actions(client_id, status);
CREATE INDEX idx_content_pieces_client ON content_pieces(client_id, status);
CREATE INDEX idx_keywords_client ON keywords(client_id, keyword_type);
CREATE INDEX idx_keywords_position ON keywords(client_id, current_position);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_domain ON leads(domain);
CREATE INDEX idx_gbp_posts_scheduled ON gbp_posts(scheduled_at) WHERE status = 'scheduled';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_pieces_updated_at BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

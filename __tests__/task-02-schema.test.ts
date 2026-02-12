import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SQL_PATH = path.resolve(PROJECT_ROOT, 'supabase/migrations/001_pilot_schema.sql')

describe('TASK-02: Schema Validation', () => {
  let sql: string

  beforeAll(() => {
    sql = fs.readFileSync(SQL_PATH, 'utf-8')
  })

  describe('Extensions', () => {
    it('should enable pgcrypto extension', () => {
      expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    })
  })

  describe('Enums', () => {
    const expectedEnums = [
      'management_mode',
      'content_status',
      'content_type',
      'compliance_status',
      'action_status',
      'severity',
      'agent_name',
      'run_status',
      'gbp_post_status',
      'account_health',
    ]

    expectedEnums.forEach((enumName) => {
      it(`should define enum: ${enumName}`, () => {
        expect(sql).toMatch(new RegExp(`CREATE TYPE ${enumName} AS ENUM`))
      })
    })

    it('should define exactly 10 enums', () => {
      const enumCount = (sql.match(/CREATE TYPE \w+ AS ENUM/g) || []).length
      expect(enumCount).toBe(10)
    })
  })

  describe('Tables', () => {
    const expectedTables = [
      'clients',
      'content_pieces',
      'keywords',
      'agent_actions',
      'leads',
      'gbp_posts',
      'agent_runs',
    ]

    expectedTables.forEach((table) => {
      it(`should define table: ${table}`, () => {
        expect(sql).toMatch(new RegExp(`CREATE TABLE ${table}\\s*\\(`))
      })
    })

    it('should define exactly 7 tables', () => {
      const tableCount = (sql.match(/CREATE TABLE \w+\s*\(/g) || []).length
      expect(tableCount).toBe(7)
    })
  })

  describe('Row Level Security', () => {
    const rlsTables = [
      'clients',
      'content_pieces',
      'keywords',
      'agent_actions',
      'gbp_posts',
      'agent_runs',
    ]

    rlsTables.forEach((table) => {
      it(`should enable RLS on ${table}`, () => {
        expect(sql).toMatch(
          new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
        )
      })

      it(`should create org_isolation policy on ${table}`, () => {
        expect(sql).toMatch(new RegExp(`CREATE POLICY.*ON ${table}`))
      })
    })

    it('should NOT enable RLS on leads', () => {
      expect(sql).not.toMatch(/ALTER TABLE leads ENABLE ROW LEVEL SECURITY/)
    })

    it('should reference JWT org_id claim in policies', () => {
      expect(sql).toContain(
        "current_setting('request.jwt.claims', true)::json->>'org_id'"
      )
    })
  })

  describe('Indexes', () => {
    const expectedIndexes = [
      'idx_agent_actions_status',
      'idx_agent_actions_client',
      'idx_content_pieces_client',
      'idx_keywords_client',
      'idx_keywords_position',
      'idx_leads_email',
      'idx_leads_domain',
      'idx_gbp_posts_scheduled',
    ]

    expectedIndexes.forEach((indexName) => {
      it(`should create index: ${indexName}`, () => {
        expect(sql).toContain(indexName)
      })
    })

    it('should have exactly 8 CREATE INDEX statements', () => {
      const indexCount = (sql.match(/CREATE INDEX/g) || []).length
      expect(indexCount).toBe(8)
    })

    it('should have partial index on leads(email) WHERE email IS NOT NULL', () => {
      expect(sql).toMatch(/idx_leads_email.*WHERE email IS NOT NULL/)
    })

    it('should have partial index on gbp_posts WHERE status = scheduled', () => {
      expect(sql).toMatch(/idx_gbp_posts_scheduled.*WHERE status = 'scheduled'/)
    })
  })

  describe('Triggers', () => {
    it('should create update_updated_at function', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION update_updated_at()')
    })

    it('should create trigger on clients', () => {
      expect(sql).toMatch(/CREATE TRIGGER.*clients_updated_at.*ON clients/)
    })

    it('should create trigger on content_pieces', () => {
      expect(sql).toMatch(
        /CREATE TRIGGER.*content_pieces_updated_at.*ON content_pieces/
      )
    })
  })
})

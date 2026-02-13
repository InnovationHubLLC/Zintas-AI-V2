import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath))
}

describe('TASK-34: Conductor Pipeline', () => {
  describe('file existence', () => {
    it('conductor graph.ts should exist', () => {
      expect(fileExists('packages/agents/conductor/graph.ts')).toBe(true)
    })

    it('conductor index.ts should exist', () => {
      expect(fileExists('packages/agents/conductor/index.ts')).toBe(true)
    })

    it('weekly-pipeline cron route should exist', () => {
      expect(fileExists('app/api/cron/weekly-pipeline/route.ts')).toBe(true)
    })
  })

  // ── Conductor Graph ────────────────────────────────────────
  describe('conductor graph: packages/agents/conductor/graph.ts', () => {
    const content = readFile('packages/agents/conductor/graph.ts')

    // Imports
    it('should import Annotation from @langchain/langgraph', () => {
      expect(content).toContain('Annotation')
      expect(content).toContain('@langchain/langgraph')
    })

    it('should import StateGraph from @langchain/langgraph', () => {
      expect(content).toContain('StateGraph')
    })

    it('should import START and END from @langchain/langgraph', () => {
      expect(content).toContain('START')
      expect(content).toContain('END')
    })

    it('should import runScholar', () => {
      expect(content).toContain('runScholar')
    })

    it('should import runGhostwriter', () => {
      expect(content).toContain('runGhostwriter')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import createRun', () => {
      expect(content).toContain('createRun')
    })

    it('should import updateRun', () => {
      expect(content).toContain('updateRun')
    })

    // State definition
    it('should define ConductorState using Annotation.Root', () => {
      expect(content).toMatch(/ConductorState\s*=\s*Annotation\.Root/)
    })

    it('should have clientId in state', () => {
      expect(content).toMatch(/clientId.*Annotation<string>/)
    })

    it('should have orgId in state', () => {
      expect(content).toMatch(/orgId.*Annotation<string>/)
    })

    it('should have runId in state', () => {
      expect(content).toMatch(/runId.*Annotation<string>/)
    })

    it('should have stage in state', () => {
      expect(content).toContain('stage')
    })

    it('should have error in state', () => {
      expect(content).toMatch(/error.*Annotation<string \| null>/)
    })

    // Node functions
    it('should define checkHealth node function', () => {
      expect(content).toMatch(/async function checkHealth/)
    })

    it('should define runScholarNode node function', () => {
      expect(content).toMatch(/async function runScholarNode/)
    })

    it('should define runGhostwriterNode node function', () => {
      expect(content).toMatch(/async function runGhostwriterNode/)
    })

    it('should define finalize node function', () => {
      expect(content).toMatch(/async function finalize/)
    })

    // Health check specifics
    it('should check account_health status', () => {
      expect(content).toContain('account_health')
    })

    it('should check for active status', () => {
      expect(content).toContain("'active'")
    })

    // Scholar integration
    it('should invoke Scholar agent', () => {
      expect(content).toContain('runScholar')
    })

    // Ghostwriter integration
    it('should process top 2 topics', () => {
      expect(content).toContain('2')
    })

    it('should invoke Ghostwriter for each topic', () => {
      expect(content).toContain('runGhostwriter')
    })

    // Graph construction
    it('should export createConductorGraph function', () => {
      expect(content).toMatch(/export function createConductorGraph/)
    })

    it('should create new StateGraph with ConductorState', () => {
      expect(content).toMatch(/new StateGraph\(ConductorState\)/)
    })

    it('should add check_health node', () => {
      expect(content).toContain("'check_health'")
    })

    it('should add run_scholar node', () => {
      expect(content).toContain("'run_scholar'")
    })

    it('should add run_ghostwriter node', () => {
      expect(content).toContain("'run_ghostwriter'")
    })

    it('should add finalize node', () => {
      expect(content).toContain("'finalize'")
    })

    it('should connect START to check_health', () => {
      expect(content).toMatch(/addEdge\(START/)
    })

    it('should have conditional health routing', () => {
      expect(content).toContain('addConditionalEdges')
    })

    it('should compile the graph', () => {
      expect(content).toContain('.compile()')
    })

    // Error handling
    it('should handle errors with try-catch', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    it('should set status to failed on error', () => {
      expect(content).toContain("'failed'")
    })

    it('should set status to completed on success', () => {
      expect(content).toContain("'completed'")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Conductor Index ────────────────────────────────────────
  describe('conductor index: packages/agents/conductor/index.ts', () => {
    const content = readFile('packages/agents/conductor/index.ts')

    it('should export runConductor function', () => {
      expect(content).toMatch(/export async function runConductor/)
    })

    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    it('should accept orgId parameter', () => {
      expect(content).toContain('orgId')
    })

    it('should return ConductorResult', () => {
      expect(content).toContain('ConductorResult')
    })

    it('should import createConductorGraph', () => {
      expect(content).toContain('createConductorGraph')
    })

    it('should invoke the compiled graph', () => {
      expect(content).toContain('.invoke(')
    })

    it("should re-export from './graph'", () => {
      expect(content).toContain("from './graph'")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Weekly Pipeline Cron ───────────────────────────────────
  describe('weekly-pipeline cron: app/api/cron/weekly-pipeline/route.ts', () => {
    const content = readFile('app/api/cron/weekly-pipeline/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should verify CRON_SECRET', () => {
      expect(content).toContain('CRON_SECRET')
    })

    it('should return 401 for invalid secret', () => {
      expect(content).toContain('401')
    })

    it('should query active clients', () => {
      expect(content).toContain("'active'")
    })

    it('should use supabaseAdmin for cross-org access', () => {
      expect(content).toContain('supabaseAdmin')
    })

    it('should call runConductor for each client', () => {
      expect(content).toContain('runConductor')
    })

    it('should return triggered count', () => {
      expect(content).toContain('triggered')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Vercel Config ──────────────────────────────────────────
  describe('vercel.json', () => {
    const content = readFile('vercel.json')

    it('should include weekly-pipeline path', () => {
      expect(content).toContain('/api/cron/weekly-pipeline')
    })

    it('should include Monday 6 AM schedule', () => {
      expect(content).toContain('0 6 * * 1')
    })
  })

  // ── Agent Run Route Update ─────────────────────────────────
  describe('agent run route: app/api/agents/run/route.ts', () => {
    const content = readFile('app/api/agents/run/route.ts')

    it('should handle conductor agent', () => {
      expect(content).toContain("'conductor'")
    })

    it('should import runConductor', () => {
      expect(content).toContain('runConductor')
    })
  })
})

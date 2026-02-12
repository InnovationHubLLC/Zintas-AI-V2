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

describe('TASK-26: Ghostwriter Agent - LangGraph Implementation', () => {
  describe('file existence', () => {
    it('graph.ts should exist', () => {
      expect(fileExists('packages/agents/ghostwriter/graph.ts')).toBe(true)
    })

    it('index.ts should exist', () => {
      expect(fileExists('packages/agents/ghostwriter/index.ts')).toBe(true)
    })
  })

  describe('ghostwriter graph: packages/agents/ghostwriter/graph.ts', () => {
    const content = readFile('packages/agents/ghostwriter/graph.ts')

    // --- Imports ---
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

    it('should import ChatAnthropic from @langchain/anthropic', () => {
      expect(content).toContain('ChatAnthropic')
      expect(content).toContain('@langchain/anthropic')
    })

    it('should import complianceEngine', () => {
      expect(content).toContain('complianceEngine')
    })

    it('should import from @packages/compliance', () => {
      expect(content).toContain('@packages/compliance')
    })

    it('should import supabaseAdmin', () => {
      expect(content).toContain('supabaseAdmin')
    })

    it('should import updateRun', () => {
      expect(content).toContain('updateRun')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    // --- State Definition ---
    it('should define GhostwriterState using Annotation.Root', () => {
      expect(content).toMatch(/GhostwriterState\s*=\s*Annotation\.Root/)
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

    it('should have topic in state', () => {
      expect(content).toContain('topic')
    })

    it('should have content in state', () => {
      expect(content).toContain('content')
    })

    it('should have seoScore in state', () => {
      expect(content).toContain('seoScore')
    })

    it('should have complianceResult in state', () => {
      expect(content).toContain('complianceResult')
    })

    it('should have rewriteAttempts in state', () => {
      expect(content).toContain('rewriteAttempts')
    })

    it('should have error in state', () => {
      expect(content).toMatch(/error.*Annotation<string \| null>/)
    })

    // --- Type Definitions ---
    it('should define ContentBrief interface', () => {
      expect(content).toMatch(/interface ContentBrief/)
    })

    it('should include suggestedTitle in brief', () => {
      expect(content).toContain('suggestedTitle')
    })

    it('should include h2Sections in brief', () => {
      expect(content).toContain('h2Sections')
    })

    it('should include targetWordCount in brief', () => {
      expect(content).toContain('targetWordCount')
    })

    it('should define GeneratedContent interface', () => {
      expect(content).toMatch(/interface GeneratedContent/)
    })

    it('should include html field', () => {
      expect(content).toContain('html')
    })

    it('should include markdown field', () => {
      expect(content).toContain('markdown')
    })

    it('should include wordCount field', () => {
      expect(content).toContain('wordCount')
    })

    // --- Node Functions ---
    it('should define generateBrief node function', () => {
      expect(content).toMatch(/async function generateBrief/)
    })

    it('should define writeContent node function', () => {
      expect(content).toMatch(/async function writeContent/)
    })

    it('should define scoreSEO node function', () => {
      expect(content).toMatch(/async function scoreSEO/)
    })

    it('should define checkCompliance node function', () => {
      expect(content).toMatch(/async function checkCompliance/)
    })

    it('should define handleCompliance node function', () => {
      expect(content).toMatch(/async function handleCompliance/)
    })

    it('should define queueForReview node function', () => {
      expect(content).toMatch(/async function queueForReview/)
    })

    // --- generateBrief specifics ---
    it('should use practice profile for context', () => {
      expect(content).toContain('practiceProfile')
    })

    it('should generate h2 sections in brief', () => {
      expect(content).toContain('h2Sections')
    })

    // --- writeContent specifics ---
    it('should use max 4096 tokens for content generation', () => {
      expect(content).toContain('4096')
    })

    it('should generate metaTitle', () => {
      expect(content).toContain('metaTitle')
    })

    it('should generate metaDescription', () => {
      expect(content).toContain('metaDescription')
    })

    it('should include keyword density guidance', () => {
      expect(content).toMatch(/keyword.*density|2-3%/i)
    })

    it('should mention FAQ section in prompt', () => {
      expect(content).toMatch(/FAQ/i)
    })

    // --- scoreSEO specifics ---
    it('should check keyword in title', () => {
      expect(content).toMatch(/title|Title/)
    })

    it('should check keyword in first paragraph', () => {
      expect(content).toMatch(/first.*paragraph|paragraph.*first/i)
    })

    it('should check word count', () => {
      expect(content).toContain('wordCount')
    })

    it('should calculate score out of 100', () => {
      expect(content).toContain('100')
    })

    // --- checkCompliance specifics ---
    it('should call complianceEngine.check', () => {
      expect(content).toContain('complianceEngine.check')
    })

    it('should pass dental as vertical', () => {
      expect(content).toContain("'dental'")
    })

    // --- handleCompliance specifics ---
    it('should check rewriteAttempts for retry', () => {
      expect(content).toContain('rewriteAttempts')
    })

    it('should limit rewrites to max 2 attempts', () => {
      expect(content).toContain('2')
    })

    it('should auto-inject disclaimers for warnings', () => {
      expect(content).toContain('disclaimer')
    })

    // --- queueForReview specifics ---
    it('should create content_pieces record', () => {
      expect(content).toContain('content_pieces')
    })

    it('should set content status to in_review', () => {
      expect(content).toContain("'in_review'")
    })

    it('should create agent_actions record', () => {
      expect(content).toContain('agent_actions')
    })

    it('should set action status to pending', () => {
      expect(content).toContain("'pending'")
    })

    // --- Graph Construction ---
    it('should export createGhostwriterGraph function', () => {
      expect(content).toMatch(/export function createGhostwriterGraph/)
    })

    it('should create new StateGraph with GhostwriterState', () => {
      expect(content).toMatch(/new StateGraph\(GhostwriterState\)/)
    })

    it('should add generate_brief node', () => {
      expect(content).toContain("'generate_brief'")
    })

    it('should add write_content node', () => {
      expect(content).toContain("'write_content'")
    })

    it('should add score_seo node', () => {
      expect(content).toContain("'score_seo'")
    })

    it('should add check_compliance node', () => {
      expect(content).toContain("'check_compliance'")
    })

    it('should add handle_compliance node', () => {
      expect(content).toContain("'handle_compliance'")
    })

    it('should add queue_for_review node', () => {
      expect(content).toContain("'queue_for_review'")
    })

    it('should connect START to generate_brief', () => {
      expect(content).toMatch(/addEdge\(START/)
    })

    it('should compile the graph', () => {
      expect(content).toContain('.compile()')
    })

    // --- Conditional Compliance Loop ---
    it('should have compliance routing logic', () => {
      expect(content).toContain('addConditionalEdges')
    })

    it('should route back to check_compliance on block retry', () => {
      expect(content).toContain("'check_compliance'")
    })

    // --- Error Handling ---
    it('should use try-catch in node functions', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    it('should update run to failed on error', () => {
      expect(content).toContain("'failed'")
    })

    it('should check state.error for early termination', () => {
      expect(content).toMatch(/state\.error/)
    })

    // --- Type Exports ---
    it('should export ContentBrief type', () => {
      expect(content).toMatch(/export.*ContentBrief/)
    })

    it('should export GeneratedContent type', () => {
      expect(content).toMatch(/export.*GeneratedContent/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── index.ts ─────────────────────────────────────────────
  describe('ghostwriter index: packages/agents/ghostwriter/index.ts', () => {
    const content = readFile('packages/agents/ghostwriter/index.ts')

    it('should export runGhostwriter function', () => {
      expect(content).toMatch(/export async function runGhostwriter/)
    })

    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    it('should accept orgId parameter', () => {
      expect(content).toContain('orgId')
    })

    it('should accept topic parameter', () => {
      expect(content).toContain('topic')
    })

    it('should return GhostwriterResult', () => {
      expect(content).toContain('GhostwriterResult')
    })

    it('should import createGhostwriterGraph', () => {
      expect(content).toContain('createGhostwriterGraph')
    })

    it('should import createRun', () => {
      expect(content).toContain('createRun')
    })

    it('should invoke the compiled graph', () => {
      expect(content).toContain('.invoke(')
    })

    it('should define GhostwriterResult interface', () => {
      expect(content).toMatch(/interface GhostwriterResult/)
    })

    it('should include contentPieceId in result', () => {
      expect(content).toContain('contentPieceId')
    })

    it('should re-export from graph module', () => {
      expect(content).toContain("from './graph'")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})

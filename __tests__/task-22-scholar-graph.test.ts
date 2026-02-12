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

describe('TASK-22: Scholar Agent - LangGraph Implementation', () => {
  describe('file existence', () => {
    it('graph.ts should exist', () => {
      expect(fileExists('packages/agents/scholar/graph.ts')).toBe(true)
    })

    it('index.ts should exist', () => {
      expect(fileExists('packages/agents/scholar/index.ts')).toBe(true)
    })
  })

  describe('scholar graph: packages/agents/scholar/graph.ts', () => {
    const content = readFile('packages/agents/scholar/graph.ts')

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

    it('should import GSCClient', () => {
      expect(content).toContain('GSCClient')
    })

    it('should import SERankingClient', () => {
      expect(content).toContain('SERankingClient')
    })

    it('should import updateRun', () => {
      expect(content).toContain('updateRun')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import supabaseAdmin', () => {
      expect(content).toContain('supabaseAdmin')
    })

    // --- State Definition ---
    it('should define ScholarState using Annotation.Root', () => {
      expect(content).toMatch(/ScholarState\s*=\s*Annotation\.Root/)
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

    it('should have gscData in state', () => {
      expect(content).toContain('gscData')
    })

    it('should have researchedKeywords in state', () => {
      expect(content).toContain('researchedKeywords')
    })

    it('should have competitorKeywords in state', () => {
      expect(content).toContain('competitorKeywords')
    })

    it('should have gapAnalysis in state', () => {
      expect(content).toContain('gapAnalysis')
    })

    it('should have prioritizedKeywords in state', () => {
      expect(content).toContain('prioritizedKeywords')
    })

    it('should have contentTopics in state', () => {
      expect(content).toContain('contentTopics')
    })

    it('should have error in state', () => {
      expect(content).toMatch(/error.*Annotation<string \| null>/)
    })

    // --- Type Definitions ---
    it('should define PrioritizedKeyword interface', () => {
      expect(content).toMatch(/interface PrioritizedKeyword/)
    })

    it('should define ContentTopic interface', () => {
      expect(content).toMatch(/interface ContentTopic/)
    })

    it('should include suggestedTitle in ContentTopic', () => {
      expect(content).toContain('suggestedTitle')
    })

    it('should include angle in ContentTopic', () => {
      expect(content).toContain('angle')
    })

    it('should include estimatedVolume in ContentTopic', () => {
      expect(content).toContain('estimatedVolume')
    })

    // --- Node Functions ---
    it('should define fetchGSCData node function', () => {
      expect(content).toMatch(/async function fetchGSCData/)
    })

    it('should define researchKeywords node function', () => {
      expect(content).toMatch(/async function researchKeywords/)
    })

    it('should define analyzeCompetitors node function', () => {
      expect(content).toMatch(/async function analyzeCompetitors/)
    })

    it('should define gapAnalysis node function', () => {
      expect(content).toMatch(/async function gapAnalysis/)
    })

    it('should define prioritize node function', () => {
      expect(content).toMatch(/async function prioritize/)
    })

    it('should define saveResults node function', () => {
      expect(content).toMatch(/async function saveResults/)
    })

    // --- fetchGSCData specifics ---
    it('should call getTopQueries in fetchGSCData', () => {
      expect(content).toContain('getTopQueries')
    })

    it('should use 90-day date range', () => {
      expect(content).toContain('90')
    })

    // --- researchKeywords specifics ---
    it('should generate seed keywords from practice profile', () => {
      expect(content).toMatch(/generateSeedKeywords/)
    })

    it('should call bulkKeywordResearch', () => {
      expect(content).toContain('bulkKeywordResearch')
    })

    it('should generate "near me" keyword variants', () => {
      expect(content).toContain('near me')
    })

    it('should generate "best" keyword variants', () => {
      expect(content).toContain('best')
    })

    it('should generate "cost" keyword variants', () => {
      expect(content).toContain('cost')
    })

    // --- analyzeCompetitors specifics ---
    it('should call getCompetitorKeywords', () => {
      expect(content).toContain('getCompetitorKeywords')
    })

    it('should read competitors from client', () => {
      expect(content).toContain('competitors')
    })

    // --- gapAnalysis specifics ---
    it('should filter by search volume threshold', () => {
      expect(content).toContain('searchVolume')
    })

    it('should filter by difficulty threshold', () => {
      expect(content).toContain('difficulty')
    })

    it('should use Set for keyword deduplication in gap analysis', () => {
      expect(content).toMatch(/new Set/)
    })

    // --- prioritize specifics ---
    it('should use Claude model for prioritization', () => {
      expect(content).toMatch(/new ChatAnthropic/)
    })

    it('should include dental SEO context in prompt', () => {
      expect(content).toMatch(/dental/i)
    })

    it('should request JSON output from Claude', () => {
      expect(content).toContain('JSON')
    })

    it('should have extractJSON helper function', () => {
      expect(content).toMatch(/function extractJSON/)
    })

    // --- saveResults specifics ---
    it('should upsert keywords in saveResults', () => {
      expect(content).toContain('keywords')
    })

    it('should update run status to completed', () => {
      expect(content).toContain("'completed'")
    })

    it('should create agent_action entries', () => {
      expect(content).toContain('agent_actions')
    })

    // --- Graph Construction ---
    it('should export createScholarGraph function', () => {
      expect(content).toMatch(/export function createScholarGraph/)
    })

    it('should create new StateGraph with ScholarState', () => {
      expect(content).toMatch(/new StateGraph\(ScholarState\)/)
    })

    it('should add fetch_gsc_data node', () => {
      expect(content).toContain("'fetch_gsc_data'")
    })

    it('should add research_keywords node', () => {
      expect(content).toContain("'research_keywords'")
    })

    it('should add analyze_competitors node', () => {
      expect(content).toContain("'analyze_competitors'")
    })

    it('should add gap_analysis node', () => {
      expect(content).toContain("'gap_analysis'")
    })

    it('should add prioritize node', () => {
      expect(content).toContain("'prioritize'")
    })

    it('should add save_results node', () => {
      expect(content).toContain("'save_results'")
    })

    it('should connect START to fetch_gsc_data', () => {
      expect(content).toMatch(/addEdge\(START/)
    })

    it('should connect save_results to END', () => {
      expect(content).toMatch(/addEdge\(.*save_results.*END/)
    })

    it('should compile the graph', () => {
      expect(content).toContain('.compile()')
    })

    // --- Error Handling ---
    it('should implement error checking with shouldContinue', () => {
      expect(content).toContain('shouldContinue')
    })

    it('should use addConditionalEdges for error routing', () => {
      expect(content).toContain('addConditionalEdges')
    })

    it('should check state.error for early termination', () => {
      expect(content).toMatch(/state\.error/)
    })

    it('should use try-catch in node functions', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    it('should update run to failed status on error', () => {
      expect(content).toContain("'failed'")
    })

    // --- Helper Functions ---
    it('should have formatDate helper', () => {
      expect(content).toMatch(/function formatDate/)
    })

    it('should have generateSeedKeywords helper', () => {
      expect(content).toMatch(/function generateSeedKeywords/)
    })

    // --- Type Exports ---
    it('should export PrioritizedKeyword type', () => {
      expect(content).toMatch(/export.*PrioritizedKeyword/)
    })

    it('should export ContentTopic type', () => {
      expect(content).toMatch(/export.*ContentTopic/)
    })

    // --- No `any` types ---
    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── index.ts ─────────────────────────────────────────────
  describe('scholar index: packages/agents/scholar/index.ts', () => {
    const content = readFile('packages/agents/scholar/index.ts')

    it('should export runScholar function', () => {
      expect(content).toMatch(/export async function runScholar/)
    })

    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    it('should accept orgId parameter', () => {
      expect(content).toContain('orgId')
    })

    it('should return ScholarResult', () => {
      expect(content).toContain('ScholarResult')
    })

    it('should import createScholarGraph', () => {
      expect(content).toContain('createScholarGraph')
    })

    it('should import createRun', () => {
      expect(content).toContain('createRun')
    })

    it('should invoke the compiled graph', () => {
      expect(content).toContain('.invoke(')
    })

    it('should define ScholarResult interface', () => {
      expect(content).toMatch(/interface ScholarResult/)
    })

    it('should include runId in ScholarResult', () => {
      expect(content).toContain('runId')
    })

    it('should include status in ScholarResult', () => {
      expect(content).toContain('status')
    })

    it('should re-export from graph module', () => {
      expect(content).toContain("from './graph'")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})

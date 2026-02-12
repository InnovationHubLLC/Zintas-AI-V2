import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const TYPES_PATH = path.resolve(PROJECT_ROOT, 'packages/db/types.ts')

describe('TASK-02: TypeScript Types Validation', () => {
  let typesContent: string

  beforeAll(() => {
    typesContent = fs.readFileSync(TYPES_PATH, 'utf-8')
  })

  it('should exist at packages/db/types.ts', () => {
    expect(fs.existsSync(TYPES_PATH)).toBe(true)
  })

  describe('Enum type unions', () => {
    const enumTypes = [
      'ManagementMode',
      'ContentStatus',
      'ContentType',
      'ComplianceStatus',
      'ActionStatus',
      'Severity',
      'AgentName',
      'RunStatus',
      'GbpPostStatus',
      'AccountHealth',
    ]

    enumTypes.forEach((typeName) => {
      it(`should export type ${typeName}`, () => {
        expect(typesContent).toMatch(new RegExp(`export type ${typeName}`))
      })
    })
  })

  describe('Table interfaces', () => {
    const interfaces = [
      'Client',
      'ContentPiece',
      'Keyword',
      'AgentAction',
      'Lead',
      'GbpPost',
      'AgentRun',
    ]

    interfaces.forEach((iface) => {
      it(`should export interface ${iface}`, () => {
        expect(typesContent).toMatch(
          new RegExp(`export interface ${iface}\\s*\\{`)
        )
      })
    })
  })

  describe('Insert types (CreateXInput)', () => {
    const createTypes = [
      'CreateClientInput',
      'CreateContentPieceInput',
      'CreateKeywordInput',
      'CreateAgentActionInput',
      'CreateLeadInput',
      'CreateGbpPostInput',
      'CreateAgentRunInput',
    ]

    createTypes.forEach((typeName) => {
      it(`should export type ${typeName}`, () => {
        expect(typesContent).toMatch(new RegExp(`export type ${typeName}`))
      })
    })
  })

  describe('Update types (UpdateXInput)', () => {
    const updateTypes = [
      'UpdateClientInput',
      'UpdateContentPieceInput',
      'UpdateKeywordInput',
      'UpdateAgentActionInput',
      'UpdateLeadInput',
      'UpdateGbpPostInput',
      'UpdateAgentRunInput',
    ]

    updateTypes.forEach((typeName) => {
      it(`should export type ${typeName}`, () => {
        expect(typesContent).toMatch(new RegExp(`export type ${typeName}`))
      })
    })
  })

  it('should not contain the "any" type', () => {
    const anyMatches = typesContent.match(/:\s*any\b/g)
    expect(anyMatches).toBeNull()
  })
})

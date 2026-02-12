import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const COMPONENTS_DIR = path.resolve(PROJECT_ROOT, 'app/components')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath))
}

describe('TASK-08: Shared UI Components', () => {
  describe('app/components directory', () => {
    it('should exist', () => {
      expect(fs.existsSync(COMPONENTS_DIR)).toBe(true)
    })
  })

  describe('health-score-gauge.tsx', () => {
    const filePath = 'app/components/health-score-gauge.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export HealthScoreGauge', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) HealthScoreGauge/)
    })

    it('should define HealthScoreGaugeProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface HealthScoreGaugeProps/)
    })

    it('should accept score prop typed as number', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/score:\s*number/)
    })

    it('should accept size prop with sm|md|lg', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/size.*('sm'|'md'|'lg')/)
    })

    it('should use SVG circle elements', () => {
      const content = readFile(filePath)
      expect(content).toContain('<circle')
    })

    it('should have color-coding logic for score thresholds', () => {
      const content = readFile(filePath)
      expect(content).toContain('60')
      expect(content).toContain('80')
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('severity-badge.tsx', () => {
    const filePath = 'app/components/severity-badge.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export SeverityBadge', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) SeverityBadge/)
    })

    it('should define SeverityBadgeProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface SeverityBadgeProps/)
    })

    it('should use Severity type from db/types', () => {
      const content = readFile(filePath)
      expect(content).toContain('@packages/db/types')
    })

    it('should use Badge from shadcn/ui', () => {
      const content = readFile(filePath)
      expect(content).toContain('@/components/ui/badge')
    })

    it('should have a colored dot element', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/rounded-full/)
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('trend-indicator.tsx', () => {
    const filePath = 'app/components/trend-indicator.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export TrendIndicator', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) TrendIndicator/)
    })

    it('should define TrendIndicatorProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface TrendIndicatorProps/)
    })

    it('should accept current and previous as number props', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/current:\s*number/)
      expect(content).toMatch(/previous:\s*number/)
    })

    it('should use lucide-react icons', () => {
      const content = readFile(filePath)
      expect(content).toContain('lucide-react')
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('kpi-card.tsx', () => {
    const filePath = 'app/components/kpi-card.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export KpiCard', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) KpiCard/)
    })

    it('should define KpiCardProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface KpiCardProps/)
    })

    it('should accept title, value, and subtitle props', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/title:\s*string/)
      expect(content).toMatch(/value:\s*(string|number)/)
      expect(content).toMatch(/subtitle/)
    })

    it('should use Card from shadcn/ui', () => {
      const content = readFile(filePath)
      expect(content).toContain('@/components/ui/card')
    })

    it('should support optional trend', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/trend\??:/)
    })

    it('should support optional sparkline with recharts', () => {
      const content = readFile(filePath)
      expect(content).toContain('recharts')
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('approval-card.tsx', () => {
    const filePath = 'app/components/approval-card.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export ApprovalCard', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) ApprovalCard/)
    })

    it('should define ApprovalCardProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface ApprovalCardProps/)
    })

    it('should accept type prop with content|fix|seo', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/'content'.*'fix'.*'seo'/)
    })

    it('should accept callback props', () => {
      const content = readFile(filePath)
      expect(content).toContain('onApprove')
      expect(content).toContain('onReject')
      expect(content).toContain('onPreview')
    })

    it('should use Card from shadcn/ui', () => {
      const content = readFile(filePath)
      expect(content).toContain('@/components/ui/card')
    })

    it('should use Button from shadcn/ui', () => {
      const content = readFile(filePath)
      expect(content).toContain('@/components/ui/button')
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('agent-timeline.tsx', () => {
    const filePath = 'app/components/agent-timeline.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export AgentTimeline', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) AgentTimeline/)
    })

    it('should define AgentTimelineProps or AgentTimelineItem interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface AgentTimeline(Props|Item)/)
    })

    it('should use date-fns for relative time', () => {
      const content = readFile(filePath)
      expect(content).toContain('date-fns')
    })

    it('should use AgentName type from db/types', () => {
      const content = readFile(filePath)
      expect(content).toContain('@packages/db/types')
    })

    it('should have color-coded dots', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/rounded-full/)
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('empty-state.tsx', () => {
    const filePath = 'app/components/empty-state.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export EmptyState', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) EmptyState/)
    })

    it('should define EmptyStateProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface EmptyStateProps/)
    })

    it('should accept title and description', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/title:\s*string/)
      expect(content).toMatch(/description:\s*string/)
    })

    it('should accept optional icon', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/icon\??:/)
    })

    it('should accept optional action', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/action/)
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('compliance-badge.tsx', () => {
    const filePath = 'app/components/compliance-badge.tsx'

    it('should exist', () => {
      expect(fileExists(filePath)).toBe(true)
    })

    it('should export ComplianceBadge', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/export (function|const) ComplianceBadge/)
    })

    it('should define ComplianceBadgeProps interface', () => {
      const content = readFile(filePath)
      expect(content).toMatch(/interface ComplianceBadgeProps/)
    })

    it('should use ComplianceStatus from db/types', () => {
      const content = readFile(filePath)
      expect(content).toContain('@packages/db/types')
    })

    it('should use Popover from shadcn/ui', () => {
      const content = readFile(filePath)
      expect(content).toContain('@/components/ui/popover')
    })

    it('should handle pass, warn, and block statuses', () => {
      const content = readFile(filePath)
      expect(content).toContain('pass')
      expect(content).toContain('warn')
      expect(content).toContain('block')
    })

    it('should have JSDoc comments', () => {
      const content = readFile(filePath)
      expect(content).toContain('/**')
    })

    it('should not use any type', () => {
      const content = readFile(filePath)
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})

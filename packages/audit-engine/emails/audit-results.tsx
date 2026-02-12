import React from 'react'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components'
import type { Finding, AuditGrade } from '../index'

interface AuditResultsEmailProps {
  score: number
  grade: AuditGrade
  findings: Finding[]
  auditId: string
}

const STATUS_ICON: Record<string, string> = {
  pass: '✅',
  warning: '⚠️',
  fail: '❌',
  error: '⚠️',
}

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const header: React.CSSProperties = {
  padding: '24px 32px',
  backgroundColor: '#1e40af',
  textAlign: 'center' as const,
}

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const scoreSection: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center' as const,
}

const scoreHeading: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px',
}

const gradeText: React.CSSProperties = {
  fontSize: '18px',
  color: '#6b7280',
  margin: '0',
}

const findingsSection: React.CSSProperties = {
  padding: '0 32px',
}

const findingsHeading: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
}

const findingRow: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
}

const findingCategory: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px',
}

const findingText: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center' as const,
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
}

const footer: React.CSSProperties = {
  padding: '0 32px',
  textAlign: 'center' as const,
}

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '4px 0',
}

export function AuditResultsEmail({
  score,
  grade,
  findings,
  auditId,
}: AuditResultsEmailProps): React.JSX.Element {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zintas.ai'

  return (
    <Html>
      <Head />
      <Preview>{`Your website scored ${score}/100 (Grade: ${grade})`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Zintas AI</Heading>
          </Section>

          <Section style={scoreSection}>
            <Heading as="h1" style={scoreHeading}>
              Your website scored {score}/100
            </Heading>
            <Text style={gradeText}>Grade: {grade}</Text>
          </Section>

          <Hr />

          <Section style={findingsSection}>
            <Heading as="h2" style={findingsHeading}>
              Audit Findings
            </Heading>
            {findings.map((finding, index) => (
              <Section key={index} style={findingRow}>
                <Text style={findingCategory}>
                  {STATUS_ICON[finding.status] ?? '⚠️'} {finding.category} ({finding.score}/{finding.maxScore})
                </Text>
                <Text style={findingText}>{finding.finding}</Text>
              </Section>
            ))}
          </Section>

          <Hr />

          <Section style={ctaSection}>
            <Button
              href={`${appUrl}/sign-up?ref=audit&id=${auditId}`}
              style={ctaButton}
            >
              Fix These Issues — Start Your Free Trial
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you ran a free SEO audit on Zintas AI.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

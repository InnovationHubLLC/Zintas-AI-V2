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

interface WelcomeEmailProps {
  practiceName: string
  dashboardUrl: string
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

const contentSection: React.CSSProperties = {
  padding: '32px',
}

const headingStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
}

const bodyText: React.CSSProperties = {
  fontSize: '16px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const listItem: React.CSSProperties = {
  fontSize: '15px',
  color: '#4b5563',
  lineHeight: '1.8',
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  padding: '0 32px 32px',
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

export function WelcomeEmail({
  practiceName,
  dashboardUrl,
}: WelcomeEmailProps): React.JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>{`Welcome to Zintas AI, ${practiceName}! Your marketing team is getting to work.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logoText}>Zintas AI</Heading>
          </Section>

          <Section style={contentSection}>
            <Heading as="h1" style={headingStyle}>
              Welcome to Zintas AI!
            </Heading>
            <Text style={bodyText}>
              Hi {practiceName} team — your AI-powered marketing team is now getting to work.
            </Text>
            <Text style={bodyText}>
              In the next 24 hours, we will:
            </Text>
            <Text style={listItem}>1. Research keywords relevant to your practice and location</Text>
            <Text style={listItem}>2. Analyze competitors in your area</Text>
            <Text style={listItem}>3. Start writing SEO-optimized content for your website</Text>
          </Section>

          <Hr />

          <Section style={ctaSection}>
            <Button href={dashboardUrl} style={ctaButton}>
              Go to Your Dashboard
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because you signed up for Zintas AI.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

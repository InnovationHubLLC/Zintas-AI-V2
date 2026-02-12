'use client'

import { useState, useEffect } from 'react'
import {
  Search, CheckCircle, AlertCircle, Zap, ArrowRight, Smartphone,
  Tag, Code, MapPin, Shield, Heading, Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { HealthScoreGauge } from '@/app/components/health-score-gauge'

/* ---------- Type Declarations ---------- */

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

type FindingStatus = 'pass' | 'warning' | 'fail' | 'error'
type AuditGrade = 'A' | 'B' | 'C' | 'D' | 'F'

interface AuditFinding {
  category: string
  icon: string
  score: number
  maxScore: number
  status: FindingStatus
  finding: string
  recommendation?: string
}

interface AuditApiResponse {
  id: string
  score: number
  grade: AuditGrade
  findings: AuditFinding[]
}

interface AuditApiError {
  error: string
  details?: Array<{ message: string }>
}

/* ---------- Constants ---------- */

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  smartphone: Smartphone,
  tag: Tag,
  code: Code,
  'map-pin': MapPin,
  shield: Shield,
  heading: Heading,
}

const STATUS_CONFIG: Record<FindingStatus, { label: string; bg: string; text: string; border: string }> = {
  pass: { label: 'Pass', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  warning: { label: 'Warning', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  fail: { label: 'Fail', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  error: { label: 'Error', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

/* ---------- Helpers ---------- */

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? AlertCircle
}

async function getRecaptchaToken(): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) {
    return 'dev-bypass-token'
  }

  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.grecaptcha) {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'audit' })
          .then(resolve)
          .catch(reject)
      })
    } else {
      reject(new Error('reCAPTCHA not loaded'))
    }
  })
}

/* ---------- Scanning Steps ---------- */

const SCANNING_STEPS = [
  { label: 'Checking page speed', threshold: 15 },
  { label: 'Testing mobile friendliness', threshold: 30 },
  { label: 'Analyzing meta tags', threshold: 45 },
  { label: 'Scanning schema markup', threshold: 55 },
  { label: 'Verifying Google Business Profile', threshold: 65 },
  { label: 'Checking SSL security', threshold: 80 },
  { label: 'Reviewing heading structure', threshold: 95 },
]

/* ---------- Component ---------- */

export default function AuditPage(): React.JSX.Element {
  const [stage, setStage] = useState<'form' | 'scanning' | 'results'>('form')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [progress, setProgress] = useState(0)
  const [auditResult, setAuditResult] = useState<AuditApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load reCAPTCHA script on mount
  useEffect(() => {
    if (RECAPTCHA_SITE_KEY && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  // Animate progress during scanning
  useEffect(() => {
    if (stage !== 'scanning') return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90 && !auditResult) return 90
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 150)

    return () => clearInterval(interval)
  }, [stage, auditResult])

  // Transition to results when audit completes
  useEffect(() => {
    if (stage === 'scanning' && auditResult) {
      setProgress(100)
      const timeout = setTimeout(() => setStage('results'), 600)
      return () => clearTimeout(timeout)
    }
  }, [stage, auditResult])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const recaptchaToken = await getRecaptchaToken()
      const normalizedUrl = normalizeUrl(website)

      setStage('scanning')
      setProgress(0)

      const response = await fetch('/api/audit/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          ...(email.trim() ? { email: email.trim() } : {}),
          recaptchaToken,
        }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as AuditApiError
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        throw new Error(errorData.error || 'Failed to run audit')
      }

      const data = (await response.json()) as AuditApiResponse
      setAuditResult(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      setStage('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- Form Stage ---------- */

  if (stage === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Zintas AI
              </span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free SEO Audit
            </h1>
            <p className="text-xl text-gray-600">
              Discover how your dental practice ranks online and get actionable insights to improve.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Website URL
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="website"
                    type="text"
                    placeholder="www.yourpractice.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="doctor@yourpractice.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Enter email to see full results</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Starting Audit...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Run My Free Audit</span>
                  </>
                )}
              </button>

              <p className="text-sm text-center text-gray-600">
                Get your results in under a minute. No credit card required.
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- Scanning Stage ---------- */

  if (stage === 'scanning') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Website</h2>
              <p className="text-gray-600">This will take just a moment...</p>
            </div>

            <div className="mb-8">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}% complete</p>
            </div>

            <div className="space-y-3">
              {SCANNING_STEPS.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {progress > step.threshold ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full shrink-0 animate-pulse" />
                  )}
                  <span className={`text-sm ${progress > step.threshold ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- Results Stage ---------- */

  if (!auditResult) return <div />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Zintas AI
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your SEO Audit Results</h1>
          <p className="text-xl text-gray-600">{website}</p>
        </div>

        {/* Score + Grade */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall SEO Score</h2>
              <p className="text-gray-600">Based on 7 key ranking factors</p>
              <div className="mt-4">
                <span className={`inline-block px-4 py-2 text-2xl font-bold rounded-lg ${
                  auditResult.grade === 'A' ? 'bg-green-100 text-green-700' :
                  auditResult.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                  auditResult.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Grade: {auditResult.grade}
                </span>
              </div>
            </div>
            <HealthScoreGauge score={auditResult.score} size="lg" />
          </div>
        </div>

        {/* Findings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Findings</h2>
          <div className="space-y-4">
            {auditResult.findings.map((finding, index) => {
              const Icon = getIcon(finding.icon)
              const config = STATUS_CONFIG[finding.status]
              return (
                <div
                  key={index}
                  className={`p-5 rounded-xl border ${config.border} ${config.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{finding.category}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {finding.score}/{finding.maxScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{finding.finding}</p>
                      {finding.recommendation ? (
                        <p className="text-sm text-gray-600 italic">{finding.recommendation}</p>
                      ) : (
                        <p className="text-xs text-blue-600">Enter your email above to see the full recommendation.</p>
                      )}
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            finding.status === 'pass' ? 'bg-green-500' :
                            finding.status === 'warning' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(finding.score / finding.maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Email upsell banner */}
        {!email.trim() && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-center">
            <p className="text-blue-800 font-medium mb-1">
              Want the full report with detailed recommendations?
            </p>
            <p className="text-blue-600 text-sm">
              Enter your email when running the audit to see full results and receive a detailed report.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Fix These Issues?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Let our AI marketing team handle everything for you.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

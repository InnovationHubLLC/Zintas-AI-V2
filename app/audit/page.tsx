'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Target, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const formatRelativeTime = (isoString: string) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const mockAuditResults = {
  overallScore: 72,
  issues: [
    {
      severity: 'high',
      title: 'Missing meta descriptions on 8 pages',
      description: 'Meta descriptions help search engines understand your pages and improve click-through rates.',
      impact: 'High',
    },
    {
      severity: 'medium',
      title: 'Page load time averaging 4.2 seconds',
      description: 'Slow loading pages hurt user experience and search rankings. Aim for under 3 seconds.',
      impact: 'Medium',
    },
    {
      severity: 'high',
      title: 'No blog content in the last 90 days',
      description: 'Regular content updates signal to Google that your site is active and valuable.',
      impact: 'High',
    },
    {
      severity: 'low',
      title: 'Missing alt text on 12 images',
      description: 'Alt text improves accessibility and helps search engines understand image content.',
      impact: 'Low',
    },
  ],
  opportunities: [
    { title: 'Rank for "dental implants bentonville"', potential: 'High', competition: 'Medium' },
    { title: 'Rank for "family dentist near me"', potential: 'Very High', competition: 'High' },
    { title: 'Rank for "teeth whitening rogers ar"', potential: 'Medium', competition: 'Low' },
  ],
  competitors: [
    { name: 'Bright Smiles Dental', score: 85, trend: 'up' },
    { name: 'Family Dental Care', score: 78, trend: 'up' },
    { name: 'NWA Orthodontics', score: 65, trend: 'down' },
  ],
}

export default function AuditPage() {
  const [stage, setStage] = useState<'form' | 'scanning' | 'results'>('form')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [practiceName, setPracticeName] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (stage === 'scanning') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setStage('results'), 500)
            return 100
          }
          return prev + 2
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [stage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStage('scanning')
  }

  if (stage === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
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

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Website URL
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="website"
                    type="url"
                    placeholder="www.yourpractice.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="practiceName" className="block text-sm font-medium text-gray-900 mb-2">
                  Practice Name
                </label>
                <input
                  id="practiceName"
                  type="text"
                  placeholder="Smith Family Dental"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="doctor@yourpractice.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Start Free Audit</span>
              </button>

              <p className="text-sm text-center text-gray-600">
                Get your results in 60 seconds. No credit card required.
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

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

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}% complete</p>
            </div>

            {/* Scanning Steps */}
            <div className="space-y-3">
              {[
                { label: 'Scanning website structure', completed: progress > 20 },
                { label: 'Analyzing SEO elements', completed: progress > 40 },
                { label: 'Checking page speed', completed: progress > 60 },
                { label: 'Researching competitors', completed: progress > 80 },
                { label: 'Generating recommendations', completed: progress >= 100 },
              ].map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full shrink-0 animate-pulse" />
                  )}
                  <span className={`text-sm ${step.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
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

  // Results Stage
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
          <p className="text-xl text-gray-600">{practiceName} • {website}</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall SEO Score</h2>
              <p className="text-gray-600">Based on 50+ ranking factors</p>
            </div>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - mockAuditResults.overallScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{mockAuditResults.overallScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Found */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Issues Found</h2>
          <div className="space-y-4">
            {mockAuditResults.issues.map((issue, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  issue.severity === 'high'
                    ? 'bg-red-50 border-red-500'
                    : issue.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      issue.severity === 'high'
                        ? 'text-red-600'
                        : issue.severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{issue.title}</h3>
                    <p className="text-sm text-gray-600">{issue.description}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        issue.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : issue.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {issue.impact} Impact
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Keyword Opportunities */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Keyword Opportunities</h2>
            </div>
            <div className="space-y-3">
              {mockAuditResults.opportunities.map((opp, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200">
                  <p className="font-medium text-gray-900 mb-2">{opp.title}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span className="font-medium">Potential:</span>
                      <span className="text-green-600 font-semibold">{opp.potential}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="font-medium">Competition:</span>
                      <span>{opp.competition}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Competitors</h2>
            <div className="space-y-4">
              {mockAuditResults.competitors.map((comp, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    <p className="text-sm text-gray-600">SEO Score: {comp.score}</p>
                  </div>
                  {comp.trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Fix These Issues?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Let our AI marketing team handle everything for you.
          </p>
          <Link
            href="/practice/dashboard"
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

'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Search,
  BarChart3,
  MapPin,
  Loader2,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ─── Types ──────────────────────────────────────────────────────────

interface CMSResultData {
  cms: string
  confidence: string
  apiAvailable: boolean
  setupInstructions: string
}

interface Competitor {
  name: string
  domain: string
}

interface GoogleStatus {
  connected: boolean
  gsc: boolean
  ga: boolean
  gbp: boolean
}

interface PlanOption {
  name: string
  price: string
  description: string
  features: string[]
  recommended: boolean
}

// ─── Constants ──────────────────────────────────────────────────────

const PRACTICE_TYPES = [
  'General Dentistry',
  'Cosmetic Dentistry',
  'Orthodontics',
  'Pediatric Dentistry',
  'Oral Surgery',
  'Periodontics',
]

const PLANS: PlanOption[] = [
  {
    name: 'Starter',
    price: '$299/mo',
    description: 'Perfect for new practices',
    features: ['Keyword research', 'Monthly blog posts', 'Basic reporting'],
    recommended: false,
  },
  {
    name: 'Pro',
    price: '$499/mo',
    description: 'Most popular for growing practices',
    features: [
      'Everything in Starter',
      'Weekly content',
      'GBP optimization',
      'Competitor tracking',
      'Priority support',
    ],
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: '$799/mo',
    description: 'For multi-location practices',
    features: [
      'Everything in Pro',
      'Daily content',
      'Multi-location support',
      'Custom reporting',
      'Dedicated strategist',
    ],
    recommended: false,
  },
]

const STEP_TITLES = [
  'Your Practice',
  'Connect Google',
  'Competitors',
  'Choose Plan',
  'Launch',
]

// ─── Wizard Component ───────────────────────────────────────────────

function OnboardingWizard(): React.JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1 state
  const [practiceName, setPracticeName] = useState('')
  const [websiteURL, setWebsiteURL] = useState('')
  const [practiceType, setPracticeType] = useState('')
  const [address, setAddress] = useState('')

  // Org/Client state
  const [orgId, setOrgId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [cmsResult, setCmsResult] = useState<CMSResultData | null>(null)

  // Step 2 state
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({
    connected: false,
    gsc: false,
    ga: false,
    gbp: false,
  })

  // Step 3 state
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    []
  )
  const [customDomain, setCustomDomain] = useState('')

  // Step 4 state
  const [selectedPlan, setSelectedPlan] = useState('Pro')

  // Parse URL params on mount (from Google OAuth callback)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      setCurrentStep(parseInt(stepParam, 10))
    }

    const googleParam = searchParams.get('google')
    if (googleParam === 'connected') {
      setGoogleStatus({
        connected: true,
        gsc: searchParams.get('gsc') === 'true',
        ga: searchParams.get('ga') === 'true',
        gbp: searchParams.get('gbp') === 'true',
      })
    } else if (googleParam === 'error') {
      toast.error('Google connection failed. You can try again or skip.')
    }
  }, [searchParams])

  // ─── Step 1: Create Org ─────────────────────────────────────────

  const handleStep1Submit = useCallback(async () => {
    if (!practiceName || !websiteURL || !practiceType || !address) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceName,
          domain: websiteURL,
          vertical: practiceType,
          address,
          managementMode: 'self_service',
        }),
      })

      if (!response.ok) {
        const err = (await response.json()) as { error: string }
        toast.error(err.error || 'Failed to create organization')
        return
      }

      const data = (await response.json()) as {
        orgId: string
        clientId: string
        cmsResult: CMSResultData
      }
      setOrgId(data.orgId)
      setClientId(data.clientId)
      setCmsResult(data.cmsResult)
      setCurrentStep(2)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [practiceName, websiteURL, practiceType, address])

  // ─── Step 2: Google OAuth ───────────────────────────────────────

  const handleGoogleConnect = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/google-oauth', {
        method: 'POST',
      })

      if (!response.ok) {
        toast.error('Failed to initiate Google connection')
        return
      }

      const data = (await response.json()) as { url: string }
      window.location.href = data.url
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleGoogleSkip = useCallback(() => {
    setGoogleStatus((prev) => ({ ...prev, connected: false }))
    setCurrentStep(3)
  }, [])

  // ─── Step 3: Competitors ────────────────────────────────────────

  const fetchCompetitors = useCallback(async () => {
    if (!clientId) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          clientId,
          location: address,
          vertical: practiceType,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          competitors: Competitor[]
        }
        setCompetitors(data.competitors)
        setSelectedCompetitors(data.competitors.slice(0, 3))
      }
    } catch {
      toast.error('Failed to load competitor suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [clientId, address, practiceType])

  useEffect(() => {
    if (currentStep === 3 && clientId) {
      fetchCompetitors()
    }
  }, [currentStep, clientId, fetchCompetitors])

  const toggleCompetitor = useCallback(
    (competitor: Competitor) => {
      setSelectedCompetitors((prev) => {
        const isSelected = prev.some((c) => c.domain === competitor.domain)
        if (isSelected) {
          return prev.filter((c) => c.domain !== competitor.domain)
        }
        if (prev.length >= 5) {
          toast.error('Maximum 5 competitors allowed')
          return prev
        }
        return [...prev, competitor]
      })
    },
    []
  )

  const addCustomCompetitor = useCallback(() => {
    if (!customDomain.trim()) return
    if (selectedCompetitors.length >= 5) {
      toast.error('Maximum 5 competitors allowed')
      return
    }
    const newComp: Competitor = {
      name: customDomain.trim(),
      domain: customDomain.trim(),
    }
    setSelectedCompetitors((prev) => [...prev, newComp])
    setCustomDomain('')
  }, [customDomain, selectedCompetitors.length])

  const handleStep3Submit = useCallback(async () => {
    if (!clientId || selectedCompetitors.length === 0) {
      toast.error('Please select at least one competitor')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          clientId,
          competitors: selectedCompetitors,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to save competitors')
        return
      }

      setCurrentStep(4)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [clientId, selectedCompetitors])

  // ─── Step 5: Complete ───────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    if (!clientId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        const err = (await response.json()) as {
          error: string
          details?: string[]
        }
        toast.error(err.error || 'Failed to complete onboarding')
        return
      }

      const data = (await response.json()) as {
        success: boolean
        redirectTo: string
      }
      if (data.success) {
        router.push(data.redirectTo || '/practice/dashboard')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [clientId, router])

  // ─── Render Steps ───────────────────────────────────────────────

  const renderStep1 = (): React.JSX.Element => (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about your practice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="practiceName">Practice Name</Label>
          <Input
            id="practiceName"
            value={practiceName}
            onChange={(e) => setPracticeName(e.target.value)}
            placeholder="e.g., Bright Smile Dental"
          />
        </div>
        <div>
          <Label htmlFor="websiteURL">Website URL</Label>
          <Input
            id="websiteURL"
            value={websiteURL}
            onChange={(e) => setWebsiteURL(e.target.value)}
            placeholder="e.g., brightsmiledental.com"
          />
        </div>
        <div>
          <Label>Practice Type</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PRACTICE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPracticeType(type)}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  practiceType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="address">Location (City, State)</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., Austin, TX"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = (): React.JSX.Element => (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Google Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {googleStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                Google Connected
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Google Search Console (gsc)</span>
                {googleStatus.gsc ? (
                  <Badge variant="default">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Google Analytics (ga)</span>
                {googleStatus.ga ? (
                  <Badge variant="default">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Google Business Profile (gbp)</span>
                {googleStatus.gbp ? (
                  <Badge variant="default">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Globe className="w-12 h-12 text-blue-600 mx-auto" />
            <p className="text-gray-600">
              Connect your Google accounts to enable Search Console, Analytics,
              and Business Profile integration.
            </p>
            <Button
              onClick={handleGoogleConnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Connect with Google
            </Button>
          </div>
        )}

        {cmsResult && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              CMS Detected: {cmsResult.cms}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {cmsResult.setupInstructions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStep3 = (): React.JSX.Element => (
    <Card>
      <CardHeader>
        <CardTitle>Your Competitors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              Finding competitors near you...
            </span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Select up to 5 competitors to track. We found these practices near
              you:
            </p>
            <div className="space-y-2">
              {competitors.map((competitor) => {
                const isSelected = selectedCompetitors.some(
                  (c) => c.domain === competitor.domain
                )
                return (
                  <div
                    key={competitor.domain}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCompetitor(competitor)}
                    />
                    <div>
                      <p className="font-medium text-sm">{competitor.name}</p>
                      <p className="text-xs text-gray-500">
                        {competitor.domain}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom competitor domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={addCustomCompetitor}
                disabled={selectedCompetitors.length >= 5}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {selectedCompetitors.length}/5 competitors selected
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderStep4 = (): React.JSX.Element => (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-600 font-medium mb-4">
          No charge during the pilot program — all features are free.
        </p>
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSelectedPlan(plan.name)}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                selectedPlan === plan.name
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{plan.name}</span>
                <div className="flex items-center gap-2">
                  {plan.recommended && (
                    <Badge variant="default">Recommended</Badge>
                  )}
                  <span className="text-sm text-gray-500 line-through">
                    {plan.price}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    Free
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
              <ul className="mt-2 space-y-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-xs text-gray-500 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderStep5 = (): React.JSX.Element => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-600" />
          Ready to Launch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Practice</span>
            <span className="text-sm font-medium">{practiceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Website</span>
            <span className="text-sm font-medium">{websiteURL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Google</span>
            <span className="text-sm font-medium">
              {googleStatus.connected ? 'Connected' : 'Skipped'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Competitors</span>
            <span className="text-sm font-medium">
              {selectedCompetitors.length} tracked
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Plan</span>
            <span className="text-sm font-medium">
              {selectedPlan} (Free during pilot)
            </span>
          </div>
        </div>

        <Button
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full py-6 text-lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Rocket className="w-5 h-5 mr-2" />
          )}
          Launch My AI Marketing Team
        </Button>
      </CardContent>
    </Card>
  )

  const stepRenderers = [
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
  ]

  const handleNext = (): void => {
    if (currentStep === 1) {
      handleStep1Submit()
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      handleStep3Submit()
    } else if (currentStep === 4) {
      setCurrentStep(5)
    }
  }

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Step {currentStep} of 5: {STEP_TITLES[currentStep - 1]}
          </span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <Progress value={(currentStep / 5) * 100} />
      </div>

      {/* Current Step */}
      {stepRenderers[currentStep - 1]()}

      {/* Navigation */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>

      {/* Skip for step 2 */}
      {currentStep === 2 && !googleStatus.connected && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleGoogleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page Export (with Suspense for useSearchParams) ─────────────

export default function OnboardingStartPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  )
}

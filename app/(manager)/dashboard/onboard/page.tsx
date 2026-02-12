'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Activity, Sparkles, Baby, Scissors, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

const mockCmsResult = {
  cms: 'WordPress',
  confidence: 'high',
  apiAvailable: true,
  setupInstructions: 'Your WordPress REST API is accessible. We just need an application password.',
}

const mockCompetitors = [
  { name: 'Bright Smiles Dental', domain: 'brightsmilesdental.com', address: '123 Main St, Bentonville, AR', distance: '0.8 miles' },
  { name: 'Family Dental Care', domain: 'familydentalbentonville.com', address: '456 Oak Ave, Bentonville, AR', distance: '1.2 miles' },
  { name: 'NWA Orthodontics', domain: 'nwaortho.com', address: '789 Elm Blvd, Rogers, AR', distance: '3.5 miles' },
  { name: 'Pinnacle Dental', domain: 'pinnacledental.com', address: '321 Pine St, Bentonville, AR', distance: '0.5 miles' },
]

const mockGoogleStatus = { gsc: true, ga: true, gbp: false }

const practiceTypes = [
  { id: 'general', label: 'General Dentistry', icon: Activity },
  { id: 'orthodontics', label: 'Orthodontics', icon: Activity },
  { id: 'cosmetic', label: 'Cosmetic Dentistry', icon: Sparkles },
  { id: 'pediatric', label: 'Pediatric Dentistry', icon: Baby },
  { id: 'oral_surgery', label: 'Oral Surgery', icon: Scissors },
  { id: 'other', label: 'Other', icon: Plus },
]

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [practiceName, setPracticeName] = useState('')
  const [website, setWebsite] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [customType, setCustomType] = useState('')
  const [address, setAddress] = useState('')
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(mockCompetitors.slice(0, 3).map(c => c.domain))
  const [showCompetitorInput, setShowCompetitorInput] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [whatNextOpen, setWhatNextOpen] = useState(false)

  const steps = [
    { number: 1, label: 'Your Practice' },
    { number: 2, label: 'Connect Google' },
    { number: 3, label: 'Competitors' },
    { number: 4, label: 'Choose Plan' },
    { number: 5, label: 'Launch!' },
  ]

  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$299/mo',
      features: ['4 blog posts', 'Basic SEO audit', 'GBP optimization', 'Email support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$499/mo',
      features: ['8 blog posts', 'Advanced SEO audit', 'Competitor tracking (5)', 'Social media content', 'Priority support'],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited posts', 'Full-service SEO', 'Unlimited competitors', 'Dedicated manager', 'White-label reporting'],
    },
  ]

  const handleCompetitorToggle = (domain: string) => {
    if (selectedCompetitors.includes(domain)) {
      setSelectedCompetitors(selectedCompetitors.filter(d => d !== domain))
    } else if (selectedCompetitors.length < 5) {
      setSelectedCompetitors([...selectedCompetitors, domain])
    }
  }

  const canProceedStep1 = practiceName && website && selectedType
  const canProceedStep3 = selectedCompetitors.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="sticky top-4 z-10 bg-white/90 backdrop-blur-lg rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep > step.number
                        ? 'bg-green-600 text-white'
                        : currentStep === step.number
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : step.number}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium whitespace-nowrap ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 rounded-full transition-all ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your practice</h2>
                <p className="text-gray-600">We'll use this information to personalize your experience.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Practice Name</label>
                  <input
                    type="text"
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                    placeholder="Smith Family Dental"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.yourpractice.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">Practice Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {practiceTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 border-2 rounded-xl transition-all hover:scale-105 ${
                            selectedType === type.id
                              ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/20'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${selectedType === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                          <p className={`text-sm font-medium ${selectedType === type.id ? 'text-blue-600' : 'text-gray-700'}`}>
                            {type.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                  {selectedType === 'other' && (
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Enter your practice type"
                      className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Practice Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, Bentonville, AR 72712"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => canProceedStep1 && setCurrentStep(2)}
                  disabled={!canProceedStep1}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                    canProceedStep1
                      ? 'bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect your Google accounts</h2>
                <p className="text-gray-600">This helps us track your performance and optimize your presence.</p>
              </div>

              <button className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all flex items-center justify-center space-x-3 group">
                <div className="flex space-x-1">
                  <span className="text-blue-600 text-2xl font-bold">G</span>
                  <span className="text-red-600 text-2xl font-bold">o</span>
                  <span className="text-yellow-600 text-2xl font-bold">o</span>
                  <span className="text-blue-600 text-2xl font-bold">g</span>
                  <span className="text-green-600 text-2xl font-bold">l</span>
                  <span className="text-red-600 text-2xl font-bold">e</span>
                </div>
                <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Connect with Google
                </span>
              </button>

              <div className="space-y-3">
                {[
                  { key: 'gbp', label: 'Google Business Profile', connected: mockGoogleStatus.gbp },
                  { key: 'gsc', label: 'Google Search Console', connected: mockGoogleStatus.gsc },
                  { key: 'ga', label: 'Google Analytics', connected: mockGoogleStatus.ga },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <div className="flex items-center space-x-2">
                      {item.connected ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-600 font-semibold">Connected</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Not connected</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-900 mb-1">
                  <strong>We detected your website runs on {mockCmsResult.cms}</strong>
                </p>
                <p className="text-sm text-gray-600">{mockCmsResult.setupInstructions}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-3 text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Back
                </button>
                <div className="flex items-center space-x-4">
                  <button className="text-gray-600 hover:text-gray-900 text-sm">Skip for now</button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Here are dental practices near you</h2>
                <p className="text-gray-600">Select up to 5 competitors you'd like to track.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {mockCompetitors.map((competitor) => (
                  <div
                    key={competitor.domain}
                    onClick={() => handleCompetitorToggle(competitor.domain)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCompetitors.includes(competitor.domain)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${selectedCompetitors.length >= 5 && !selectedCompetitors.includes(competitor.domain) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{competitor.name}</h3>
                      <input
                        type="checkbox"
                        checked={selectedCompetitors.includes(competitor.domain)}
                        readOnly
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{competitor.domain}</p>
                    <p className="text-xs text-gray-500">{competitor.address}</p>
                    <p className="text-xs text-blue-600 font-medium mt-2">{competitor.distance}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-center text-gray-600">
                {selectedCompetitors.length} of 5 selected
              </p>

              <button
                onClick={() => setShowCompetitorInput(!showCompetitorInput)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 text-blue-600 font-medium transition-all"
              >
                + Add another competitor
              </button>

              {showCompetitorInput && (
                <input
                  type="url"
                  placeholder="competitor-website.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => canProceedStep3 && setCurrentStep(4)}
                  disabled={!canProceedStep3}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                    canProceedStep3
                      ? 'bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose your plan</h2>
                <p className="text-gray-600">Select the plan that fits your practice needs.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all hover:scale-105 ${
                      selectedPlan === plan.id
                        ? 'border-blue-600 bg-blue-50 shadow-xl shadow-blue-500/20'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Recommended
                      </div>
                    )}
                    {selectedPlan === plan.id && (
                      <CheckCircle className="absolute top-4 right-4 w-6 h-6 text-blue-600" />
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-3xl font-bold text-blue-600 mb-4">{plan.price}</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-center text-sm text-gray-600">
                You won't be charged until your 14-day trial ends
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 text-gray-600 hover:text-gray-900 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">You're ready to launch!</h2>
                <p className="text-gray-600">Review your setup and start your AI marketing team.</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 text-left">
                <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Practice:</span>
                    <span className="font-medium text-gray-900">{practiceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Website:</span>
                    <span className="font-medium text-gray-900">{website}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Competitors tracking:</span>
                    <span className="font-medium text-gray-900">{selectedCompetitors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Google accounts:</span>
                    <span className="font-medium text-gray-900">
                      {Object.values(mockGoogleStatus).filter(Boolean).length}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert('Launching your AI team! Redirecting to dashboard...')}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all"
              >
                Launch My AI Marketing Team
              </button>

              <button
                onClick={() => setWhatNextOpen(!whatNextOpen)}
                className="w-full p-4 bg-gray-100 rounded-xl flex items-center justify-between hover:bg-gray-200 transition-colors"
              >
                <span className="font-semibold text-gray-900">What happens next?</span>
                {whatNextOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {whatNextOpen && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 text-left space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700">Your AI team will audit your website in the next 30 minutes</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700">You'll receive your first keyword research report today</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700">We'll draft your first blog post within 48 hours</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 text-gray-600 hover:text-gray-900 font-semibold border border-gray-300 rounded-lg hover:border-gray-400 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

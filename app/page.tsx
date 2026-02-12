'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, BarChart3, FileText, TrendingUp, Sparkles, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI Content Creation',
    description: 'Generate SEO-optimized blog posts, social media content, and website copy automatically.',
  },
  {
    icon: BarChart3,
    title: 'Competitor Analysis',
    description: 'Track and analyze your competition to stay ahead in local search rankings.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Monitor your SEO performance with real-time analytics and actionable insights.',
  },
  {
    icon: Sparkles,
    title: 'Automated Workflows',
    description: 'Set it and forget it with intelligent automation that never sleeps.',
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$299',
    description: 'Perfect for single-location practices',
    features: [
      '4 blog posts per month',
      'Basic SEO audit',
      'Google Business Profile optimization',
      'Email support',
      'Content calendar',
    ],
  },
  {
    name: 'Pro',
    price: '$499',
    description: 'Best for growing practices',
    features: [
      '8 blog posts per month',
      'Advanced SEO audit',
      'Competitor tracking (5 competitors)',
      'Social media content',
      'Priority support',
      'Custom content strategy',
      'Quarterly strategy calls',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For multi-location practices',
    features: [
      'Unlimited blog posts',
      'Full-service SEO management',
      'Unlimited competitor tracking',
      'Dedicated account manager',
      'White-label reporting',
      'Custom integrations',
      'Weekly strategy calls',
    ],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Zintas AI
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/audit" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
                Free Audit
              </Link>
              <Link
                href="/practice/dashboard"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-pulse">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Marketing for Dental Practices</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your AI Marketing Team
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Never Sleeps
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Zintas AI automates your dental practice marketing with intelligent content creation,
              SEO optimization, and competitor analysis. Get more patients without the hassle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/audit"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Free SEO Audit</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to <span className="text-blue-600">Win Online</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform handles all aspects of your digital marketing so you can focus on your patients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your practice. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-600 ml-2">/month</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/practice/dashboard"
                  className={`block w-full py-3 rounded-lg text-center font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of dental practices already using Zintas AI to grow their patient base.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all"
          >
            <span>Get Your Free SEO Audit</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-bold text-white">Zintas AI</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 Zintas AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

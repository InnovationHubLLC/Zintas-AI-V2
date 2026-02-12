'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, BarChart3, FileText, TrendingUp, Sparkles, Zap, Shield, Star, Quote } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ROICalculator } from '@/app/components/roi-calculator'

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

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does AI replace a marketing agency?',
    answer: 'Zintas AI handles the same tasks a marketing agency would — content creation, SEO optimization, competitor monitoring, and performance reporting — but at a fraction of the cost. Our AI works 24/7 and learns your practice\'s unique voice over time.',
  },
  {
    question: 'Will the content sound like my practice?',
    answer: 'Absolutely. During onboarding, we learn your practice\'s tone, specialties, and local market. Every piece of content is tailored to sound authentically like your team wrote it, not a generic AI.',
  },
  {
    question: 'How long until I see results?',
    answer: 'Most practices see measurable improvements in local search visibility within 60-90 days. Content starts indexing within weeks, and our SEO optimizations compound over time for lasting results.',
  },
  {
    question: 'Do I need any technical knowledge?',
    answer: 'Not at all. Zintas is designed for dental professionals, not developers. Our dashboard is intuitive, and our team handles all the technical setup during onboarding.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, all plans are month-to-month with no long-term contracts. You can cancel anytime from your dashboard. We believe our results should keep you, not a contract.',
  },
  {
    question: 'Is my data safe?',
    answer: 'Your data is encrypted at rest and in transit. We never store patient health information, and we comply with all relevant data protection regulations. Your practice data is yours alone.',
  },
]

interface Testimonial {
  name: string
  role: string
  practice: string
  quote: string
  rating: number
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Dr. Sarah Mitchell',
    role: 'Owner',
    practice: 'Bright Smile Family Dentistry, Austin TX',
    quote: 'We went from page 3 to the top 5 on Google Maps in under 4 months. Zintas writes blog posts that actually sound like our team, and our new patient calls have increased by 35%.',
    rating: 5,
  },
  {
    name: 'Dr. James Park',
    role: 'Partner',
    practice: 'Lakewood Dental Group, Denver CO',
    quote: 'I used to spend $4,500/month on a marketing agency that sent me a PDF once a quarter. Zintas costs a fraction of that and I can see exactly what\'s happening in real time.',
    rating: 5,
  },
  {
    name: 'Dr. Maria Santos',
    role: 'Owner',
    practice: 'Gentle Care Pediatric Dentistry, Miami FL',
    quote: 'As a pediatric practice, our content needs to speak to parents in a specific way. Zintas nailed our tone from day one and handles everything so I can focus on my patients.',
    rating: 5,
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
                href="/sign-up"
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

      {/* Social Proof */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg font-semibold text-gray-900">
            500+ dental practices trust Zintas
          </p>
          <p className="text-sm text-gray-500 mt-2">
            From solo practitioners to multi-location groups across the US
          </p>
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
                  href="/sign-up"
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

          {/* ROI Calculator */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Calculate Your ROI
              </h3>
              <p className="text-gray-600">
                See how much additional revenue Zintas AI can generate for your practice.
              </p>
            </div>
            <ROICalculator className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Loved by Dental Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what dentists across the country are saying about Zintas AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                data-testid="testimonial"
                className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
              >
                <Quote className="w-8 h-8 text-blue-200 mb-4" />
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center space-x-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.practice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Zintas AI.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium text-gray-900">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 500+ dental practices already using Zintas AI to grow their patient base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/audit"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all"
            >
              <span>Get Your Free SEO Audit</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-500 text-white rounded-xl text-lg font-semibold hover:bg-blue-400 hover:shadow-2xl hover:scale-105 transition-all"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
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
            &copy; 2026 Zintas AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

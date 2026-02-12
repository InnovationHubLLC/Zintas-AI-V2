'use client'

import { ArrowRight } from 'lucide-react'

export default function OnboardingStartPage() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Zintas AI
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Let&apos;s get your dental practice set up for AI-powered marketing.
      </p>
      <div className="flex items-center justify-center">
        <button className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 transition-all">
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="flex flex-col items-center pt-12 pb-8 px-4">
        <Link href="/" className="flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Zintas AI
          </span>
        </Link>
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  )
}

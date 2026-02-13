'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckCircle, UserPlus, Users, Settings, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import { Toaster } from '@/app/components/toast'
import { ErrorBoundary } from '@/app/components/error-boundary'

const navItems = [
  { href: '/dashboard', label: 'Portfolio', icon: LayoutDashboard },
  { href: '/dashboard/queue', label: 'Approval Queue', icon: CheckCircle, badge: 18 },
  { href: '/dashboard/onboard', label: 'Onboard Client', icon: UserPlus },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Toaster>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-6 pb-4 shadow-2xl">
          {/* Logo */}
          <Link href="/" className="flex h-16 shrink-0 items-center space-x-2 group mt-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-lg">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <span className="text-xl font-bold text-white">Zintas</span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.label}
                          {item.badge && (
                            <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isActive
                                ? 'bg-white text-blue-600'
                                : 'bg-red-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* User Profile */}
              <li className="mt-auto -mx-2">
                <div className="flex items-center gap-x-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-300 bg-gray-800/50">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold">AM</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Account Manager</p>
                    <p className="text-xs text-gray-400">manager@zintas.ai</p>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-6 pb-4">
                <Link href="/" className="flex h-16 shrink-0 items-center space-x-2 mt-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">Z</span>
                  </div>
                  <span className="text-xl font-bold text-white">Zintas</span>
                </Link>

                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navItems.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                              >
                                <Icon className="h-5 w-5 shrink-0" />
                                {item.label}
                                {item.badge && (
                                  <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    isActive
                                      ? 'bg-white text-blue-600'
                                      : 'bg-red-500 text-white'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-lg px-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Zintas Manager</div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
    </Toaster>
  )
}

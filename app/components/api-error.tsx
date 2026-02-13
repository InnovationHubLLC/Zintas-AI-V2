'use client'

import React from 'react'
import Link from 'next/link'
import {
  LogIn,
  ShieldX,
  FileQuestion,
  Clock,
  ServerCrash,
  WifiOff,
  RefreshCw,
} from 'lucide-react'

interface ApiErrorProps {
  status: number | 'network'
  onRetry?: () => void
}

interface ErrorConfig {
  icon: React.ReactNode
  title: string
  message: string
  showRetry: boolean
  showSignIn: boolean
}

function getErrorConfig(status: number | 'network'): ErrorConfig {
  switch (status) {
    case 401:
      return {
        icon: <LogIn className="w-16 h-16 text-blue-500" />,
        title: 'Not signed in',
        message: "You're not signed in. Please sign in to access this page.",
        showRetry: false,
        showSignIn: true,
      }
    case 403:
      return {
        icon: <ShieldX className="w-16 h-16 text-red-500" />,
        title: 'Access denied',
        message: "You don't have permission to access this page.",
        showRetry: false,
        showSignIn: false,
      }
    case 404:
      return {
        icon: <FileQuestion className="w-16 h-16 text-gray-400" />,
        title: 'Page not found',
        message: "The page you're looking for doesn't exist or has been moved.",
        showRetry: false,
        showSignIn: false,
      }
    case 429:
      return {
        icon: <Clock className="w-16 h-16 text-orange-500" />,
        title: 'Too many requests',
        message: 'Too many requests. Please wait a moment and try again.',
        showRetry: true,
        showSignIn: false,
      }
    case 500:
      return {
        icon: <ServerCrash className="w-16 h-16 text-red-500" />,
        title: 'Server error',
        message: 'Something went wrong on our end. Please try again.',
        showRetry: true,
        showSignIn: false,
      }
    case 'network':
      return {
        icon: <WifiOff className="w-16 h-16 text-gray-400" />,
        title: 'Connection failed',
        message: "Can't connect to the server. Check your internet connection and try again.",
        showRetry: true,
        showSignIn: false,
      }
    default:
      return {
        icon: <ServerCrash className="w-16 h-16 text-red-500" />,
        title: 'Error',
        message: 'Something went wrong. Please try again.',
        showRetry: true,
        showSignIn: false,
      }
  }
}

export function ApiError({ status, onRetry }: ApiErrorProps): React.ReactElement {
  const config = getErrorConfig(status)

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="mb-4">{config.icon}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h2>
        <p className="text-gray-600 mb-6">{config.message}</p>

        <div className="flex items-center justify-center space-x-3">
          {config.showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
          {config.showSignIn && (
            <Link
              href="/sign-in"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiError

'use client'

import React, { useState, useCallback, createContext, useContext } from 'react'
import { Check, AlertCircle, Info, X } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

// ── Context ──────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ── Toast Item ───────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-600',
    icon: <Check className="w-5 h-5 text-white" />,
  },
  error: {
    bg: 'bg-red-600',
    icon: <AlertCircle className="w-5 h-5 text-white" />,
  },
  info: {
    bg: 'bg-blue-600',
    icon: <Info className="w-5 h-5 text-white" />,
  },
}

function ToastNotification({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}): React.ReactElement {
  const style = TOAST_STYLES[item.type]

  // Auto-dismiss after duration
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 4000)
    return () => clearTimeout(timer)
  }, [item.id, onDismiss])

  return (
    <div
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg text-white ${style.bg} animate-in slide-in-from-right-4 duration-300`}
    >
      {style.icon}
      <span className="text-sm font-medium flex-1">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Toaster (Provider + Renderer) ────────────────────────────────

export function Toaster({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-2 max-w-sm">
        {toasts.map((item) => (
          <ToastNotification key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Re-export for convenience
export { ToastContext }
export type { ToastType, ToastItem }

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Toast({ message, type = 'success', duration = 3000, onClose }: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles: Record<string, string> = {
    success: 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-lg dark:shadow-emerald-900/50',
    error: 'bg-red-600 dark:bg-red-700 text-white shadow-lg dark:shadow-red-900/50',
    warning: 'bg-yellow-600 dark:bg-yellow-700 text-white shadow-lg dark:shadow-yellow-900/50',
    info: 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg dark:shadow-blue-900/50',
  }

  const icons: Record<string, ReactNode> = {
    success: (<CheckCircleIcon className="h-5 w-5" />),
    error: (<XCircleIcon className="h-5 w-5" />),
    warning: (<ExclamationTriangleIcon className="h-5 w-5" />),
    info: (<InformationCircleIcon className="h-5 w-5" />),
  }

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-300 ease-in-out max-w-md w-full ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className={`flex items-center gap-2 sm:gap-3 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-white/20 dark:border-white/10 ${typeStyles[type]}`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="text-xs sm:text-sm font-medium flex-1 min-w-0">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-auto flex-shrink-0 rounded-md p-1 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`fixed inset-x-0 top-3 sm:top-4 z-50 flex flex-col items-center gap-2 px-3 sm:px-4 ${className}`}>{children}</div>
}

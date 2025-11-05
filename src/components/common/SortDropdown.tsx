import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

export interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
  options: SortOption[]
  className?: string
}

export default function SortDropdown({ value, onChange, options, className = '' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200 font-medium hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm inline-flex items-center gap-2 justify-between min-w-[140px]"
      >
        <span className="flex-1 text-left truncate">{selectedOption?.label || 'Sort by'}</span>
        <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute z-50 sm:mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-1/2 sm:top-auto -translate-y-1/2 sm:translate-y-0 w-[min(calc(100vw-2rem),16rem)] sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 transition-all duration-200 ease-out max-h-[min(60vh,400px)] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between gap-2
                  ${isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <span className="flex-1">{option.label}</span>
                {isSelected && (
                  <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


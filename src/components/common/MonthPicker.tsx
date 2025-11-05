import { useState, useRef, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../../contexts/I18nContext'

interface MonthPickerProps {
  value: string // Format: YYYY-MM
  onChange: (value: string) => void
  className?: string
}

export default function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [displayYear, setDisplayYear] = useState(() => {
    const [year] = value.split('-')
    return parseInt(year)
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const months = [
    { key: 'jan', num: 1 },
    { key: 'feb', num: 2 },
    { key: 'mar', num: 3 },
    { key: 'apr', num: 4 },
    { key: 'may', num: 5 },
    { key: 'jun', num: 6 },
    { key: 'jul', num: 7 },
    { key: 'aug', num: 8 },
    { key: 'sep', num: 9 },
    { key: 'oct', num: 10 },
    { key: 'nov', num: 11 },
    { key: 'dec', num: 12 },
  ]

  const [selectedYear, selectedMonth] = value.split('-').map(Number)

  const getMonthName = (monthNum: number, short: boolean = true) => {
    const date = new Date(2000, monthNum - 1, 1)
    return date.toLocaleString('default', { month: short ? 'short' : 'long' })
  }

  const getDisplayValue = () => {
    const date = new Date(selectedYear, selectedMonth - 1, 1)
    return date.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const handleMonthSelect = (monthNum: number) => {
    const newValue = `${displayYear}-${String(monthNum).padStart(2, '0')}`
    
    // Check if month is in the future
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (displayYear > currentYear || (displayYear === currentYear && monthNum > currentMonth)) {
      return // Don't allow future months
    }
    
    onChange(newValue)
    setIsOpen(false)
  }

  const handleThisMonth = () => {
    const now = new Date()
    const newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    onChange(newValue)
    setDisplayYear(now.getFullYear())
    setIsOpen(false)
  }

  const handleClear = () => {
    const now = new Date()
    const newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    onChange(newValue)
    setDisplayYear(now.getFullYear())
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

  // Update display year when value changes externally
  useEffect(() => {
    const [year] = value.split('-')
    setDisplayYear(parseInt(year))
  }, [value])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto h-10 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 px-2.5 sm:px-3 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium hover:border-emerald-400 dark:hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm inline-flex items-center gap-1.5 sm:gap-2 justify-between min-w-[140px] sm:min-w-[160px]"
      >
        <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{getDisplayValue()}</span>
        <ChevronRightIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown Panel - Compact & Mobile Responsive */}
      {isOpen && (
        <div className="fixed sm:absolute z-50 sm:mt-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-1/2 sm:top-auto -translate-y-1/2 sm:translate-y-0 w-[min(calc(100vw-2rem),17rem)] sm:w-80 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl border border-emerald-200 dark:border-emerald-700/50 p-3 sm:p-4 transition-all duration-200 ease-out">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDisplayYear(displayYear - 1)}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title={t('previous_year')}
              aria-label={t('previous_year')}
            >
              <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {displayYear}
            </span>
            <button
              type="button"
              onClick={() => setDisplayYear(displayYear + 1)}
              disabled={displayYear >= new Date().getFullYear()}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
              title={t('next_year')}
              aria-label={t('next_year')}
            >
              <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

           {/* Month Grid - Compact & Responsive */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {months.map(({ key, num }) => {
              const now = new Date()
              const currentYear = now.getFullYear()
              const currentMonth = now.getMonth() + 1
              const isFuture = displayYear > currentYear || (displayYear === currentYear && num > currentMonth)
              const isSelected = displayYear === selectedYear && num === selectedMonth
              const isCurrent = displayYear === currentYear && num === currentMonth
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleMonthSelect(num)}
                  disabled={isFuture}
                  className={`
                    py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                    ${isFuture
                      ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 ring-offset-1 sm:ring-offset-2 dark:ring-offset-gray-800'
                      : isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-700/50 border border-transparent'
                    }
                  `}
                >
                  {getMonthName(num)}
                </button>
              )
            })}
          </div>

          {/* Action Buttons - Full Width Current Month */}
          <div className="flex flex-col gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleThisMonth}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md sm:rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors shadow-sm"
              aria-label={t('go_to_current_month')}
            >
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('current_month') || 'This month'}</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md sm:rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label={t('clear_selection')}
            >
              <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('clear') || 'Clear'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


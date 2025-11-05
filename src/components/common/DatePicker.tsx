import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { useI18n } from '../../contexts/I18nContext'

interface DatePickerProps {
  value: string // Format: YYYY-MM-DD
  onChange: (value: string) => void
  minDate?: string // Format: YYYY-MM-DD
  maxDate?: string // Format: YYYY-MM-DD
  className?: string
}

export default function DatePicker({ value, onChange, minDate, maxDate, className = '' }: DatePickerProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Parse current value or use today
  const selectedDate = useMemo(() => {
    if (value) {
      return new Date(value + 'T00:00:00')
    }
    return new Date()
  }, [value])

  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())

  const getDisplayValue = () => {
    if (!value) return t('select_date') || 'Select date'
    const date = new Date(value + 'T00:00:00')
    return date.toLocaleDateString('default', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleDateSelect = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // Check if date is within bounds
    if (minDate && dateStr < minDate) return
    if (maxDate && dateStr > maxDate) return
    
    onChange(dateStr)
    setIsOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    onChange(dateStr)
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           viewMonth === today.getMonth() && 
           viewYear === today.getFullYear()
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const selected = new Date(value + 'T00:00:00')
    return day === selected.getDate() && 
           viewMonth === selected.getMonth() && 
           viewYear === selected.getFullYear()
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = []
    const totalDays = daysInMonth(viewYear, viewMonth)
    const firstDay = firstDayOfMonth(viewYear, viewMonth)
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
      days.push(day)
    }
    
    return days
  }, [viewYear, viewMonth])

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

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00')
      setViewYear(date.getFullYear())
      setViewMonth(date.getMonth())
    }
  }, [value])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-sm inline-flex items-center gap-2 justify-between"
      >
        <CalendarIcon className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
        <span className="flex-1 text-left truncate">{getDisplayValue()}</span>
        <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 sm:w-80 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl border border-emerald-200 dark:border-emerald-700/50 p-3 sm:p-4 transition-all duration-200 ease-out"
          style={{
            width: 'min(calc(100vw - 3rem), 17rem)',
            maxWidth: '17rem'
          }}
        >
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const disabled = isDateDisabled(day)
              const selected = isSelected(day)
              const today = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${disabled 
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                      : selected
                      ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-800'
                      : today
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Action Button */}
          <div className="pt-2.5 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleToday}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-600 rounded-md sm:rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t('today') || 'Today'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


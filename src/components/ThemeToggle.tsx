import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, currentTheme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className={`w-10 h-10 rounded-md ${className}`} />
  }

  const getThemeIcon = () => {
    if (currentTheme === 'dark') {
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    }

    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }

  const getTooltipText = () => {
    if (theme === 'light') return 'Switch to dark mode'
    return 'Switch to light mode'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${className}`}
      aria-label={getTooltipText()}
      title={getTooltipText()}
    >
      {getThemeIcon()}
    </button>
  )
}

export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { currentTheme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className={`w-8 h-8 rounded-md ${className}`} />
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${className}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {currentTheme === 'dark' ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  )
}

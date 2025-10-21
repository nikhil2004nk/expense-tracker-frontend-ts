import { useTheme } from '../contexts/ThemeContext'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, currentTheme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return <div className={`w-10 h-10 rounded-md ${className}`} />
  }

  const getThemeIcon = () => {
    if (currentTheme === 'dark') {
      return (<MoonIcon className="h-5 w-5" />)
    }

    return (<SunIcon className="h-5 w-5" />)
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
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
    </button>
  )
}

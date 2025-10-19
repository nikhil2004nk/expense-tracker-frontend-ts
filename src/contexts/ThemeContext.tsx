import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  currentTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    if (theme === 'dark') {
      root.classList.add('dark')
    }
    setMounted(true)
  }, [theme])

  const setTheme = (theme: Theme) => {
    setThemeState(theme)
  }

  const toggleTheme = () => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const getCurrentTheme = () => {
    return theme
  }

  const value: ThemeContextValue = {
    theme,
    currentTheme: getCurrentTheme(),
    setTheme,
    toggleTheme,
    mounted,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

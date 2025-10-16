import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

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
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>('theme', 'light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    if (storedTheme === 'dark') {
      root.classList.add('dark')
    }
    setMounted(true)
  }, [storedTheme])

  const setTheme = (theme: Theme) => {
    setStoredTheme(theme)
  }

  const toggleTheme = () => {
    setStoredTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const getCurrentTheme = () => {
    return storedTheme
  }

  const value: ThemeContextValue = {
    theme: storedTheme,
    currentTheme: getCurrentTheme(),
    setTheme,
    toggleTheme,
    mounted,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

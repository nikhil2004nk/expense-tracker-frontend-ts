import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { formatCurrency, getCurrencySymbol, formatCurrencyWithSymbol } from '../utils/currency'
import { me, isAuthenticated } from '../services/auth'

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'JPY' | 'AED' | string

type CurrencyContextValue = {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  symbol: string
  fc: (amount: number) => string
  fcs: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

const STORAGE_KEY = 'userPreferences'

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.currency || 'INR'
      }
    } catch {}
    return 'INR'
  })

  // Try to hydrate from API on mount
  useEffect(() => {
    let mounted = true
    if (isAuthenticated()) {
      me()
        .then((u) => {
          const apiCur = (u as any)?.preferredCurrency
          if (mounted && apiCur && typeof apiCur === 'string') {
            setCurrency(apiCur)
            // also align local storage cache if present
            try {
              const raw = localStorage.getItem(STORAGE_KEY)
              const next = raw ? { ...JSON.parse(raw), currency: apiCur } : { currency: apiCur }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            } catch {}
          }
        })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [])

  // Listen to storage changes (profile may update it)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed?.currency && typeof parsed.currency === 'string') {
            setCurrency(parsed.currency)
          }
        } catch {}
      }
    }
    const onPrefsUpdated = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed?.currency && typeof parsed.currency === 'string') {
          setCurrency(parsed.currency)
        }
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('userPreferencesUpdated', onPrefsUpdated as any)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('userPreferencesUpdated', onPrefsUpdated as any)
    }
  }, [])

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    symbol: getCurrencySymbol(currency),
    fc: (amount: number) => formatCurrency(amount, currency),
    fcs: (amount: number) => formatCurrencyWithSymbol(amount, currency),
  }), [currency])

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}

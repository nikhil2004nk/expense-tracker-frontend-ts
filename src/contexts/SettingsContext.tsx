import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type AppSettings = {
  notifications: boolean
  emailReports: boolean
  autoBackup: boolean
  language: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  fiscalYearStart: 'april' | 'january' | 'july' | 'october'
  budgetAlertThreshold: number
  defaultTransactionView: 'all' | 'income' | 'expense' | 'month' | 'week'
}

type SettingsContextType = {
  settings: AppSettings
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
}

const defaultSettings: AppSettings = {
  notifications: true,
  emailReports: false,
  autoBackup: true,
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStart: 'april',
  budgetAlertThreshold: 80,
  defaultTransactionView: 'all',
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', defaultSettings)

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

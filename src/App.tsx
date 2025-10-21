import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import ToastProvider from './components/ToastProvider'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { I18nProvider } from './contexts/I18nContext'
import { getUserSettings } from './services/userSettings'
import ScrollToTop from './components/common/ScrollToTop'

function AppInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { setTheme } = useTheme()
  const { setSettings } = useSettings()

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const data = await getUserSettings()
        if (aborted) return
        // Sync theme
        if (data.theme === 'light' || data.theme === 'dark') setTheme(data.theme)
        // Sync settings context
        setSettings((prev) => ({
          ...prev,
          language: data.language,
          dateFormat: data.date_format,
          budgetAlertThreshold: Math.round(data.budget_alert_threshold),
        }))
      } catch {
        // Ignore if unauthenticated or network error
      }
    })()
    return () => {
      aborted = true
    }
  }, [setTheme, setSettings])

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 transition-colors">
      <div className="flex h-screen overflow-hidden">
        {isSidebarOpen && (
          <button
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          />
        )}

        <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex flex-1 flex-col min-w-0">
          <Header onMenuToggle={() => setIsSidebarOpen((v) => !v)} />
          <ScrollToTop />
          <main id="app-scroll" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <SettingsProvider>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </SettingsProvider>
  )
}

export default App

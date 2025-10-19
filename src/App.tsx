import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './contexts/ThemeContext'
import ToastProvider from './components/ToastProvider'
import { SettingsProvider } from './contexts/SettingsContext'
import { I18nProvider } from './contexts/I18nContext'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <SettingsProvider>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
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
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                    <Outlet />
                  </div>
                </main>
              </div>
            </div>
          </div>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </SettingsProvider>
  )
}

export default App

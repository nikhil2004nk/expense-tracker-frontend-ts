import { NavLink, useNavigate } from 'react-router-dom'
import { logout, me as fetchMe } from '../services/auth'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import { Bars3Icon, CurrencyRupeeIcon, ChevronDownIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, MoonIcon, SunIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'
import { useSettings } from '../contexts/SettingsContext'
import type { User } from '../services/auth'

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { currentTheme, mounted } = useTheme()
  const { settings } = useSettings()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const langLabel = useMemo(() => {
    const code = (settings?.language || 'en') as string
    if (code === 'hi') return 'हिं'
    if (code === 'mr') return 'मरा'
    return 'En'
  }, [settings?.language])

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    const loadUserInfo = async () => {
      try {
        const user: User = await fetchMe()
        if (!mounted) return
        setUserName(user.fullName || '')
        setUserEmail(user.email || '')
      } catch (error) {
        console.error('[Header] Failed to load user info:', error)
        // Try loading from localStorage as fallback
        try {
          const raw = localStorage.getItem('userPreferences')
          if (raw && mounted) {
            const prefs = JSON.parse(raw) as { name?: string; email?: string }
            setUserName(prefs?.name || '')
            setUserEmail(prefs?.email || '')
          }
        } catch (parseError) {
          console.error('[Header] Failed to parse user preferences:', parseError)
        }
      }
    }

    loadUserInfo()

    // Listen for user preference updates
    const handlePrefsUpdate = () => {
      try {
        const raw = localStorage.getItem('userPreferences')
        if (!raw) return
        const prefs = JSON.parse(raw) as { name?: string; email?: string }
        setUserName(prefs?.name || '')
        setUserEmail(prefs?.email || '')
      } catch (error) {
        console.error('[Header] Failed to handle preferences update:', error)
      }
    }

    window.addEventListener('userPreferencesUpdated', handlePrefsUpdate)

    return () => {
      mounted = false
      controller.abort()
      window.removeEventListener('userPreferencesUpdated', handlePrefsUpdate)
    }
  }, [])

  const initials = useMemo(() => {
    const first = (userName && userName.trim()) ? userName.trim().split(' ')[0] : (userEmail ? userEmail.split('@')[0] : 'U')
    return first.charAt(0).toUpperCase()
  }, [userName, userEmail])
  const firstName = useMemo(() => {
    if (userName && userName.trim()) return userName.trim().split(' ')[0]
    if (userEmail && userEmail.includes('@')) return userEmail.split('@')[0]
    return t('profile')
  }, [userName, userEmail])
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle sidebar"
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              onClick={onMenuToggle}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <NavLink
              to="/"
              className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <CurrencyRupeeIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:block">{t('app_title')}</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label={t('theme_preference') || 'Theme settings'}
              title={t('theme_preference') || 'Theme settings'}
            >
              {mounted && currentTheme === 'dark' ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center gap-1 justify-center h-8 px-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label={t('language_label') || 'Language settings'}
              title={t('language_label') || 'Language settings'}
            >
              <LanguageIcon className="h-4 w-4" />
              <span className="text-xs font-medium">{langLabel}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className="h-8 w-8 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
                <span className="hidden md:inline max-w-[140px] truncate" title={userName || userEmail}>
                  {firstName}
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">{userName || t('welcome_back')}</p>
                        {userEmail && <p className="truncate">{userEmail}</p>}
                      </div>

                      <NavLink
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        {t('profile')}
                      </NavLink>

                      <NavLink
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        {t('settings')}
                      </NavLink>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                      <button
                        onClick={async () => {
                          setShowUserMenu(false)
                          await logout()
                          navigate('/login')
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import { logout, me as fetchMe, type User } from '../services/auth'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import {
  HomeIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  BanknotesIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const navItems: Array<{ to: string; labelKey: string; icon: ReactNode }> = [
  {
    to: '/dashboard',
    labelKey: 'dashboard',
    icon: (<HomeIcon className="h-5 w-5" />),
  },
  {
    to: '/transactions',
    labelKey: 'transactions',
    icon: (<ArrowsRightLeftIcon className="h-5 w-5" />),
  },
  {
    to: '/categories',
    labelKey: 'categories',
    icon: (<TagIcon className="h-5 w-5" />),
  },
  {
    to: '/budgets',
    labelKey: 'budgets',
    icon: (<BanknotesIcon className="h-5 w-5" />),
  },
  {
    to: '/profile',
    labelKey: 'profile',
    icon: (<UserCircleIcon className="h-5 w-5" />),
  },
  {
    to: '/settings',
    labelKey: 'settings',
    icon: (<Cog6ToothIcon className="h-5 w-5" />),
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    let mounted = true
    
    const loadUserInfo = async () => {
      try {
        const user: User = await fetchMe()
        if (!mounted) return
        setUserName(user.fullName || '')
        setUserEmail(user.email || '')
      } catch (error) {
        console.error('[Sidebar] Failed to load user info:', error)
        // Try loading from localStorage as fallback
        try {
          const raw = localStorage.getItem('userPreferences')
          if (raw && mounted) {
            const prefs = JSON.parse(raw) as { name?: string; email?: string }
            setUserName(prefs?.name || '')
            setUserEmail(prefs?.email || '')
          }
        } catch (parseError) {
          console.error('[Sidebar] Failed to parse user preferences:', parseError)
        }
      }
    }
    
    loadUserInfo()

    const handlePrefsUpdate = () => {
      try {
        const raw = localStorage.getItem('userPreferences')
        if (!raw) return
        const prefs = JSON.parse(raw) as { name?: string; email?: string }
        setUserName(prefs?.name || '')
        setUserEmail(prefs?.email || '')
      } catch (error) {
        console.error('[Sidebar] Failed to handle preferences update:', error)
      }
    }
    
    window.addEventListener('userPreferencesUpdated', handlePrefsUpdate)
    
    return () => {
      mounted = false
      window.removeEventListener('userPreferencesUpdated', handlePrefsUpdate)
    }
  }, [])

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-white">{t('navigation')}</span>
          <button
            className="lg:hidden rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(({ to, labelKey, icon }) => (
            <NavLink key={to} to={to} onClick={onClose} end={to === '/dashboard'}>
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-r-2 border-emerald-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
                  <span>{t(labelKey)}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify.center">
                  <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName || t('user_account')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail || '—'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

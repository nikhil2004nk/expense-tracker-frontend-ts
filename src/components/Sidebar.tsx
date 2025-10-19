import { NavLink, useNavigate } from 'react-router-dom'
import { logout, me as fetchMe } from '../services/auth'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

const navItems: Array<{ to: string; label: string; icon: ReactNode }> = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 4.94 5.03 12.4a.75.75 0 1 1-1.06-1.06l7.5-7.5Z" />
        <path d="M12 5.21 5.47 11.74a.75.75 0 0 0-.22.53V18a2.25 2.25 0 0 0 2.25 2.25H9a.75.75 0 0 0 .75-.75v-3.75A1.5 1.5 0 0 1 11.25 14.25h1.5A1.5 1.5 0 0 1 14.25 15.75V19.5a.75.75 0 0 0 .75.75h1.5A2.25 2.25 0 0 0 18.75 18V12.27a.75.75 0 0 0-.22-.53L12 5.21Z" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3h-15Zm2.25 3.75A.75.75 0 0 1 7.5 6h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm0 3.75a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75ZM7.5 15a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/budgets',
    label: 'Budgets',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5A2.25 2.25 0 0 1 17.25 19.5H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Zm4.5 1.5A.75.75 0 0 0 8.25 9v6a.75.75 0 0 0 1.5 0V9a.75.75 0 0 0-.75-.75Zm6 0A.75.75 0 0 0 14.25 9v6a.75.75 0 0 0 1.5 0V9a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.109.661a7.49 7.49 0 0 0-1.679.972l-.602-.349a1.875 1.875 0 0 0-2.532.657l-.75 1.299a1.875 1.875 0 0 0 .682 2.55l.567.327a7.658 7.658 0 0 0 0 1.944l-.567.327a1.875 1.875 0 0 0-.682 2.55l.75 1.299a1.875 1.875 0 0 0 2.532.657l.602-.349c.52.407 1.08.751 1.679.972l.109.661c.151.904.933 1.567 1.85 1.567h1.5c.917 0 1.699-.663 1.85-1.567l.109-.661c.599-.221 1.159-.565 1.679-.972l.602.349a1.875 1.875 0 0 0 2.532-.657l.75-1.299a1.875 1.875 0 0 0-.682-2.55l-.567-.327a7.658 7.658 0 0 0 0-1.944l.567-.327a1.875 1.875 0 0 0 .682-2.55l-.75-1.299a1.875 1.875 0 0 0-2.532-.657l-.602.349a7.49 7.49 0 0 0-1.679-.972l-.109-.661A1.875 1.875 0 0 0 12.578 2.25h-1.5ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const u = await fetchMe()
        if (!active) return
        setUserName((u as any).fullName || '')
        setUserEmail((u as any).email || '')
      } catch {
        try {
          const raw = localStorage.getItem('userPreferences')
          if (raw) {
            const prefs = JSON.parse(raw)
            setUserName(prefs?.name || '')
            setUserEmail(prefs?.email || '')
          }
        } catch {}
      }
    }
    load()

    const onPrefsUpdated = () => {
      try {
        const raw = localStorage.getItem('userPreferences')
        if (!raw) return
        const prefs = JSON.parse(raw)
        setUserName(prefs?.name || '')
        setUserEmail(prefs?.email || '')
      } catch {}
    }
    window.addEventListener('userPreferencesUpdated', onPrefsUpdated as any)
    return () => { active = false; window.removeEventListener('userPreferencesUpdated', onPrefsUpdated as any) }
  }, [])

  const handleLogout = () => {
    logout()
    onClose()
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
          <span className="font-semibold text-gray-900 dark:text-white">Navigation</span>
          <button
            className="lg:hidden rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(({ to, label, icon }) => (
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
                  <span>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName || 'User Account'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail || '—'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

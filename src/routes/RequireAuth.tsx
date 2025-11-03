import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { me } from '../services/auth'
import { useEffect, useState } from 'react'
import { Loader } from '../components/common'

/**
 * RequireAuth component - protects routes by verifying authentication with backend
 * Shows loading state while checking authentication status
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    const checkAuth = async () => {
      try {
        await me()
        if (mounted) {
          setIsAuthenticated(true)
          setChecking(false)
        }
      } catch (error) {
        console.debug('[RequireAuth] Not authenticated:', error)
        // No need to call logout() - if auth fails, there's no session to clear
        // The backend uses HTTP-only cookies, so we can't clear them from frontend anyway
        if (mounted) {
          setIsAuthenticated(false)
          setChecking(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [])

  // Show loading state while checking authentication
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

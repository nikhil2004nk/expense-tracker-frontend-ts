import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isAuthenticated, me, logout } from '../services/auth'
import { useEffect, useState } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!isAuthenticated()) {
        if (active) {
          setAllowed(false)
          setChecked(true)
        }
        return
      }
      try {
        await me()
        if (active) {
          setAllowed(true)
          setChecked(true)
        }
      } catch {
        logout()
        if (active) {
          setAllowed(false)
          setChecked(true)
        }
      }
    }
    run()
    return () => {
      active = false
    }
  }, [])

  if (!checked) return null
  if (!allowed) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

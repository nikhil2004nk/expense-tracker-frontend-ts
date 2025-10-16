import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isAuthenticated } from '../services/auth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

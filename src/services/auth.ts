/**
 * Authentication service
 */
import { apiRequest, getApiBaseUrl } from './api-client'

const SESSION_KEY = 'auth_session'

export type User = {
  id: string
  email: string
  fullName?: string
  preferredCurrency?: string
}

export async function login({ email, password }: { email: string; password: string }): Promise<User> {
  const data = await apiRequest<User>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  localStorage.setItem(SESSION_KEY, '1')
  return data
}

export async function register({ name, email, password }: { name: string; email: string; password: string }): Promise<User> {
  const data = await apiRequest<User>('/auth/register', {
    method: 'POST',
    body: { fullName: name, email, password },
  })
  return data
}

export async function me(): Promise<User> {
  return apiRequest<User>('/auth/me', { method: 'GET' })
}

export function logout() {
  const API_BASE = getApiBaseUrl()
  fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) === '1'
}

/**
 * Change the current user's password
 */
export async function changePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(
    '/auth/change-password',
    {
      method: 'POST',
      body: { currentPassword, newPassword },
    }
  )
}


export async function deleteMe(): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(
    '/auth/me',
    { method: 'DELETE' }
  )
}

export async function updateMe({ fullName, email, preferredCurrency }: { fullName?: string; email?: string; preferredCurrency?: string }): Promise<User> {
  return apiRequest<User>(
    '/auth/me',
    {
      method: 'PATCH',
      body: { fullName, email, preferredCurrency },
    }
  )
}

/**
 * Authentication service
 * 
 * SECURITY: Authentication state is managed entirely by HTTP-only cookies.
 * We never store session tokens in localStorage to prevent XSS attacks.
 */
import { apiRequest, getApiBaseUrl } from './api-client'

export type User = {
  id: string
  email: string
  fullName?: string
  preferredCurrency?: string
}

/**
 * Login user and establish authenticated session via HTTP-only cookie
 */
export async function login({ email, password }: { email: string; password: string }): Promise<User> {
  const data = await apiRequest<User>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  return data
}

/**
 * Register new user
 */
export async function register({ name, email, password }: { name: string; email: string; password: string }): Promise<User> {
  const data = await apiRequest<User>('/auth/register', {
    method: 'POST',
    body: { fullName: name, email, password },
  })
  return data
}

/**
 * Get current authenticated user info
 * @throws ApiError if not authenticated
 */
export async function me(): Promise<User> {
  return apiRequest<User>('/auth/me', { method: 'GET' })
}

/**
 * Logout user and clear authenticated session
 */
export async function logout(): Promise<void> {
  const API_BASE = getApiBaseUrl()
  try {
    await fetch(`${API_BASE}/auth/logout`, { 
      method: 'POST', 
      credentials: 'include' 
    })
  } catch (error) {
    console.error('[Auth] Logout request failed:', error)
  }
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

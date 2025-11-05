/**
 * Centralized API client with authentication and error handling
 */

// Validate required environment variables
const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL
  
  // In production, require explicit API URL
  if (import.meta.env.MODE === 'production' && !url) {
    throw new Error(
      'VITE_API_URL environment variable is required in production. ' +
      'Please set it in your .env file or deployment configuration.'
    )
  }
  
  // Default to localhost in development
  const baseUrl = url || 'http://localhost:3000'
  
 // console.info('[API Client] Using API base URL:', baseUrl)
  
  return baseUrl
})()

export class ApiError extends Error {
  status?: number
  data?: any

  constructor(message: string, status?: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: any
  headers?: Record<string, string>
  signal?: AbortSignal
}

/**
 * Makes an authenticated API request with JSON body
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Important: send cookies for JWT auth
    signal,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const url = `${API_BASE}${path}`

  // Helper to perform fetch and parse JSON/text safely
  const doRequest = async (targetUrl: string, init: RequestInit) => {
    const response = await fetch(targetUrl, init)
    const text = await response.text()
    let data: any
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }
    return { response, data }
  }

  try {
    // First attempt
    let { response, data } = await doRequest(url, config)

    // If unauthorized, try refreshing tokens once and retry the original request
    // Skip refresh flow for auth endpoints like /auth/login, /auth/register, /auth/me, etc.
    if (response.status === 401 && !path.startsWith('/auth/')) {
      const refreshUrl = `${API_BASE}/auth/refresh`
      const refreshResp = await fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (refreshResp.ok) {
        // Retry original request once after successful refresh
        const retry = await doRequest(url, config)
        response = retry.response
        data = retry.data
      } else {
        // Parse refresh error for better message
        const refreshText = await refreshResp.text()
        let refreshData: any
        try {
          refreshData = refreshText ? JSON.parse(refreshText) : null
        } catch {
          refreshData = { message: refreshText }
        }
        const errorMessage = refreshData?.message || refreshData?.error || 'Session expired'
        throw new ApiError(errorMessage, refreshResp.status, refreshData)
      }
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`
      throw new ApiError(errorMessage, response.status, data)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed'
    )
  }
}

/**
 * Makes an authenticated API request with FormData body (for file uploads)
 */
export async function apiUpload<T = any>(
  path: string,
  formData: FormData,
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  const { signal } = options

  const config: RequestInit = {
    method: 'POST',
    body: formData,
    credentials: 'include',
    signal,
  }

  const url = `${API_BASE}${path}`

  try {
    const response = await fetch(url, config)
    
    const text = await response.text()
    let data: any
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Upload failed with status ${response.status}`
      throw new ApiError(errorMessage, response.status, data)
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Upload failed'
    )
  }
}

/**
 * Returns the base API URL
 */
export function getApiBaseUrl(): string {
  return API_BASE
}


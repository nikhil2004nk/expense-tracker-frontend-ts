/**
 * Centralized API client with authentication and error handling
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
  
  try {
    const response = await fetch(url, config)
    
    // Try to parse response body
    const text = await response.text()
    let data: any
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { message: text }
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


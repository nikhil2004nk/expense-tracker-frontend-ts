const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const SESSION_KEY = 'auth_session'

type HttpOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
}

async function http<T = any>(path: string, options: HttpOptions = {}) {
  const { method = 'GET', body, headers = {} as Record<string, string> } = options
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }
  if (!res.ok) {
    const err = new Error(data?.message || 'Request failed') as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return data as T
}

export async function login({ email, password }: { email: string; password: string }) {
  const data = await http('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  localStorage.setItem(SESSION_KEY, '1')
  return data as { id: string; email: string }
}

export async function register({ name, email, password }: { name: string; email: string; password: string }) {
  const data = await http('/auth/register', {
    method: 'POST',
    body: { fullName: name, email, password },
  })
  return data as { id: string; email: string; fullName: string }
}

export async function me() {
  return http('/auth/me', { method: 'GET' })
}

export function logout() {
  fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === '1'
}

import axios, { AxiosError } from 'axios'
import type { ApiError, ApiValidationError, PaginatedResponse } from '@/types/finance'

// ── Token Management ────────────────────────────────────────

const TOKEN_KEY = 'smeduverse_finance_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (token) {
    return true
  }

  try {
    const persisted = localStorage.getItem('auth-storage')
    if (!persisted) {
      return false
    }

    const parsed = JSON.parse(persisted) as { state?: { token?: unknown } }
    const persistedToken =
      typeof parsed?.state?.token === 'string' ? parsed.state.token : null

    if (!persistedToken) {
      return false
    }

    setToken(persistedToken)
    return true
  } catch {
    return false
  }
}

export function unwrapResource<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = payload.data
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as T
    }
  }

  return payload as T
}

export function unwrapCollection<T>(payload: T[] | { data: T[] }): T[] {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data
  }

  return payload as T[]
}

export function unwrapPaginated<T>(
  payload: PaginatedResponse<T> | { data: PaginatedResponse<T> },
): PaginatedResponse<T> {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    payload.data &&
    typeof payload.data === 'object' &&
    'meta' in payload.data &&
    'links' in payload.data &&
    'data' in payload.data
  ) {
    return payload.data as PaginatedResponse<T>
  }

  return payload as PaginatedResponse<T>
}

// ── Error Class ─────────────────────────────────────────────

export class ApiResponseError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiResponseError'
    this.status = status
    this.errors = errors
  }
}

// ── Axios Instance ──────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/finances',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiValidationError | ApiError>) => {
    if (error.response) {
      const { status, data } = error.response

      // 401 → clear auth state and redirect to login
      if (status === 401) {
        removeToken()
        localStorage.removeItem('auth-storage')
        // Only redirect if not already on auth page
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth'
        }
      }

      const message = data?.message || `Request failed with status ${status}`
      const errors = data && 'errors' in data ? data.errors : undefined
      throw new ApiResponseError(status, message, errors)
    }

    throw new ApiResponseError(0, error.message || 'Network error')
  },
)

// ── HTTP Method Helpers ─────────────────────────────────────

export async function apiGet<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
  const cleanParams: Record<string, string> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value)
      }
    }
  }
  const { data } = await api.get<T>(endpoint, { params: cleanParams })
  return data
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(endpoint, body)
  return data
}

export async function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(endpoint, body)
  return data
}

export async function apiDelete<T = void>(endpoint: string): Promise<T> {
  const { data } = await api.delete<T>(endpoint)
  return data
}

// ── Sanctum CSRF Bootstrap ──────────────────────────────────

export async function ensureCsrfCookie(): Promise<void> {
  const csrfEndpoint = import.meta.env.VITE_CSRF_COOKIE_URL || '/sanctum/csrf-cookie'

  try {
    await axios.get(csrfEndpoint, {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    // Some deployments use pure token auth and don't require this route.
  }
}

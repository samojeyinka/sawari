/* ------------------------------------------------------------------ */
/*  API client for the Sawari backend.                                 */
/*  - authenticates with the httpOnly cookie (credentials: 'include')  */
/*  - unwraps the { success, data, meta } envelope                     */
/*  - throws ApiError carrying the server's message/code on failure    */
/* ------------------------------------------------------------------ */

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1'

export interface ApiErrorBody {
  code?: string
  message?: string
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(message: string, init: { status: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details
  }

  /** True when the session is missing or expired. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: ApiErrorBody
  meta?: unknown
}

export interface ApiUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  emailVerified: boolean
  avatar: string | null
  provider: 'local' | 'github' | 'google'
  createdAt: string
}

export interface RegisterInput {
  firstName: string
  lastName?: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers = new Headers({ Accept: 'application/json' })
  let payload: string | undefined
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the server. Check your connection and try again.', {
      status: 0,
      code: 'network_error',
    })
  }

  if (response.status === 204) return undefined as T

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null

  if (!response.ok || !envelope?.success) {
    throw new ApiError(envelope?.error?.message ?? `Request failed (${response.status}).`, {
      status: response.status,
      code: envelope?.error?.code,
      details: envelope?.error?.details,
    })
  }

  return envelope.data as T
}

export const authApi = {
  register: (input: RegisterInput) =>
    request<ApiUser>('/auth/register', { method: 'POST', body: input }),
  login: (input: LoginInput) => request<ApiUser>('/auth/login', { method: 'POST', body: input }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: (signal?: AbortSignal) => request<ApiUser>('/me', { signal }),
}

/* ------------------------------------------------------------------ */
/*  Last-used sign-in method. Remembered in this browser only, so the    */
/*  login screen can highlight how the learner signed in last time       */
/*  (email, GitHub or Google) and prefill their email.                  */
/* ------------------------------------------------------------------ */

export type AuthMethod = 'email' | 'github' | 'google'

export interface LastAuth {
  method: AuthMethod
  /** Lowercased email, stored only for email sign-ins. */
  email?: string
  at: number
}

const LAST_AUTH_KEY = 'sawari_last_auth'

function isAuthMethod(value: unknown): value is AuthMethod {
  return value === 'email' || value === 'github' || value === 'google'
}

export function loadLastAuth(): LastAuth | null {
  try {
    const raw = localStorage.getItem(LAST_AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LastAuth>
    if (!isAuthMethod(parsed.method)) return null
    return {
      method: parsed.method,
      email: typeof parsed.email === 'string' && parsed.email.includes('@') ? parsed.email : undefined,
      at: typeof parsed.at === 'number' ? parsed.at : 0,
    }
  } catch {
    return null
  }
}

export function saveLastAuth(value: { method: AuthMethod; email?: string }): void {
  try {
    const record: LastAuth = {
      method: value.method,
      email: value.email?.includes('@') ? value.email.toLowerCase().trim() : undefined,
      at: Date.now(),
    }
    localStorage.setItem(LAST_AUTH_KEY, JSON.stringify(record))
  } catch {
    // Ignore quota errors
  }
}

import jwt, { type SignOptions } from 'jsonwebtoken'
import type { CookieOptions } from 'express'
import { env } from './env.js'

/* ------------------------------------------------------------------ */
/*  Auth config: password policy, JWT signing, httpOnly cookie.        */
/*  The token is ONLY ever stored in a secure httpOnly cookie — it is  */
/*  never sent to the frontend as a readable value.                    */
/* ------------------------------------------------------------------ */

export const AUTH_COOKIE = 'sawari_token'

/* --------------------------- password policy ---------------------- */

export interface PasswordRule {
  key: string
  message: string
  test: (password: string) => boolean
}

export const PASSWORD_POLICY: PasswordRule[] = [
  { key: 'minLength', message: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'maxLength', message: 'At most 128 characters', test: (p) => p.length <= 128 },
  { key: 'uppercase', message: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', message: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number', message: 'One number', test: (p) => /[0-9]/.test(p) },
  { key: 'symbol', message: 'One symbol (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function passwordFailures(password: string): PasswordRule[] {
  return PASSWORD_POLICY.filter((rule) => !rule.test(password))
}

/* ------------------------------- JWT ------------------------------ */

export function signAuthToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign({ sub: userId }, env.JWT_SECRET, options)
}

/* ------------------------------ cookie ---------------------------- */

/** Parse an expires string ("7d", "12h", "30m", or raw seconds). */
function durationToMs(expires: string): number {
  const match = /^(\d+)([smhd])?$/.exec(expires.trim())
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  const unit = match[2] ?? 's'
  return Number(match[1]) * (multipliers[unit] ?? 86_400_000)
}

export function authCookieMaxAge(): number {
  return durationToMs(env.JWT_EXPIRES_IN)
}

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: authCookieMaxAge(),
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}

export function clearAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}
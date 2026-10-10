import type { Response } from 'express'
import {
  AUTH_COOKIE,
  authCookieOptions,
  clearAuthCookieOptions,
  signAuthToken,
} from '../config/auth.js'

/** Set the httpOnly session cookie for a user id. */
export function setAuthCookie(res: Response, userId: string): void {
  res.cookie(AUTH_COOKIE, signAuthToken(userId), authCookieOptions())
}

/** Clear the httpOnly session cookie. */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions())
}
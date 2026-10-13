import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE } from '../config/auth.js'
import { env } from '../config/env.js'
import { httpError } from '../lib/AppError.js'
import { User } from '../models/User.js'

interface TokenPayload {
  sub?: string
}

/**
 * Reads the JWT from the httpOnly cookie (never from a header/body),
 * verifies it, rejects soft-deleted accounts, and attaches the
 * authenticated user id to `req.user`.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE]

  if (typeof token !== 'string' || token.length === 0) {
    next(httpError.unauthorized('Authentication required. Please log in.'))
    return
  }

  let subject: string
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('invalid subject')
    }
    subject = payload.sub
  } catch {
    next(httpError.unauthorized('Your session is invalid or expired. Please log in again.'))
    return
  }

  User.findById(subject)
    .select('deletedAt')
    .lean()
    .then((user) => {
      if (!user || user.deletedAt) {
        next(httpError.unauthorized('Your session is invalid or expired. Please log in again.'))
        return
      }
      req.user = { id: subject }
      next()
    })
    .catch(next)
}

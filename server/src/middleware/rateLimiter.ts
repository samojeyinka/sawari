import { rateLimit } from 'express-rate-limit'
import { httpError } from '../lib/AppError.js'

/** Loose rate limit for the whole API (per-IP). */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(httpError.tooMany()),
})

/** Stricter rate limit on credential endpoints to blunt password brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(httpError.tooMany()),
})
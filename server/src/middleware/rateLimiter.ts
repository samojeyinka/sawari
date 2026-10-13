import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import type { Request } from 'express'
import { httpError } from '../lib/AppError.js'

/** Per-user key: authenticated AI routes limit by account, not by shared IP. */
function userKey(req: Request): string {
  const id = (req as Request & { user?: { id?: string } }).user?.id
  return typeof id === 'string' && id.length > 0 ? `user:${id}` : ipKeyGenerator(req.ip ?? '')
}

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

/**
 * Strict per-user limiter for AI generation endpoints (DeepSeek budget).
 * 30 generations/hour/account; monthly caps are enforced separately by
 * `checkAiMonthlyCap` (persistent counter on the user doc).
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: userKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(httpError.tooMany('AI generation limit reached. Try again in an hour.')),
})

/** Tight limiter for the test-email endpoint (anti-spam). */
export const testEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: userKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(httpError.tooMany('Test-email limit reached. Try again later.')),
})
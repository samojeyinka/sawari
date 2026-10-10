import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import passport from 'passport'
import { env } from '../../config/env.js'
import { login, logout, register } from '../../controllers/auth.controller.js'
import { oauthCallback } from '../../controllers/oauth.controller.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { httpError } from '../../lib/AppError.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { loginSchema, registerSchema } from '../../validators/authValidators.js'

const router = Router()

/** 501 when the provider's credentials have not been configured. */
function requireOAuth(provider: 'github' | 'google') {
  return asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
    if (!env[provider === 'github' ? 'GITHUB_CLIENT_ID' : 'GOOGLE_CLIENT_ID']) {
      throw httpError.notImplemented(`${provider} sign-in is not configured on the server.`)
    }
    next()
  })
}

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)

router.get('/github', requireOAuth('github'), passport.authenticate('github'))
router.get(
  '/github/callback',
  requireOAuth('github'),
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}?oauth=failed`,
  }),
  oauthCallback,
)

router.get('/google', requireOAuth('google'), passport.authenticate('google'))
router.get(
  '/google/callback',
  requireOAuth('google'),
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}?oauth=failed`,
  }),
  oauthCallback,
)

export default router
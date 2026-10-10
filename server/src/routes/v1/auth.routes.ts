import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import passport from 'passport'
import { env } from '../../config/env.js'
import { login, logout, register } from '../../controllers/auth.controller.js'
import { oauthCallback } from '../../controllers/oauth.controller.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { loginSchema, registerSchema } from '../../validators/authValidators.js'

const router = Router()

/**
 * Bounces back to the frontend when the provider's credentials are not
 * configured, so the browser never lands on a raw error page.
 */
function requireOAuth(provider: 'github' | 'google') {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!env[provider === 'github' ? 'GITHUB_CLIENT_ID' : 'GOOGLE_CLIENT_ID']) {
      res.redirect(`${env.FRONTEND_URL}?oauth=unavailable&provider=${provider}`)
      return
    }
    next()
  }
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
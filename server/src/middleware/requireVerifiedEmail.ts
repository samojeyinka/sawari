import type { RequestHandler } from 'express'
import { httpError } from '../lib/AppError.js'
import { User } from '../models/User.js'

/**
 * Write-gate for unverified accounts: reads stay open (so the user can
 * verify, read their path, open settings), but every mutation requires a
 * verified email. Verification itself + resend stay reachable because they
 * run before this middleware in auth.routes.
 *
 * OAuth accounts (google/github) skip the gate: each login re-proves control
 * of the provider identity, and GitHub noreply addresses can never receive a
 * code, so gating them would lock those users out permanently.
 */
export const requireVerifiedEmail: RequestHandler = (req, _res, next) => {
  const userId = req.user?.id
  if (!userId) {
    next(httpError.unauthorized('Authentication required. Please log in.'))
    return
  }
  User.findById(userId)
    .select('emailVerified provider')
    .lean()
    .then((user) => {
      if (!user) {
        next(httpError.unauthorized('Account not found.'))
        return
      }
      if (user.provider !== 'local' || user.emailVerified) {
        next()
        return
      }
      next(
        httpError.forbidden(
          'Verify your email address to make changes. Check your inbox for the 6-digit code.',
          'email_unverified',
        ),
      )
    })
    .catch(next)
}

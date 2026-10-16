import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { setAuthCookie } from '../lib/cookies.js'
import { renderTemplate } from '../mail/index.js'
import { User } from '../models/User.js'
import { splitName, type OAuthProfile } from '../passport/types.js'
import { queueEmail } from '../services/notifications.js'

/**
 * Shared callback for passport providers. `req.user` holds the normalized
 * provider profile (sessionless). We find-or-create the local account,
 * write the httpOnly session cookie, then bounce back to the frontend.
 */
export const oauthCallback = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const profile = req.user as unknown as OAuthProfile | undefined
    if (!profile) {
      throw httpError.unauthorized('OAuth sign-in did not complete.')
    }

    // Exact provider match first, then existing account with the same email —
    // but an email match is only safe when the provider asserts the email is
    // verified. Otherwise anyone who controls a provider account with someone
    // else's email could take over the local account. Unverified matches must
    // link from inside a logged-in session instead.
    let user = await User.findOne({ provider: profile.provider, providerId: profile.providerId })
    let emailMatched = false
    if (!user && profile.email) {
      user = await User.findOne({ email: profile.email })
      emailMatched = Boolean(user)
    }
    if (user && emailMatched && !profile.emailVerified) {
      res.redirect(`${env.FRONTEND_URL}/login?oauth=unverified-email&provider=${profile.provider}`)
      return
    }

    if (user?.deletedAt) {
      res.redirect(`${env.FRONTEND_URL}/login?oauth=deleted`)
      return
    }

    let created = false
    if (!user) {
      const { firstName, lastName } = splitName(profile.name)
      user = await User.create({
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email ?? `${profile.providerId}@${profile.provider}.local`,
        firstName,
        lastName,
        avatar: profile.avatar ?? undefined,
        emailVerified: Boolean(profile.emailVerified),
      })
      created = true
    } else {
      // Link the provider to the matched account (exact-provider and
      // verified-email matches only — unverified email matches bail out above).
      if (user.providerId !== profile.providerId) {
        user.provider = profile.provider
        user.providerId = profile.providerId
      }
      if (profile.avatar) user.avatar = profile.avatar
      if (profile.emailVerified && !user.emailVerified) user.emailVerified = true
    }

    user.lastLoggedInAt = new Date()
    await user.save()

    // Welcome a brand new OAuth account the same way a local signup is
    // welcomed. Skipped when the provider gave us no usable address.
    if (created && profile.email) {
      await queueEmail(
        user.email,
        renderTemplate('welcome', {
          firstName: user.firstName,
          appUrl: `${env.FRONTEND_URL}/app/setup`,
        }),
      )
    }

    setAuthCookie(res, user._id.toString())
    res.redirect(`${env.FRONTEND_URL}?oauth=success&provider=${profile.provider}`)
  },
)
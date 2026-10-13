import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { setAuthCookie } from '../lib/cookies.js'
import { User } from '../models/User.js'
import { splitName, type OAuthProfile } from '../passport/types.js'

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

    // Exact provider match first, then existing account with the same email.
    let user = await User.findOne({ provider: profile.provider, providerId: profile.providerId })
    if (!user && profile.email) {
      user = await User.findOne({ email: profile.email })
    }

    if (user?.deletedAt) {
      res.redirect(`${env.FRONTEND_URL}/login?oauth=deleted`)
      return
    }

    if (!user) {
      const { firstName, lastName } = splitName(profile.name)
      user = await User.create({
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email ?? `${profile.providerId}@${profile.provider}.local`,
        firstName,
        lastName,
        avatar: profile.avatar ?? undefined,
        emailVerified: Boolean(profile.email),
      })
    } else {
      // Link the provider to the matched account.
      if (user.providerId !== profile.providerId) {
        user.provider = profile.provider
        user.providerId = profile.providerId
      }
      if (profile.avatar) user.avatar = profile.avatar
      if (profile.email && !user.emailVerified) user.emailVerified = true
    }

    user.lastLoggedInAt = new Date()
    await user.save()

    setAuthCookie(res, user._id.toString())
    res.redirect(`${env.FRONTEND_URL}?oauth=success&provider=${profile.provider}`)
  },
)
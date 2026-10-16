import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import type { Profile } from 'passport-google-oauth20'
import { env } from '../config/env.js'
import type { OAuthProfile } from './types.js'

type VerifyDone = (error?: Error | null | unknown, user?: Express.User | false, info?: object) => void

/** Builds the Google strategy for passport. */
export function createGoogleStrategy(): GoogleStrategy {
  const verify = (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyDone,
  ): void => {
    const email = profile.emails?.[0]?.value?.toLowerCase() ?? null
    // Google only returns the authenticated user's own email; honor an
    // explicit email_verified=false if the upstream payload carries one.
    const jsonVerified = (profile._json as { email_verified?: unknown } | undefined)
      ?.email_verified
    const normalized: OAuthProfile = {
      id: profile.id,
      provider: 'google',
      providerId: profile.id,
      email,
      emailVerified: Boolean(email) && jsonVerified !== false,
      name: profile.displayName || 'Google Learner',
      avatar: profile.photos?.[0]?.value ?? null,
    }
    done(null, normalized as unknown as Express.User)
  }

  return new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `${env.OAUTH_REDIRECT_BASE}/api/v1/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    verify,
  )
}
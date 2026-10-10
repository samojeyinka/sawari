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
    const normalized: OAuthProfile = {
      id: profile.id,
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value?.toLowerCase() ?? null,
      name: profile.displayName || 'Google Learner',
      avatar: profile.photos?.[0]?.value ?? null,
    }
    done(null, normalized)
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
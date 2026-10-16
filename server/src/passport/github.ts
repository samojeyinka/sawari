import { Strategy as GitHubStrategy } from 'passport-github2'
import type { Profile } from 'passport-github2'
import { env } from '../config/env.js'
import type { OAuthProfile } from './types.js'

type VerifyDone = (error?: Error | null | unknown, user?: Express.User | false, info?: object) => void

/** Builds the GitHub strategy for passport. */
export function createGithubStrategy(): GitHubStrategy {
  const verify = (
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyDone,
  ): void => {
    // GitHub does not always expose public emails; fall back to the
    // never-verifiable noreply address so the account still works.
    const email =
      profile.emails?.[0]?.value ??
      (profile.username ? `${profile.username}@users.noreply.github.com` : null)

    const isNoreply = Boolean(email?.toLowerCase().endsWith('@users.noreply.github.com'))
    // passport-github2 surfaces `verified` on email entries when the API
    // provides it. Absent the flag we trust non-noreply public emails (the
    // legacy behaviour); noreply addresses are never verified.
    const upstreamVerified = (profile.emails?.[0] as unknown as { verified?: unknown })
      ?.verified

    const normalized: OAuthProfile = {
      id: profile.id,
      provider: 'github',
      providerId: profile.id,
      email: email ? email.toLowerCase() : null,
      emailVerified: Boolean(email) && !isNoreply && upstreamVerified !== false,
      name: profile.displayName || profile.username || 'GitHub Learner',
      avatar: profile.photos?.[0]?.value ?? null,
    }
    done(null, normalized as unknown as Express.User)
  }

  return new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
      callbackURL: `${env.OAUTH_REDIRECT_BASE}/api/v1/auth/github/callback`,
      scope: ['user:email'],
    },
    verify,
  )
}
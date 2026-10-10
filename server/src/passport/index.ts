import passport from 'passport'
import { env } from '../config/env.js'
import { createGithubStrategy } from './github.js'
import { createGoogleStrategy } from './google.js'

/**
 * Registers OAuth strategies (sessionless — no serializeUser/deserializeUser.
 * The verified profile object is placed directly on `req.user`).
 * Strategies are skipped entirely when their credentials are not configured.
 */
export function registerPassport(): void {
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use('github', createGithubStrategy())
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use('google', createGoogleStrategy())
  }
}

export { passport }
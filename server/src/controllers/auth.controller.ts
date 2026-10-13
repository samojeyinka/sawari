import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { env } from '../config/env.js'
import { hashPassword, toSafeUser, User } from '../models/User.js'
import { setAuthCookie, clearAuthCookie } from '../lib/cookies.js'
import { hashSecret, safeEqualHex } from '../lib/secrets.js'
import { renderTemplate } from '../mail/index.js'
import { createNotification, queueEmail } from '../services/notifications.js'
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../validators/authValidators.js'

/** Reset tokens are stored as a SHA-256 hash so a DB leak cannot be replayed. */
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/* ------------------------------- register ------------------------- */

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as RegisterInput

    const existing = await User.findOne({ email: body.email }).select('deletedAt').lean()
    if (existing) {
      if (existing.deletedAt) {
        throw httpError.conflict(
          'This email belongs to a deleted account. Restore it within 30 days of deletion.',
          'account_deleted',
        )
      }
      throw httpError.conflict('An account with this email already exists.')
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString()
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

    const passwordHash = await hashPassword(body.password)
    const user = await User.create({
      firstName: body.firstName,
      lastName: body.lastName?.trim() ? body.lastName : undefined,
      email: body.email,
      emailVerified: false,
      emailVerificationCode: hashSecret(verificationCode),
      emailVerificationExpiresAt: verificationExpiresAt,
      passwordHash,
      provider: 'local',
      lastLoggedInAt: new Date(),
    })

    setAuthCookie(res, user._id.toString())

    if (env.NODE_ENV !== 'production') {
      console.debug(`[auth] verification code for ${user.email}: ${verificationCode}`)
    }

    // Dispatch 6-digit verification email
    await createNotification({
      userId: user._id.toString(),
      kind: 'account',
      title: 'Verify your email address',
      body: `Hi ${user.firstName}, your 6-digit verification code is ${verificationCode}. It expires in 15 minutes.`,
      email: {
        to: user.email,
        rendered: renderTemplate('email-verification', {
          firstName: user.firstName,
          code: verificationCode,
          expiresMinutes: 15,
        }),
      },
    })

    res.created(toSafeUser(user))
  },
)

/* ---------------------------- verify email ------------------------ */

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as VerifyEmailInput
    const user = await User.findById(req.user!.id).select('+emailVerificationCode +emailVerificationExpiresAt')
    if (!user) throw httpError.notFound('User not found.')

    if (user.emailVerified) {
      return res.ok(toSafeUser(user), { message: 'Email is already verified.' })
    }

    const codeMatches =
      safeEqualHex(user.emailVerificationCode, hashSecret(body.code.trim())) ||
      // Legacy rows stored the raw code: accept once, then migrate to a hash.
      (user.emailVerificationCode !== undefined &&
        /^\d{6}$/.test(user.emailVerificationCode) &&
        user.emailVerificationCode === body.code.trim())
    if (!codeMatches) {
      throw httpError.badRequest('Invalid verification code. Please check your email and try again.')
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      throw httpError.badRequest('Verification code has expired. Please request a new code.')
    }

    user.emailVerified = true
    user.emailVerificationCode = undefined
    user.emailVerificationExpiresAt = undefined
    await user.save()

    const setupUrl = `${env.FRONTEND_URL}/app/setup`
    await createNotification({
      userId: user._id.toString(),
      kind: 'account',
      title: 'Email verified — Welcome to Sawari',
      body: `Your email is verified! Build your personalized learning path whenever you are ready.`,
      link: setupUrl,
      email: {
        to: user.email,
        rendered: renderTemplate('welcome', {
          firstName: user.firstName,
          appUrl: setupUrl,
        }),
      },
    })

    res.ok(toSafeUser(user), { message: 'Email successfully verified!' })
  },
)

/* ----------------------- resend verification code ----------------- */

export const resendVerificationCode = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await User.findById(req.user!.id).select('+emailVerificationCode +emailVerificationExpiresAt')
    if (!user) throw httpError.notFound('User not found.')

    if (user.emailVerified) {
      return res.ok({ alreadyVerified: true, message: 'Email is already verified.' })
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString()
    user.emailVerificationCode = hashSecret(verificationCode)
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    if (env.NODE_ENV !== 'production') {
      console.debug(`[auth] verification code for ${user.email}: ${verificationCode}`)
    }

    await createNotification({
      userId: user._id.toString(),
      kind: 'account',
      title: 'New verification code',
      body: `Your new 6-digit verification code is ${verificationCode}. It expires in 15 minutes.`,
      email: {
        to: user.email,
        rendered: renderTemplate('email-verification', {
          firstName: user.firstName,
          code: verificationCode,
          expiresMinutes: 15,
        }),
      },
    })

    res.ok({ message: 'A new 6-digit verification code has been sent to your email.' })
  },
)

/* --------------------------- forgot password ---------------------- */

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as ForgotPasswordInput
    const user = await User.findOne({ email: body.email })

    // Always answer the same way so the endpoint cannot be used to discover
    // which emails have accounts.
    if (user && user.provider === 'local') {
      const rawToken = crypto.randomBytes(32).toString('hex')
      user.passwordResetToken = hashResetToken(rawToken)
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await user.save()

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`

      await queueEmail(
        user.email,
        renderTemplate('password-reset', {
          firstName: user.firstName,
          resetUrl,
          expiresMinutes: 60,
        }),
      )
    }

    res.ok({ message: 'If an account exists for that email, a reset link is on its way.' })
  },
)

/* ---------------------------- reset password ---------------------- */

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as ResetPasswordInput
    const hashed = hashResetToken(body.token)

    const user = await User.findOne({ passwordResetToken: hashed }).select(
      '+passwordResetToken +passwordResetExpiresAt',
    )
    if (!user || user.passwordResetToken !== hashed) {
      throw httpError.badRequest('This reset link is invalid or has expired. Please request a new one.')
    }
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw httpError.badRequest('This reset link has expired. Please request a new one.')
    }

    user.passwordHash = await hashPassword(body.password)
    user.passwordResetToken = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()

    await queueEmail(
      user.email,
      renderTemplate('password-changed', { firstName: user.firstName }),
    )

    res.ok({ message: 'Your password has been reset. You can sign in now.' })
  },
)

/* --------------------------- change password ---------------------- */

export const changePassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as ChangePasswordInput

    const user = await User.findById(req.user!.id).select('+passwordHash')
    if (!user) throw httpError.unauthorized('Account not found.')

    if (!user.passwordHash || !(await user.comparePassword(body.currentPassword))) {
      throw httpError.badRequest('Your current password is incorrect.')
    }
    if (await user.comparePassword(body.newPassword)) {
      throw httpError.badRequest('Your new password must be different from your current password.')
    }

    user.passwordHash = await hashPassword(body.newPassword)
    await user.save()

    await queueEmail(
      user.email,
      renderTemplate('password-changed', { firstName: user.firstName }),
    )

    res.ok({ message: 'Your password has been updated.' })
  },
)

/* -------------------------------- login --------------------------- */

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body as LoginInput

  const user = await User.findByCredentials(body.email)
  if (!user || !(await user.comparePassword(body.password))) {
    throw httpError.unauthorized('Invalid email or password.')
  }

  if (user.deletedAt) {
    throw httpError.forbidden(
      'This account was deleted. Restore it within 30 days of deletion via the link we emailed you.',
      'account_deleted',
    )
  }

  user.lastLoggedInAt = new Date()
  await user.save()

  setAuthCookie(res, user._id.toString())
  res.ok(toSafeUser(user))
})

/* ------------------------------- logout --------------------------- */

export const logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  clearAuthCookie(res)
  res.noContent()
})
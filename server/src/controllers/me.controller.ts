import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { env } from '../config/env.js'
import { hashSecret, safeEqualHex } from '../lib/secrets.js'
import { toSafeUser, User } from '../models/User.js'
import { renderTemplate } from '../mail/index.js'
import { queueEmail } from '../services/notifications.js'
import { clearAuthCookie } from '../lib/cookies.js'
import type {
  DeleteConfirmInput,
  EmailChangeConfirmInput,
  EmailChangeRequestInput,
  RestoreAccountInput,
  RestoreRequestInput,
  UpdateMeInput,
} from '../validators/authValidators.js'
 
/* ------------------------------ current user ---------------------- */

export const me = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user!.id).select('+passwordHash')
  if (!user) {
    throw httpError.unauthorized('Account not found.')
  }
  res.ok(toSafeUser(user, { hasPassword: Boolean(user.passwordHash) }))
})

/* ------------------------------ update profile -------------------- */

export const updateMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body as UpdateMeInput

  const user = await User.findById(req.user!.id)
  if (!user) {
    throw httpError.unauthorized('Account not found.')
  }

  if (body.firstName !== undefined) user.firstName = body.firstName
  if (body.lastName !== undefined) user.lastName = body.lastName ?? undefined
  if (body.activePathId !== undefined) user.activePathId = body.activePathId

  await user.save()
  res.ok(toSafeUser(user))
})

/* ------------------------- delete (soft) -------------------------- */

const DELETE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // confirm link lives 24h
const RESTORE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // restorable for 30 days
const EMAIL_CHANGE_TTL_MS = 15 * 60 * 1000 // code lives 15 mins

function newOpaqueToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  return { raw, hash: hashSecret(raw) }
}

/** Step 1: authenticated request — emails a confirmation link, deletes nothing. */
export const requestAccountDeletion = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')
    if (user.deletedAt) {
      throw httpError.badRequest('This account is already deleted.')
    }

    const { raw, hash } = newOpaqueToken()
    user.deleteTokenHash = hash
    user.deleteTokenExpiresAt = new Date(Date.now() + DELETE_TOKEN_TTL_MS)
    await user.save()

    await queueEmail(
      user.email,
      renderTemplate('account-delete-confirm', {
        firstName: user.firstName,
        confirmUrl: `${env.FRONTEND_URL}/delete-account?token=${raw}`,
        expiresHours: 24,
      }),
    )

    res.ok({ message: 'Check your email for the confirmation link.' })
  },
)

/** Step 2: public confirmation link — soft-deletes and emails the restore link. */
export const confirmAccountDeletion = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as DeleteConfirmInput
    const hashed = hashSecret(body.token)

    const user = await User.findOne({ deleteTokenHash: hashed }).select(
      '+deleteTokenHash +deleteTokenExpiresAt',
    )
    if (!user || !safeEqualHex(user.deleteTokenHash, hashed)) {
      throw httpError.badRequest('This confirmation link is invalid or has expired.')
    }
    if (!user.deleteTokenExpiresAt || user.deleteTokenExpiresAt < new Date()) {
      throw httpError.badRequest('This confirmation link has expired. Request a new one.')
    }
    if (user.deletedAt) {
      throw httpError.badRequest('This account is already deleted.')
    }

    const restore = newOpaqueToken()
    user.deletedAt = new Date()
    user.deleteTokenHash = null
    user.deleteTokenExpiresAt = null
    user.restoreTokenHash = restore.hash
    user.restoreTokenExpiresAt = new Date(Date.now() + RESTORE_WINDOW_MS)
    await user.save()

    await queueEmail(
      user.email,
      renderTemplate('account-deleted', {
        firstName: user.firstName,
        restoreUrl: `${env.FRONTEND_URL}/restore-account?token=${restore.raw}`,
        restoreDays: 30,
      }),
    )

    // Drop any session cookie travelling with the confirmation click.
    clearAuthCookie(res)
    res.ok({ message: 'Your account has been deleted. You can restore it within 30 days.' })
  },
)

/* ------------------------------ restore --------------------------- */

function restoreWindowOpen(user: { deletedAt?: Date | null }): boolean {
  if (!user.deletedAt) return false
  return user.deletedAt.getTime() + RESTORE_WINDOW_MS > Date.now()
}

/** Public restore link — brings a soft-deleted account back with all its data. */
export const restoreAccount = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as RestoreAccountInput
    const hashed = hashSecret(body.token)

    const user = await User.findOne({ restoreTokenHash: hashed }).select(
      '+restoreTokenHash +restoreTokenExpiresAt',
    )
    if (!user || !safeEqualHex(user.restoreTokenHash, hashed)) {
      throw httpError.badRequest('This restore link is invalid or has expired.')
    }
    if (
      !user.restoreTokenExpiresAt ||
      user.restoreTokenExpiresAt < new Date() ||
      !restoreWindowOpen(user)
    ) {
      throw httpError.badRequest('The 30-day restore window has passed.', 'restore_expired')
    }

    user.deletedAt = null
    user.restoreTokenHash = null
    user.restoreTokenExpiresAt = null
    await user.save()

    res.ok(toSafeUser(user), { message: 'Welcome back — your account is restored.' })
  },
)

/** Public: re-emails a fresh restore link to a soft-deleted account. */
export const requestRestoreLink = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as RestoreRequestInput
    const user = await User.findOne({ email: body.email })

    // Same answer either way: the endpoint must not reveal which emails exist
    // or which of them are deleted.
    if (user?.deletedAt && restoreWindowOpen(user)) {
      const restore = newOpaqueToken()
      user.restoreTokenHash = restore.hash
      user.restoreTokenExpiresAt = new Date(Date.now() + RESTORE_WINDOW_MS)
      await user.save()

      await queueEmail(
        user.email,
        renderTemplate('account-deleted', {
          firstName: user.firstName,
          restoreUrl: `${env.FRONTEND_URL}/restore-account?token=${restore.raw}`,
          restoreDays: 30,
        }),
      )
    }

    res.ok({ message: 'If that account can be restored, a link is on its way.' })
  },
)

/* ---------------------------- email change ------------------------ */

/** Step 1: authenticated request — sends a 6-digit code to the NEW address. */
export const requestEmailChange = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as EmailChangeRequestInput
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')

    if (body.email === user.email) {
      throw httpError.badRequest('That is already your account email.')
    }
    const taken = await User.exists({ email: body.email, _id: { $ne: user._id } })
    if (taken) {
      throw httpError.conflict('An account with this email already exists.')
    }

    const code = crypto.randomInt(100000, 1000000).toString()
    user.pendingEmail = body.email
    user.emailChangeCodeHash = hashSecret(code)
    user.emailChangeExpiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS)
    await user.save()

    await queueEmail(
      body.email,
      renderTemplate('email-change-code', {
        firstName: user.firstName,
        code,
        newEmail: body.email,
        expiresMinutes: 15,
      }),
    )

    res.ok({ message: 'Check your new inbox for the confirmation code.', pendingEmail: body.email })
  },
)

/** Step 2: confirm the code — swaps the email and marks it verified. */
export const confirmEmailChange = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as EmailChangeConfirmInput
    const user = await User.findById(req.user!.id).select(
      '+emailChangeCodeHash +emailChangeExpiresAt',
    )
    if (!user) throw httpError.unauthorized('Account not found.')
    if (!user.pendingEmail || !user.emailChangeCodeHash) {
      throw httpError.badRequest('No email change is pending. Request a new code.')
    }
    if (!safeEqualHex(user.emailChangeCodeHash, hashSecret(body.code.trim()))) {
      throw httpError.badRequest('Invalid code. Please check your new inbox and try again.')
    }
    if (!user.emailChangeExpiresAt || user.emailChangeExpiresAt < new Date()) {
      throw httpError.badRequest('That code has expired. Request a new one.')
    }

    const taken = await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })
    if (taken) {
      throw httpError.conflict('An account with this email already exists.')
    }

    user.email = user.pendingEmail
    user.emailVerified = true
    user.pendingEmail = null
    user.emailChangeCodeHash = null
    user.emailChangeExpiresAt = null
    await user.save()

    res.ok(toSafeUser(user), { message: 'Your account email is updated.' })
  },
)
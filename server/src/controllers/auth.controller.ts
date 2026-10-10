import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { hashPassword, toSafeUser, User } from '../models/User.js'
import { setAuthCookie, clearAuthCookie } from '../lib/cookies.js'
import type { LoginInput, RegisterInput } from '../validators/authValidators.js'

/* ------------------------------- register ------------------------- */

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as RegisterInput

    const exists = await User.exists({ email: body.email })
    if (exists) {
      throw httpError.conflict('An account with this email already exists.')
    }

    const passwordHash = await hashPassword(body.password)
    const user = await User.create({
      firstName: body.firstName,
      lastName: body.lastName?.trim() ? body.lastName : undefined,
      email: body.email,
      passwordHash,
      provider: 'local',
      lastLoggedInAt: new Date(),
    })

    setAuthCookie(res, user._id.toString())
    res.created(toSafeUser(user))
  },
)

/* -------------------------------- login --------------------------- */

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body as LoginInput

  const user = await User.findByCredentials(body.email)
  if (!user || !(await user.comparePassword(body.password))) {
    throw httpError.unauthorized('Invalid email or password.')
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
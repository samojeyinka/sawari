import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { toSafeUser, User } from '../models/User.js'
import type { UpdateMeInput } from '../validators/authValidators.js'
 
/* ------------------------------ current user ---------------------- */

export const me = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user!.id).select('-passwordHash')
  if (!user) {
    throw httpError.unauthorized('Account not found.')
  }
  res.ok(toSafeUser(user))
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
import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { toReminderPreferences, User } from '../models/User.js'
import type { UpdateSettingsInput } from '../validators/settingsValidators.js'

/* ------------------------------- read ----------------------------- */

export const getSettings = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user!.id)
  if (!user) {
    throw httpError.unauthorized('Account not found.')
  }
  res.ok(toReminderPreferences(user))
})

/* ------------------------------ update ---------------------------- */

export const updateSettings = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as UpdateSettingsInput

    const user = await User.findById(req.user!.id)
    if (!user) {
      throw httpError.unauthorized('Account not found.')
    }

    user.preferences = { ...toReminderPreferences(user), ...body }
    await user.save()

    res.ok(toReminderPreferences(user))
  },
)

import type { RequestHandler } from 'express'
import { httpError } from '../lib/AppError.js'
import { User } from '../models/User.js'

/**
 * Persistent monthly cap for AI generation (DeepSeek budget guard).
 * Counts every AI-generating request per account and resets the window on
 * first use of a new calendar month. Runs after `authenticate` (needs
 * `req.user.id`) and beside the hourly `aiLimiter`.
 */
export const AI_MONTHLY_LIMIT = 200

export const checkAiMonthlyCap: RequestHandler = (req, _res, next) => {
  const userId = req.user?.id
  if (!userId) {
    next(httpError.unauthorized('Authentication required. Please log in.'))
    return
  }
  User.findById(userId)
    .select('aiMonthlyCount aiMonthlyResetAt')
    .then(async (user) => {
      if (!user) {
        next(httpError.unauthorized('Account not found.'))
        return
      }
      const now = new Date()
      const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      if (!user.aiMonthlyResetAt || user.aiMonthlyResetAt < windowStart) {
        user.aiMonthlyCount = 0
        user.aiMonthlyResetAt = now
      }
      if ((user.aiMonthlyCount ?? 0) >= AI_MONTHLY_LIMIT) {
        next(
          httpError.tooMany(
            'Monthly AI generation budget reached. It resets on the 1st of next month.',
          ),
        )
        return
      }
      user.aiMonthlyCount = (user.aiMonthlyCount ?? 0) + 1
      await user.save()
      next()
    })
    .catch(next)
}

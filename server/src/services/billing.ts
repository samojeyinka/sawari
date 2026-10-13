import { env } from '../config/env.js'
import { LearningPath } from '../models/LearningPath.js'
import { User, type UserDocument } from '../models/User.js'
import { httpError } from '../lib/AppError.js'

/* ------------------------------------------------------------------ */
/*  Billing rules, one place:                                          */
/*  - free: FREE_PATH_LIMIT paths (default 1)                          */
/*  - pro (one-time PayPal) or own verified API key: PRO_PATH_LIMIT     */
/* ------------------------------------------------------------------ */

export interface BillingStatus {
  plan: 'free' | 'pro'
  hasOwnKey: boolean
  aiKeyLast4: string | null
  pathLimit: number
  pathsUsed: number
  canCreateMore: boolean
  proPaidAt: string | null
}

export function pathLimitFor(user: Pick<UserDocument, 'plan'> & { aiKeySealed?: unknown }): number {
  if (user.plan === 'pro') return env.PRO_PATH_LIMIT
  if (user.aiKeySealed) return env.PRO_PATH_LIMIT
  return env.FREE_PATH_LIMIT
}

export async function billingStatusFor(userId: string): Promise<BillingStatus> {
  const user = await User.findById(userId).select('+aiKeySealed')
  if (!user) throw httpError.unauthorized('Account not found.')
  const [pathsUsed, limit] = await Promise.all([
    LearningPath.countDocuments({ userId: user._id }),
    Promise.resolve(pathLimitFor(user)),
  ])
  return {
    plan: user.plan,
    hasOwnKey: Boolean(user.aiKeySealed),
    aiKeyLast4: user.aiKeyLast4 ?? null,
    pathLimit: limit,
    pathsUsed,
    canCreateMore: pathsUsed < limit,
    proPaidAt: user.proPaidAt ? user.proPaidAt.toISOString() : null,
  }
}

/** Throws 403 when the user already holds their full quota of paths. */
export async function assertCanCreatePath(userId: string): Promise<void> {
  const status = await billingStatusFor(userId)
  if (!status.canCreateMore) {
    throw httpError.forbidden(
      status.plan === 'free' && !status.hasOwnKey
        ? `Free accounts hold ${status.pathLimit} learning path. Add your own DeepSeek key or upgrade to Pro for up to ${env.PRO_PATH_LIMIT}.`
        : `You already hold ${status.pathsUsed} of ${status.pathLimit} learning paths. Delete one to build another.`,
      'path_limit_reached',
    )
  }
}

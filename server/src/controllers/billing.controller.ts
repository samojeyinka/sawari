import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { env, isPaypalConfigured } from '../config/env.js'
import { User } from '../models/User.js'
import { fingerprintSecret, sealSecret } from '../lib/secrets.js'
import { billingStatusFor } from '../services/billing.js'
import { captureAndVerifyProOrder, createProOrder, PaypalError } from '../services/paypal.js'
import { UserKeyError, verifyDeepSeekKey } from '../services/userKey.js'
import type { CaptureOrderInput, SaveAiKeyInput } from '../validators/billingValidators.js'

function toHttpError(error: unknown): unknown {
  if (error instanceof PaypalError) {
    if (error.status === 400) return httpError.badRequest(error.message)
    if (error.status === 403) return httpError.forbidden(error.message)
    return httpError.serviceUnavailable(error.message)
  }
  if (error instanceof UserKeyError) {
    return error.status === 502
      ? httpError.badGateway(error.message)
      : httpError.badRequest(error.message)
  }
  return error
}

/* ------------------------------ status ---------------------------- */

export const getBillingStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const status = await billingStatusFor(req.user!.id)
    res.ok({
      ...status,
      proPriceUsd: env.PRO_PRICE_USD,
      paypalConfigured: isPaypalConfigured,
      paypalMode: env.PAYPAL_MODE,
    })
  },
)

/* --------------------------- paypal orders ------------------------ */

export const createPaypalOrder = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    if (!isPaypalConfigured) {
      throw httpError.serviceUnavailable('PayPal checkout is not configured.')
    }
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')
    if (user.plan === 'pro') {
      return res.ok({ alreadyPro: true, message: 'You already have Pro.' })
    }
    try {
      const { orderId } = await createProOrder(user._id.toString())
      res.ok({ orderId, amount: env.PRO_PRICE_USD, currency: 'USD', mode: env.PAYPAL_MODE })
    } catch (error) {
      throw toHttpError(error)
    }
  },
)

export const capturePaypalOrder = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    if (!isPaypalConfigured) {
      throw httpError.serviceUnavailable('PayPal checkout is not configured.')
    }
    const body = req.body as CaptureOrderInput
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')

    // Idempotent: paying twice never double-grants.
    if (user.plan === 'pro') {
      return res.ok({ alreadyPro: true, ...(await billingStatusFor(user._id.toString())) })
    }

    try {
      const verified = await captureAndVerifyProOrder(body.orderId, user._id.toString())

      // Same capture replayed twice: treat as success without re-granting.
      if (user.paypalCaptureId && user.paypalCaptureId === verified.captureId) {
        return res.ok({ replayed: true, ...(await billingStatusFor(user._id.toString())) })
      }

      user.plan = 'pro'
      user.proPaidAt = new Date()
      user.paypalOrderId = verified.orderId
      user.paypalCaptureId = verified.captureId
      await user.save()

      res.ok({ ...(await billingStatusFor(user._id.toString())), message: 'Welcome to Pro.' })
    } catch (error) {
      throw toHttpError(error)
    }
  },
)

/* ---------------------------- own AI key -------------------------- */

export const saveAiKey = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as SaveAiKeyInput
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')

    try {
      await verifyDeepSeekKey(body.key)
    } catch (error) {
      throw toHttpError(error)
    }

    user.aiKeySealed = sealSecret(body.key.trim())
    user.aiKeyLast4 = fingerprintSecret(body.key)
    user.aiKeyVerifiedAt = new Date()
    await user.save()

    res.ok({ ...(await billingStatusFor(user._id.toString())), message: 'Key verified and saved.' })
  },
)

export const removeAiKey = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await User.findById(req.user!.id)
    if (!user) throw httpError.unauthorized('Account not found.')

    user.aiKeySealed = null
    user.aiKeyLast4 = null
    user.aiKeyVerifiedAt = null
    await user.save()

    res.ok({ ...(await billingStatusFor(user._id.toString())), message: 'API key removed.' })
  },
)

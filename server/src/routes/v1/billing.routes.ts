import { Router } from 'express'
import {
  capturePaypalOrder,
  createPaypalOrder,
  getBillingStatus,
  removeAiKey,
  saveAiKey,
} from '../../controllers/billing.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { captureOrderSchema, saveAiKeySchema } from '../../validators/billingValidators.js'

const router = Router()

router.use(authenticate)

router.get('/status', getBillingStatus)
router.post('/paypal/orders', authLimiter, createPaypalOrder)
router.post('/paypal/capture', authLimiter, validate(captureOrderSchema), capturePaypalOrder)
router.post('/ai-key', authLimiter, validate(saveAiKeySchema), saveAiKey)
router.delete('/ai-key', authLimiter, removeAiKey)

export default router

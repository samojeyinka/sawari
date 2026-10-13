import { Router } from 'express'
import {
  confirmAccountDeletion,
  confirmEmailChange,
  me,
  requestAccountDeletion,
  requestEmailChange,
  requestRestoreLink,
  restoreAccount,
  updateMe,
} from '../../controllers/me.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import {
  deleteConfirmSchema,
  emailChangeConfirmSchema,
  emailChangeRequestSchema,
  restoreAccountSchema,
  restoreRequestSchema,
  updateMeSchema,
} from '../../validators/authValidators.js'

const router = Router()

// Public token endpoints: email links must work logged-out.
router.post('/delete-confirm', authLimiter, validate(deleteConfirmSchema), confirmAccountDeletion)
router.post('/restore', authLimiter, validate(restoreAccountSchema), restoreAccount)
router.post('/restore-request', authLimiter, validate(restoreRequestSchema), requestRestoreLink)

router.use(authenticate)
router.get('/', me)
router.patch('/', validate(updateMeSchema), updateMe)
router.post('/delete-request', authLimiter, requestAccountDeletion)
router.post('/email-change-request', authLimiter, validate(emailChangeRequestSchema), requestEmailChange)
router.post('/email-change-confirm', authLimiter, validate(emailChangeConfirmSchema), confirmEmailChange)

export default router

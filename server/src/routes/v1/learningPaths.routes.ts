import { Router } from 'express'
import {
  createLearningPath,
  deleteLearningPath,
  getLearningPath,
  listLearningPaths,
  retryPathGeneration,
  updateLearningPath,
} from '../../controllers/learningPath.controller.js'
import {
  generatePathOutline,
  generatePathSectionSession,
  listPathSessions,
} from '../../controllers/learningPathAi.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail.js'
import { checkAiMonthlyCap } from '../../middleware/aiUsage.js'
import { aiLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { idParamSchema, sectionParamSchema } from '../../validators/common.js'
import {
  createLearningPathSchema,
  listLearningPathsQuery,
  sessionQuerySchema,
  updateLearningPathSchema,
} from '../../validators/learningPathValidators.js'

const router = Router()

router.use(authenticate)

router.get('/', validate(listLearningPathsQuery, 'query'), listLearningPaths)
router.post(
  '/',
  requireVerifiedEmail,
  validate(createLearningPathSchema),
  aiLimiter,
  checkAiMonthlyCap,
  createLearningPath,
)
router.post(
  '/:id/retry',
  requireVerifiedEmail,
  validate(idParamSchema, 'params'),
  aiLimiter,
  checkAiMonthlyCap,
  retryPathGeneration,
)
router.post(
  '/:id/outline',
  requireVerifiedEmail,
  validate(idParamSchema, 'params'),
  aiLimiter,
  checkAiMonthlyCap,
  generatePathOutline,
)
router.get('/:id/sessions', validate(idParamSchema, 'params'), listPathSessions)
router.post(
  '/:id/sections/:sectionId/session',
  requireVerifiedEmail,
  validate(sectionParamSchema, 'params'),
  validate(sessionQuerySchema, 'query'),
  aiLimiter,
  checkAiMonthlyCap,
  generatePathSectionSession,
)
router.get('/:id', validate(idParamSchema, 'params'), getLearningPath)
router.patch(
  '/:id',
  requireVerifiedEmail,
  validate(idParamSchema, 'params'),
  validate(updateLearningPathSchema),
  updateLearningPath,
)
router.delete('/:id', requireVerifiedEmail, validate(idParamSchema, 'params'), deleteLearningPath)

export default router
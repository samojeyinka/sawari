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
router.post('/', validate(createLearningPathSchema), createLearningPath)
router.post('/:id/retry', validate(idParamSchema, 'params'), retryPathGeneration)
router.post('/:id/outline', validate(idParamSchema, 'params'), generatePathOutline)
router.get('/:id/sessions', validate(idParamSchema, 'params'), listPathSessions)
router.post(
  '/:id/sections/:sectionId/session',
  validate(sectionParamSchema, 'params'),
  validate(sessionQuerySchema, 'query'),
  generatePathSectionSession,
)
router.get('/:id', validate(idParamSchema, 'params'), getLearningPath)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateLearningPathSchema),
  updateLearningPath,
)
router.delete('/:id', validate(idParamSchema, 'params'), deleteLearningPath)

export default router
import { Router } from 'express'
import {
  createLearningPath,
  deleteLearningPath,
  getLearningPath,
  listLearningPaths,
  updateLearningPath,
} from '../../controllers/learningPath.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { idParamSchema } from '../../validators/common.js'
import {
  createLearningPathSchema,
  listLearningPathsQuery,
  updateLearningPathSchema,
} from '../../validators/learningPathValidators.js'

const router = Router()

router.use(authenticate)

router.get('/', validate(listLearningPathsQuery, 'query'), listLearningPaths)
router.post('/', validate(createLearningPathSchema), createLearningPath)
router.get('/:id', validate(idParamSchema, 'params'), getLearningPath)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateLearningPathSchema),
  updateLearningPath,
)
router.delete('/:id', validate(idParamSchema, 'params'), deleteLearningPath)

export default router
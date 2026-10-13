import { Router } from 'express'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  reviewProject,
  updateProject,
} from '../../controllers/project.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail.js'
import { checkAiMonthlyCap } from '../../middleware/aiUsage.js'
import { aiLimiter, authLimiter } from '../../middleware/rateLimiter.js'
import { validate } from '../../middleware/validate.js'
import { idParamSchema } from '../../validators/common.js'
import {
  createProjectSchema,
  listProjectsQuery,
  updateProjectSchema,
} from '../../validators/projectValidators.js'

const router = Router()

router.use(authenticate)

router.get('/', validate(listProjectsQuery, 'query'), listProjects)
router.post('/', requireVerifiedEmail, validate(createProjectSchema), createProject)
router.get('/:id', validate(idParamSchema, 'params'), getProject)
router.patch(
  '/:id',
  requireVerifiedEmail,
  validate(idParamSchema, 'params'),
  validate(updateProjectSchema),
  updateProject,
)
router.post(
  '/:id/review',
  requireVerifiedEmail,
  validate(idParamSchema, 'params'),
  authLimiter,
  aiLimiter,
  checkAiMonthlyCap,
  reviewProject,
)
router.delete('/:id', requireVerifiedEmail, validate(idParamSchema, 'params'), deleteProject)

export default router
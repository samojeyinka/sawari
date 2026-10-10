import { Router } from 'express'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../../controllers/project.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
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
router.post('/', validate(createProjectSchema), createProject)
router.get('/:id', validate(idParamSchema, 'params'), getProject)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateProjectSchema),
  updateProject,
)
router.delete('/:id', validate(idParamSchema, 'params'), deleteProject)

export default router
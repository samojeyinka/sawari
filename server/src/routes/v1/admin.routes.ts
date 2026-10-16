import { Router } from 'express'
import { z } from 'zod'
import {
  createCatalogPath,
  deleteCatalogPath,
  getCatalogPath,
  listCatalogPaths,
  setCatalogPublished,
  updateCatalogPath,
} from '../../controllers/catalogAdmin.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireAdmin } from '../../middleware/requireAdmin.js'
import { validate } from '../../middleware/validate.js'
import { idParamSchema, objectId } from '../../validators/common.js'
import { createCatalogPathSchema, updateCatalogPathSchema } from '../../validators/catalogValidators.js'

const router = Router()

router.use(authenticate, requireAdmin)

const publishParamSchema = z.object({ id: objectId, action: z.enum(['publish', 'unpublish']) })

router.get('/catalog-paths', listCatalogPaths)
router.post('/catalog-paths', validate(createCatalogPathSchema), createCatalogPath)
router.get('/catalog-paths/:id', validate(idParamSchema, 'params'), getCatalogPath)
router.patch(
  '/catalog-paths/:id',
  validate(idParamSchema, 'params'),
  validate(updateCatalogPathSchema),
  updateCatalogPath,
)
router.delete('/catalog-paths/:id', validate(idParamSchema, 'params'), deleteCatalogPath)
router.post(
  '/catalog-paths/:id/:action',
  validate(publishParamSchema, 'params'),
  setCatalogPublished,
)

export default router

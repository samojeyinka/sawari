import { Router } from 'express'
import {
  createCatalogReview,
  enrollInCatalog,
  getPublishedCatalogBySlug,
  listCatalogReviews,
  listPublishedCatalog,
} from '../../controllers/catalog.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail.js'
import { validate } from '../../middleware/validate.js'
import {
  catalogSlugParam,
  createReviewSchema,
  listCatalogQuery,
} from '../../validators/catalogValidators.js'

const router = Router()

/* Public reads: no authentication, so anyone and any crawler can browse. */
router.get('/', validate(listCatalogQuery, 'query'), listPublishedCatalog)
router.get('/:slug/reviews', validate(catalogSlugParam, 'params'), listCatalogReviews)
router.get('/:slug', validate(catalogSlugParam, 'params'), getPublishedCatalogBySlug)

/* Authenticated actions: enroll a catalog path, or leave a review. */
router.post(
  '/:slug/enroll',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  enrollInCatalog,
)
router.post(
  '/:slug/reviews',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  validate(createReviewSchema),
  createCatalogReview,
)

export default router

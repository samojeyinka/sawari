import { Router } from 'express'
import {
  createCatalogReview,
  emailCatalogCertificate,
  enrollInCatalog,
  getCatalogCertificate,
  getCatalogProgress,
  getPublicCertificate,
  getPublishedCatalogBySlug,
  listCatalogReviews,
  listPublishedCatalog,
  listSavedCatalog,
  saveCatalog,
  unsaveCatalog,
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

/* Public credential verification */
router.get('/verify/:credentialId', getPublicCertificate)

/* The learner's saved courses. Declared before `/:slug` so "saved" is not
   captured as a slug. */
router.get('/saved', authenticate, listSavedCatalog)

router.get('/:slug/reviews', validate(catalogSlugParam, 'params'), listCatalogReviews)
router.get('/:slug', validate(catalogSlugParam, 'params'), getPublishedCatalogBySlug)

/* Authenticated actions: enroll a catalog path, bookmark it, review it, or get certificate/progress. */
router.get(
  '/:slug/progress',
  authenticate,
  validate(catalogSlugParam, 'params'),
  getCatalogProgress,
)
router.get(
  '/:slug/certificate',
  authenticate,
  validate(catalogSlugParam, 'params'),
  getCatalogCertificate,
)
router.post(
  '/:slug/certificate/email',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  emailCatalogCertificate,
)
router.post(
  '/:slug/enroll',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  enrollInCatalog,
)
router.post(
  '/:slug/save',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  saveCatalog,
)
router.delete(
  '/:slug/save',
  authenticate,
  requireVerifiedEmail,
  validate(catalogSlugParam, 'params'),
  unsaveCatalog,
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

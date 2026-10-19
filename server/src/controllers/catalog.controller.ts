import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { escapeRegex, pageMeta, parsePagination, parseSort } from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { CatalogPath } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import { User } from '../models/User.js'
import {
  CATALOG_CARD_SELECT,
  enrollUserInCatalog,
  findEnrollment,
  listSavedCatalogPaths,
  recomputeReviewAggregates,
  saveCatalogPath,
  unsaveCatalogPath,
} from '../services/catalog.js'
import {
  findPublicCertificate,
  getOrIssueCertificate,
  sendCertificateToEmail,
} from '../services/certificate.js'
import type { CreateReviewInput } from '../validators/catalogValidators.js'

/* ------------------------------------------------------------------ */
/*  Public catalog read surface. No authentication: anyone (and any    */
/*  crawler) can browse and read a published path in full.             */
/* ------------------------------------------------------------------ */

const LIST_SORT = ['createdAt', 'enrollments', 'reviewsAvg', 'subject'] as const

/** Cards omit the heavy per-section content. */
const LIST_SELECT = CATALOG_CARD_SELECT

/* ------------------------------- list ----------------------------- */

export const listPublishedCatalog = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, skip } = parsePagination(req)
    const sort = parseSort(req, LIST_SORT)

    const filter: Record<string, unknown> = { published: true }
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' }
      filter.$or = [{ subject: rx }, { summary: rx }, { tags: rx }]
    }
    if (typeof req.query.tag === 'string' && req.query.tag.trim()) {
      filter.tags = req.query.tag.trim()
    }
    if (typeof req.query.level === 'string' && req.query.level.trim()) {
      filter.level = req.query.level.trim()
    }

    const [items, total] = await Promise.all([
      CatalogPath.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_SELECT).lean(),
      CatalogPath.countDocuments(filter),
    ])
    res.ok(items.map(serialize), pageMeta(page, limit, total))
  },
)

/* ------------------------------- detail --------------------------- */

export const getPublishedCatalogBySlug = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await CatalogPath.findOne({ slug: req.params.slug, published: true }).lean()
    if (!path) throw httpError.notFound('Catalog path not found.')
    res.ok(serialize(path))
  },
)

/* ------------------------------ enroll ---------------------------- */

export const enrollInCatalog = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await enrollUserInCatalog(req.user!.id, String(req.params.slug))
    res.created(serialize(path.toObject({ flattenMaps: true })))
  },
)

/* ------------------------------ saved ----------------------------- */

export const listSavedCatalog = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const items = await listSavedCatalogPaths(req.user!.id)
    res.ok(items.map(serialize))
  },
)

export const saveCatalog = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await saveCatalogPath(req.user!.id, String(req.params.slug))
    res.ok({ saved: true })
  },
)

export const unsaveCatalog = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    await unsaveCatalogPath(req.user!.id, String(req.params.slug))
    res.ok({ saved: false })
  },
)

/* ------------------------------ reviews --------------------------- */

interface PopulatedReview {
  _id: unknown
  rating: number
  text: string
  createdAt: Date
  userId?: { firstName?: string; lastName?: string } | null
}

function toPublicReview(review: PopulatedReview) {
  const first = review.userId?.firstName ?? 'A learner'
  const lastInitial = review.userId?.lastName?.trim()?.[0]
  return {
    id: String(review._id),
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
    author: lastInitial ? `${first} ${lastInitial}.` : first,
  }
}

export const listCatalogReviews = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const catalog = await CatalogPath.findOne({ slug: req.params.slug, published: true })
      .select('_id')
      .lean()
    if (!catalog) throw httpError.notFound('Catalog path not found.')

    const { page, limit, skip } = parsePagination(req)
    const [items, total] = await Promise.all([
      CatalogReview.find({ catalogPathId: catalog._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .lean(),
      CatalogReview.countDocuments({ catalogPathId: catalog._id }),
    ])

    res.ok(items.map((item) => toPublicReview(item as PopulatedReview)), pageMeta(page, limit, total))
  },
)

export const createCatalogReview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const catalog = await CatalogPath.findOne({ slug: req.params.slug, published: true })
      .select('_id')
      .lean()
    if (!catalog) throw httpError.notFound('Catalog path not found.')

    const enrollment = await findEnrollment(req.user!.id, catalog._id.toString())
    if (!enrollment) {
      throw httpError.forbidden('You must enroll and complete at least 70% of this course to leave a review.')
    }

    const total = enrollment.sections.length
    const completed = enrollment.sections.filter((s) => s.status === 'completed').length
    const progressPercent = total > 0 ? (completed / total) * 100 : 0

    if (progressPercent < 70) {
      const rounded = Math.round(progressPercent)
      throw httpError.forbidden(
        `You have completed ${rounded}% of this course. You must complete at least 70% to leave a review.`,
      )
    }

    const body = req.body as CreateReviewInput
    const review = (await CatalogReview.findOneAndUpdate(
      { userId: req.user!.id, catalogPathId: catalog._id },
      { $set: { rating: body.rating, text: body.text } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ))!

    await recomputeReviewAggregates(catalog._id.toString())

    const populated = await review.populate('userId', 'firstName lastName')
    res.created(toPublicReview(populated.toObject() as unknown as PopulatedReview))
  },
)

/* ----------------------------- progress --------------------------- */

export const getCatalogProgress = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const catalog = await CatalogPath.findOne({ slug: req.params.slug, published: true })
      .select('_id')
      .lean()
    if (!catalog) throw httpError.notFound('Catalog path not found.')

    const enrollment = await findEnrollment(req.user!.id, catalog._id.toString())
    const total = enrollment ? enrollment.sections.length : 0
    const completed = enrollment
      ? enrollment.sections.filter((s) => s.status === 'completed').length
      : 0
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
    const isAdmin = req.user?.role === 'admin'

    res.ok({
      enrolled: Boolean(enrollment),
      totalSections: total,
      completedSections: completed,
      progressPercent,
      canReview: progressPercent >= 70,
      eligibleForCertificate: progressPercent === 100 || isAdmin,
      isAdmin,
    })
  },
)

/* --------------------------- certificate -------------------------- */

export const getCatalogCertificate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userDoc = await User.findById(req.user!.id).select('firstName lastName email role').lean()
    if (!userDoc) throw httpError.notFound('User not found.')

    const cert = await getOrIssueCertificate(
      {
        id: req.user!.id,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        email: userDoc.email,
        role: req.user?.role,
      },
      req.params.slug as string,
    )

    res.ok(cert)
  },
)

export const emailCatalogCertificate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userDoc = await User.findById(req.user!.id).select('firstName lastName email role').lean()
    if (!userDoc) throw httpError.notFound('User not found.')

    const result = await sendCertificateToEmail(
      {
        id: req.user!.id,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        email: userDoc.email,
        role: req.user?.role,
      },
      req.params.slug as string,
    )

    res.ok(result)
  },
)

export const getPublicCertificate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const cert = await findPublicCertificate(req.params.credentialId as string)
    if (!cert) throw httpError.notFound('Verified certificate not found.')
    res.ok(cert)
  },
)

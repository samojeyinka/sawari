import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { escapeRegex, pageMeta, parsePagination, parseSort } from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { CatalogPath } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import {
  CATALOG_CARD_SELECT,
  enrollUserInCatalog,
  listSavedCatalogPaths,
  recomputeReviewAggregates,
  saveCatalogPath,
  unsaveCatalogPath,
} from '../services/catalog.js'
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

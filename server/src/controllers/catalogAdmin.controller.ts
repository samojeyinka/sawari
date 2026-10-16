import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { escapeRegex, pageMeta, parsePagination, parseSort } from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { CatalogPath } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import { LearningPath } from '../models/LearningPath.js'
import { buildCatalogSections } from '../services/catalog.js'
import type {
  CreateCatalogPathInput,
  UpdateCatalogPathInput,
} from '../validators/catalogValidators.js'

/* ------------------------------------------------------------------ */
/*  Admin curation of the public catalog. Every route is behind        */
/*  `authenticate` + `requireAdmin`.                                    */
/* ------------------------------------------------------------------ */

const LIST_SORT = ['createdAt', 'updatedAt', 'subject', 'enrollments', 'reviewsAvg'] as const

/** The admin list omits the heavy per-section content. */
const LIST_SELECT =
  'slug subject summary level tags weeklyHours intensity formats expectedWeeks expectedHours ogImage published publishedAt enrollments reviewsCount reviewsAvg createdAt updatedAt sections.id sections.title sections.order sections.minutes'

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'path'
  )
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base
  let n = 2
  while (
    await CatalogPath.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${base}-${n++}`
  }
  return candidate
}

/* -------------------------------- list ---------------------------- */

export const listCatalogPaths = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, skip } = parsePagination(req)
    const sort = parseSort(req, LIST_SORT)

    const filter: Record<string, unknown> = {}
    if (req.query.published === 'true') filter.published = true
    if (req.query.published === 'false') filter.published = false
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (q) filter.subject = { $regex: escapeRegex(q), $options: 'i' }

    const [items, total] = await Promise.all([
      CatalogPath.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_SELECT).lean(),
      CatalogPath.countDocuments(filter),
    ])
    res.ok(items.map(serialize), pageMeta(page, limit, total))
  },
)

/* -------------------------------- get ----------------------------- */

export const getCatalogPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await CatalogPath.findById(req.params.id).lean()
    if (!path) throw httpError.notFound('Catalog path not found.')
    res.ok(serialize(path))
  },
)

/* ------------------------------ create ---------------------------- */

export const createCatalogPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as CreateCatalogPathInput

    let slug: string
    if (body.slug) {
      if (await CatalogPath.exists({ slug: body.slug })) {
        throw httpError.conflict('That slug is already in use.', 'slug_taken')
      }
      slug = body.slug
    } else {
      slug = await uniqueSlug(slugify(body.subject))
    }

    const path = await CatalogPath.create({
      slug,
      subject: body.subject,
      summary: body.summary,
      goal: body.goal,
      level: body.level,
      tags: body.tags,
      weeklyHours: body.weeklyHours,
      intensity: body.intensity,
      formats: body.formats,
      expectedWeeks: body.expectedWeeks,
      expectedHours: body.expectedHours,
      ogImage: body.ogImage,
      sections: buildCatalogSections(body.sections, slug),
      published: body.published,
      publishedAt: body.published ? new Date() : null,
      createdBy: req.user!.id,
    })

    res.created(serialize(path.toObject()))
  },
)

/* ------------------------------ update ---------------------------- */

export const updateCatalogPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as UpdateCatalogPathInput
    const path = await CatalogPath.findById(req.params.id)
    if (!path) throw httpError.notFound('Catalog path not found.')

    if (body.slug !== undefined && body.slug !== path.slug) {
      if (await CatalogPath.exists({ slug: body.slug, _id: { $ne: path._id } })) {
        throw httpError.conflict('That slug is already in use.', 'slug_taken')
      }
      path.slug = body.slug
    }

    if (body.subject !== undefined) path.subject = body.subject
    if (body.summary !== undefined) path.summary = body.summary
    if (body.goal !== undefined) path.goal = body.goal
    if (body.level !== undefined) path.level = body.level
    if (body.tags !== undefined) path.tags = body.tags
    if (body.weeklyHours !== undefined) path.weeklyHours = body.weeklyHours
    if (body.intensity !== undefined) path.intensity = body.intensity
    if (body.formats !== undefined) path.formats = body.formats
    if (body.expectedWeeks !== undefined) path.expectedWeeks = body.expectedWeeks
    if (body.expectedHours !== undefined) path.expectedHours = body.expectedHours
    if (body.ogImage !== undefined) path.ogImage = body.ogImage
    if (body.sections !== undefined) {
      path.sections = buildCatalogSections(body.sections, path.slug, path.sections)
    }
    if (body.published !== undefined) {
      path.published = body.published
      if (body.published) {
        path.publishedAt = path.publishedAt ?? new Date()
      } else {
        path.publishedAt = null
      }
    }

    await path.save()
    res.ok(serialize(path.toObject()))
  },
)

/* ------------------------ publish / unpublish --------------------- */

export const setCatalogPublished = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const published = req.params.action === 'publish'
    const path = await CatalogPath.findById(req.params.id)
    if (!path) throw httpError.notFound('Catalog path not found.')

    if (published && path.sections.length === 0) {
      throw httpError.badRequest('Add at least one section before publishing.', 'empty_path')
    }

    path.published = published
    path.publishedAt = published ? (path.publishedAt ?? new Date()) : null
    await path.save()
    res.ok(serialize(path.toObject()))
  },
)

/* ------------------------------ delete ---------------------------- */

export const deleteCatalogPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await CatalogPath.findByIdAndDelete(req.params.id)
    if (!path) throw httpError.notFound('Catalog path not found.')

    // Reviews go with it; enrolled personal copies are kept but detached so
    // they keep working as ordinary learner paths.
    await CatalogReview.deleteMany({ catalogPathId: path._id })
    await LearningPath.updateMany(
      { catalogPathId: path._id },
      { $set: { catalogPathId: null } },
    )

    res.noContent()
  },
)

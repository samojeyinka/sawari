import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import {
  escapeRegex,
  pageMeta,
  parsePagination,
  parseSelect,
  parseSort,
} from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { LearningPath } from '../models/LearningPath.js'
import { Project } from '../models/Project.js'
import type {
  CreateLearningPathInput,
  UpdateLearningPathInput,
} from '../validators/learningPathValidators.js'

/** Allow-lists: a client can only sort/select fields listed here. */
const LIST_SORT = ['createdAt', 'updatedAt', 'subject', 'targetDate'] as const
const LIST_SELECT = [
  'subject',
  'goal',
  'experience',
  'reason',
  'weeklyHours',
  'intensity',
  'formats',
  'targetDate',
  'stats',
  'currentSectionId',
  'completedActivities',
  'countedSessions',
  'adaptationNote',
  'createdAt',
  'updatedAt',
] as const

/* -------------------------------- list ---------------------------- */

export const listLearningPaths = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, skip } = parsePagination(req)
    const sort = parseSort(req, LIST_SORT)
    const projection = parseSelect(req, LIST_SELECT)

    const filter: Record<string, unknown> = { userId: req.user!.id }
    const subject = typeof req.query.subject === 'string' ? req.query.subject.trim() : ''
    if (subject) filter.subject = { $regex: escapeRegex(subject), $options: 'i' }

    // Projection intentionally omits `sections`/`assessmentResults`: the list
    // view does not need them (no over-fetching). Both queries run concurrently.
    const [items, total] = await Promise.all([
      LearningPath.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(projection ?? {})
        .lean(),
      LearningPath.countDocuments(filter),
    ])

    res.ok(items.map(serialize), pageMeta(page, limit, total))
  },
)

/* -------------------------------- get ----------------------------- */

export const getLearningPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await LearningPath.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    }).lean()
    if (!path) throw httpError.notFound('Learning path not found.')
    res.ok(serialize(path))
  },
)

/* ------------------------------ create ---------------------------- */

export const createLearningPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as CreateLearningPathInput
    const path = await LearningPath.create({ ...body, userId: req.user!.id })
    res.created(serialize(path.toObject({ flattenMaps: true })))
  },
)

/* ------------------------------ update ---------------------------- */

export const updateLearningPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as UpdateLearningPathInput
    const path = await LearningPath.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: body },
      { returnDocument: 'after', runValidators: true },
    ).lean()
    if (!path) throw httpError.notFound('Learning path not found.')
    res.ok(serialize(path))
  },
)

/* ------------------------------ delete ---------------------------- */

export const deleteLearningPath = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await LearningPath.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id,
    }).lean()
    if (!path) throw httpError.notFound('Learning path not found.')

    // Detach any projects that referenced the removed path (no orphan state).
    await Project.updateMany(
      { userId: req.user!.id, pathId: path._id },
      { $set: { pathId: null } },
    )

    res.noContent()
  },
)
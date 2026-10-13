import type { NextFunction, Request, Response } from 'express'
import { checkAiHealth } from '../services/ai/health.js'
import { enqueue } from '../jobs/queue.js'
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
  'generationStatus',
  'generationError',
  'generationStartedAt',
  'generationFinishedAt',
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

    // If explicit sections were sent, preserve them (back-compat / tests)
    if (body.sections && body.sections.length > 0) {
      const path = await LearningPath.create({
        ...body,
        userId: req.user!.id,
        generationStatus: 'ready',
      })
      res.created(serialize(path.toObject({ flattenMaps: true })))
      return
    }

    // AI path: verify DeepSeek is available before accepting
    const health = await checkAiHealth()
    if (!health.available) {
      throw httpError.serviceUnavailable(
        health.error ?? 'AI generation is currently unavailable.',
        'ai_unavailable',
      )
    }

    const path = await LearningPath.create({
      ...body,
      userId: req.user!.id,
      sections: [],
      currentSectionId: null,
      generationStatus: 'queued',
      generationError: null,
    })

    await enqueue('build-path', { pathId: path._id.toString(), userId: req.user!.id })

    res.created(serialize(path.toObject({ flattenMaps: true })))
  },
)

/* ------------------------------ retry ----------------------------- */

export const retryPathGeneration = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await LearningPath.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    })
    if (!path) throw httpError.notFound('Learning path not found.')

    if (path.generationStatus !== 'failed') {
      res.ok(serialize(path.toObject({ flattenMaps: true })))
      return
    }

    const health = await checkAiHealth()
    if (!health.available) {
      throw httpError.serviceUnavailable(
        health.error ?? 'AI generation is currently unavailable.',
        'ai_unavailable',
      )
    }

    path.generationStatus = 'queued'
    path.generationError = null
    path.generationStartedAt = null
    path.generationFinishedAt = null
    await path.save()

    await enqueue('build-path', { pathId: path._id.toString(), userId: req.user!.id })

    res.ok(serialize(path.toObject({ flattenMaps: true })))
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
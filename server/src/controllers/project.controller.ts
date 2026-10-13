import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { pageMeta, parsePagination, parseSelect, parseSort } from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { LearningPath } from '../models/LearningPath.js'
import { Project } from '../models/Project.js'
import { reviewProjectSubmission } from '../services/ai/index.js'
import { AiRequestError, AiUnavailableError } from '../services/ai/deepseek.js'
import { resolveUserKey } from '../services/userKey.js'
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '../validators/projectValidators.js'

const LIST_SORT = ['createdAt', 'updatedAt', 'title', 'status'] as const
const LIST_SELECT = [
  'pathId',
  'title',
  'description',
  'status',
  'level',
  'estHours',
  'objectives',
  'tasks',
  'deliverables',
  'related',
  'completedTaskIds',
  'submitted',
  'reviewed',
  'submittedAt',
  'submissionNote',
  'feedback',
  'createdAt',
  'updatedAt',
] as const

/* -------------------------------- list ---------------------------- */

export const listProjects = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, skip } = parsePagination(req)
    const sort = parseSort(req, LIST_SORT)
    const projection = parseSelect(req, LIST_SELECT)

    const filter: Record<string, unknown> = { userId: req.user!.id }
    if (typeof req.query.status === 'string') filter.status = req.query.status
    if (typeof req.query.pathId === 'string') filter.pathId = req.query.pathId

    const [items, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(projection ?? {})
        .lean(),
      Project.countDocuments(filter),
    ])

    res.ok(items.map(serialize), pageMeta(page, limit, total))
  },
)

/* -------------------------------- get ----------------------------- */

export const getProject = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user!.id,
    }).lean()
    if (!project) throw httpError.notFound('Project not found.')
    res.ok(serialize(project))
  },
)

/* ------------------------------ create ---------------------------- */

export const createProject = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as CreateProjectInput

    // A project may be attached to one of the caller's own paths only.
    if (body.pathId) {
      const owned = await LearningPath.exists({ _id: body.pathId, userId: req.user!.id })
      if (!owned) throw httpError.badRequest('Unknown learning path.')
    }

    const project = await Project.create({ ...body, userId: req.user!.id })
    res.created(serialize(project.toObject({ flattenMaps: true })))
  },
)

/* ------------------------------ update ---------------------------- */

export const updateProject = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = req.body as UpdateProjectInput
    // Moving a project is only allowed onto one of the caller's own paths.
    if (body.pathId !== undefined && body.pathId !== null) {
      const owned = await LearningPath.exists({ _id: body.pathId, userId: req.user!.id })
      if (!owned) throw httpError.badRequest('Unknown learning path.')
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: body },
      { returnDocument: 'after', runValidators: true },
    ).lean()
    if (!project) throw httpError.notFound('Project not found.')
    res.ok(serialize(project))
  },
)

/* ------------------------------ review ---------------------------- */

export const reviewProject = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.id })
    if (!project) throw httpError.notFound('Project not found.')
    if (!project.submitted) {
      throw httpError.badRequest('Submit the project before requesting a review.')
    }

    let review
    try {
      review = await reviewProjectSubmission(
        {
          title: project.title,
          description: project.description,
          objectives: project.objectives,
          tasks: project.tasks.map((task) => ({
            title: task.title,
            done: project.completedTaskIds.includes(task.id),
          })),
          submissionNote: project.submissionNote ?? undefined,
        },
        await resolveUserKey(req.user!.id),
      )
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        throw httpError.serviceUnavailable('AI review is unavailable right now. Try again in a bit.')
      }
      if (error instanceof AiRequestError) {
        throw httpError.badGateway('AI review failed. Try again in a bit.')
      }
      throw error
    }

    project.feedback = review
    project.reviewed = true
    project.status = 'completed'
    await project.save()

    res.ok(serialize(project.toObject({ flattenMaps: true })))
  },
)

/* ------------------------------ delete ---------------------------- */

export const deleteProject = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id,
    }).lean()
    if (!project) throw httpError.notFound('Project not found.')
    res.noContent()
  },
)
import type { NextFunction, Request, Response } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/AppError.js'
import { pageMeta, parsePagination, parseSelect, parseSort } from '../lib/queryFilters.js'
import { serialize } from '../lib/serialize.js'
import { LearningPath } from '../models/LearningPath.js'
import { Project } from '../models/Project.js'
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
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: body },
      { returnDocument: 'after', runValidators: true },
    ).lean()
    if (!project) throw httpError.notFound('Project not found.')
    res.ok(serialize(project))
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
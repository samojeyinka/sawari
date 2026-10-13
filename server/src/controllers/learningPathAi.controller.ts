import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { AppError, HTTP, httpError } from '../lib/AppError.js'
import { serialize } from '../lib/serialize.js'
import { LearningPath, type PathSection } from '../models/LearningPath.js'
import { SessionContentModel } from '../models/SessionContent.js'
import { AiRequestError, AiUnavailableError } from '../services/ai/deepseek.js'
import { generateSessionContent } from '../services/ai/index.js'
import type { SessionGenContext } from '../services/ai/prompts.js'
import {
  briefFromPath,
  regeneratePathOutline,
} from '../services/pathOutline.js'

/* ------------------------------------------------------------------ */
/*  AI generation endpoints for a learning path:                       */
/*   - regenerate the path outline (sections)                          */
/*   - generate (or return cached) content for one section             */
/*   - list all cached section content for a path                      */
/* ------------------------------------------------------------------ */

/** Turns AI (or any) errors into the right HTTP status for the client. */
function mapAiError(error: unknown): never {
  if (error instanceof AiUnavailableError) {
    throw new AppError(error.message, HTTP.serviceUnavailable, 'ai_unavailable', undefined, true)
  }
  if (error instanceof AiRequestError) {
    throw new AppError(error.message, HTTP.badGateway, 'ai_failed', undefined, true)
  }
  throw error
}

/** Runs an AI call, mapping any failure to the correct HTTP error. */
async function withAiErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    mapAiError(error)
  }
}

/* ----------------------------- outline ---------------------------- */

export const generatePathOutline = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await LearningPath.findOne({ _id: req.params.id, userId: req.user!.id })
    if (!path) throw httpError.notFound('Learning path not found.')

    await withAiErrors(() => regeneratePathOutline(path))
    res.ok(serialize(path.toObject({ flattenMaps: true })))
  },
)

/* --------------------------- one section -------------------------- */

/**
 * Collects what the model needs to stay original: the full outline with this
 * section's position, plus every resource already used by sibling sections.
 * Reads both the current `resources` shape and the legacy single `resource`.
 */
async function buildSessionContext(
  pathId: string,
  sections: PathSection[],
  sectionId: string,
): Promise<SessionGenContext> {
  const ordered = [...sections].sort((a, b) => a.order - b.order)
  const position = ordered.findIndex((s) => s.id === sectionId) + 1

  const rows = await SessionContentModel.find({ pathId, sectionId: { $ne: sectionId } })
    .select('sectionId content')
    .lean()

  const titleOf = (id: string) => ordered.find((s) => s.id === id)?.title ?? 'another section'
  const priorResources: SessionGenContext['priorResources'] = []
  for (const row of rows) {
    const content = row.content as {
      resources?: { title: string; kind: string; url?: string }[]
      resource?: { title: string; kind: string; url?: string }
    } | null
    const items =
      content?.resources?.length ? content.resources : content?.resource ? [content.resource] : []
    for (const item of items) {
      priorResources.push({
        sectionTitle: titleOf(row.sectionId),
        title: item.title,
        kind: item.kind,
        url: item.url,
      })
    }
  }

  return {
    position: Math.max(position, 1),
    total: ordered.length,
    outline: ordered.map((s) => ({ order: s.order, title: s.title, description: s.description })),
    priorResources,
  }
}

export const generatePathSectionSession = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id, sectionId } = req.params as { id: string; sectionId: string }
    const path = await LearningPath.findOne({ _id: id, userId: req.user!.id }).lean()
    if (!path) throw httpError.notFound('Learning path not found.')

    const section = path.sections.find((s) => s.id === sectionId)
    if (!section) throw httpError.notFound('Section not found.')

    // Serve the cached session unless the caller explicitly asks to regenerate.
    if (req.query.regenerate !== 'true') {
      const cached = await SessionContentModel.findOne({ pathId: id, sectionId }).lean()
      if (cached) {
        res.ok(cached.content)
        return
      }
    }

    const context = await buildSessionContext(id, path.sections, sectionId)

    const content = await withAiErrors(() =>
      generateSessionContent(
        briefFromPath(path),
        { title: section.title, description: section.description },
        sectionId,
        context,
      ),
    )

    await SessionContentModel.findOneAndUpdate(
      { pathId: id, sectionId },
      {
        $set: {
          userId: req.user!.id,
          pathId: id,
          sectionId,
          content,
          modelName: env.DEEPSEEK_MODEL,
        },
      },
      { upsert: true, returnDocument: 'after' },
    )

    res.ok(content)
  },
)

/* --------------------------- cached list -------------------------- */

export const listPathSessions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const path = await LearningPath.findOne({ _id: req.params.id, userId: req.user!.id })
      .select('_id')
      .lean()
    if (!path) throw httpError.notFound('Learning path not found.')

    const rows = await SessionContentModel.find({ pathId: req.params.id }).lean()
    const bySection: Record<string, unknown> = {}
    for (const row of rows) bySection[row.sectionId] = row.content

    res.ok(bySection)
  },
)
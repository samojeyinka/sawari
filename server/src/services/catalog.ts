import { randomBytes } from 'node:crypto'
import { Types } from 'mongoose'
import { httpError } from '../lib/AppError.js'
import { CatalogPath, type CatalogPathDocument, type CatalogSection } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import { LearningPath, type LearningPathDocument, type PathSection } from '../models/LearningPath.js'
import { SessionContentModel, type Practice, type SessionContent } from '../models/SessionContent.js'
import { User } from '../models/User.js'
import type { CatalogSectionInput } from '../validators/catalogValidators.js'

/** Card fields shared by the public list and the learner's saved list. */
export const CATALOG_CARD_SELECT =
  'slug subject summary level tags weeklyHours intensity formats expectedWeeks expectedHours ogImage publishedAt enrollments reviewsCount reviewsAvg createdAt updatedAt sections.id sections.title sections.order sections.minutes'

/* ------------------------------------------------------------------ */
/*  Enrolling copies a public catalog path into the learner's own      */
/*  account so they can edit it and track progress, while the shared   */
/*  catalog original stays untouched. Enrolled paths are not counted   */
/*  against the free/pro path limit.                                    */
/* ------------------------------------------------------------------ */

function shortId(): string {
  return randomBytes(4).toString('hex')
}

/**
 * Turns validated admin input into stored sections, stamping fresh ids on
 * the section and on every content item so the session UI can key off them.
 *
 * Existing section ids are preserved so anything anchored to a section
 * (chat threads, bookmarks, analytics) survives an edit: a submitted `id`
 * wins, otherwise the section at the same position keeps its id. Only
 * genuinely new sections get a freshly minted id.
 */
export function buildCatalogSections(
  inputs: CatalogSectionInput[],
  baseSlug: string,
  existing: CatalogSection[] = [],
): CatalogSection[] {
  const stamp = shortId()
  return inputs.map((section, i) => {
    const matched = section.id ? existing.find((s) => s.id === section.id) : undefined
    const sid = matched?.id ?? existing[i]?.id ?? `${baseSlug}-${stamp}-s${i + 1}`
    const content = section.content

    let practice: Practice
    if (content.practice.kind === 'classify') {
      practice = {
        ...content.practice,
        id: `${sid}-practice`,
        items: content.practice.items.map((item, ii) => ({ ...item, id: `${sid}-p${ii + 1}` })),
      }
    } else {
      practice = { ...content.practice, id: `${sid}-practice` }
    }

    const full: SessionContent = {
      lesson: { ...content.lesson, id: `${sid}-lesson` },
      resources: content.resources.map((resource, ri) => ({
        ...resource,
        id: `${sid}-r${ri + 1}`,
        url: resource.url ?? undefined,
      })),
      practice,
      assessment: {
        ...content.assessment,
        id: `${sid}-assessment`,
        questions: content.assessment.questions.map((question, qi) => ({
          ...question,
          id: `${sid}-q${qi + 1}`,
        })),
      },
    }

    return {
      id: sid,
      order: i,
      title: section.title,
      description: section.description,
      minutes: section.minutes,
      content: full,
    }
  })
}

/** Recomputes a catalog path's review count and average from its reviews. */
export async function recomputeReviewAggregates(catalogPathId: string): Promise<void> {
  const [agg] = await CatalogReview.aggregate<{ count: number; avg: number }>([
    { $match: { catalogPathId: new Types.ObjectId(catalogPathId) } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ])
  const reviewsCount = agg?.count ?? 0
  const reviewsAvg = agg ? Math.round(agg.avg * 10) / 10 : 0
  await CatalogPath.updateOne({ _id: catalogPathId }, { $set: { reviewsCount, reviewsAvg } })
}

function sectionsFromCatalog(catalog: CatalogPathDocument): PathSection[] {
  return catalog.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section, i) => ({
      id: section.id,
      order: section.order,
      title: section.title,
      description: section.description,
      minutes: section.minutes,
      status: i === 0 ? 'current' : i === 1 ? 'upcoming' : 'locked',
      doneMinutes: 0,
      note:
        i === 0
          ? undefined
          : i === 1
            ? `Starts after ${catalog.sections[0]?.title ?? ''}.`
            : `Unlocks after ${catalog.sections[i - 1]?.title ?? ''}.`,
    }))
}

/** The learner's existing copy of this catalog path, if any. */
export function findEnrollment(
  userId: string,
  catalogPathId: string,
): Promise<LearningPathDocument | null> {
  return LearningPath.findOne({ userId, catalogPathId })
}

/**
 * Creates (or returns the existing) personal copy of a catalog path for the
 * learner, caching each section's authored content so the normal session UI
 * works with no AI generation. Idempotent: re-enrolling returns the same path.
 */
export async function enrollUserInCatalog(
  userId: string,
  slug: string,
): Promise<LearningPathDocument> {
  const catalog = await CatalogPath.findOne({ slug, published: true })
  if (!catalog) throw httpError.notFound('Catalog path not found.')

  const existing = await findEnrollment(userId, catalog._id.toString())
  if (existing) return existing

  const sections = sectionsFromCatalog(catalog)
  const path = await LearningPath.create({
    userId,
    catalogPathId: catalog._id,
    subject: catalog.subject,
    goal: catalog.goal,
    experience: catalog.level,
    reason: null,
    weeklyHours: catalog.weeklyHours,
    intensity: catalog.intensity,
    formats: catalog.formats,
    targetDate: null,
    sections,
    currentSectionId: sections[0]?.id ?? null,
    generationStatus: 'ready',
  })

  const content = catalog.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      userId: path.userId,
      pathId: path._id,
      sectionId: section.id,
      content: section.content as SessionContent,
      modelName: 'catalog',
    }))
  if (content.length > 0) await SessionContentModel.insertMany(content)

  await CatalogPath.updateOne({ _id: catalog._id }, { $inc: { enrollments: 1 } })

  return path
}

/* ----------------------------- saved list -------------------------- */

/**
 * Bookmarks a published catalog path for the learner. Idempotent: saving
 * twice keeps a single entry, so the "save" action is always safe to repeat.
 */
export async function saveCatalogPath(userId: string, slug: string): Promise<void> {
  const catalog = await CatalogPath.findOne({ slug, published: true }).select('_id').lean()
  if (!catalog) throw httpError.notFound('Catalog path not found.')
  await User.updateOne({ _id: userId }, { $addToSet: { savedCatalogPaths: catalog._id } })
}

/** Removes a bookmark. A no-op when the path was never saved. */
export async function unsaveCatalogPath(userId: string, slug: string): Promise<void> {
  const catalog = await CatalogPath.findOne({ slug }).select('_id').lean()
  if (!catalog) throw httpError.notFound('Catalog path not found.')
  await User.updateOne({ _id: userId }, { $pull: { savedCatalogPaths: catalog._id } })
}

/**
 * The learner's bookmarked courses, newest first. Unpublished or deleted
 * catalog paths simply drop out rather than leaving a broken card behind.
 */
export async function listSavedCatalogPaths(userId: string) {
  const user = await User.findById(userId).select('savedCatalogPaths').lean()
  const ids = user?.savedCatalogPaths ?? []
  if (ids.length === 0) return []
  return CatalogPath.find({ _id: { $in: ids }, published: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .select(CATALOG_CARD_SELECT)
    .lean()
}

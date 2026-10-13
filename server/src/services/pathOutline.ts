import type {
  ExperienceLevel,
  GoalReason,
  Intensity,
  LearningFormat,
  WeeklyHours,
} from '../domain/index.js'
import { LearningPath, type LearningPathDocument, type PathSection } from '../models/LearningPath.js'
import { SessionContentModel } from '../models/SessionContent.js'
import { generateOutline, type GeneratedSection } from './ai/index.js'
import type { LearnerBrief } from './ai/prompts.js'

/* ------------------------------------------------------------------ */
/*  Path outline regeneration, shared by the API and the background    */
/*  job so both apply an outline the exact same way.                   */
/* ------------------------------------------------------------------ */

/** The stored path fields we hand to the model. */
interface BriefPath {
  subject: string
  goal: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  targetDate: string | null
}

export function briefFromPath(path: BriefPath): LearnerBrief {
  return {
    subject: path.subject,
    experience: path.experience,
    reason: path.reason,
    outcome: path.goal,
    weeklyHours: path.weeklyHours,
    formats: path.formats,
    intensity: path.intensity,
    targetDate: path.targetDate,
  }
}

function sectionSlug(subject: string): string {
  return (
    subject
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 16) || 'path'
  )
}

/** Rebuilds the section list from an outline, with fresh ids + statuses. */
export function sectionsFromOutline(subject: string, outline: GeneratedSection[]): PathSection[] {
  const stamp = Date.now().toString(36)
  const slug = sectionSlug(subject)
  return outline.map((section, i) => ({
    id: `${slug}-${stamp}-s${i + 1}`,
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
          ? `Starts after ${outline[0]?.title ?? ''}.`
          : `Unlocks after ${outline[i - 1]?.title ?? ''}.`,
  }))
}

/**
 * Generates a fresh outline and applies it to the path, resetting progress
 * (section ids change, so old progress no longer applies) and clearing any
 * cached session content.
 */
export async function regeneratePathOutline(path: LearningPathDocument): Promise<void> {
  const outline = await generateOutline(briefFromPath(path))

  path.sections = sectionsFromOutline(path.subject, outline)
  path.currentSectionId = path.sections[0]?.id ?? null
  path.completedActivities = []
  path.countedSessions = []
  path.assessmentResults = {}
  path.adaptationNote = null
  path.generationStatus = 'ready'
  path.generationError = null
  await path.save()

  await SessionContentModel.deleteMany({ pathId: path._id })
}

/** Loads a path and applies an outline to it (used by the job worker). */
export async function regenerateOutlineForPath(pathId: string): Promise<LearningPathDocument | null> {
  const path = await LearningPath.findById(pathId)
  if (!path) return null
  await regeneratePathOutline(path)
  return path
}
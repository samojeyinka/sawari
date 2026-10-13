import type { LearningPath, PathSection, Resource, SessionActivity, SessionContent } from '../types'

export { mockUser, mockNotifications, mockSettings } from './user'
export { mockProjects } from './projects'
export { mockRecent } from './progress'
export { mockLearningPaths } from './paths'
export {
  findTemplateMatch,
  preferredFormats,
} from './templates'

/**
 * Resolve session content for a section from cache.
 * DeepSeek AI generates all session content on first open and stores it in state.
 */
export function getSessionContent(
  sectionId: string,
  custom?: Record<string, SessionContent>,
): SessionContent | null {
  return custom?.[sectionId] ?? null
}

export function getSection(path: LearningPath, sectionId: string): PathSection | undefined {
  return path.sections.find((s) => s.id === sectionId)
}

export const activityMeta: Record<
  SessionActivity['kind'],
  { label: string; verb: string }
> = {
  learn: { label: 'Learn', verb: 'Lesson' },
  read: { label: 'Read', verb: 'Reading' },
  practice: { label: 'Practice', verb: 'Exercise' },
  check: { label: 'Check', verb: 'Assessment' },
}

/** Build the four activities of a section session from its content. */
export function getSessionActivities(
  pathId: string,
  sectionId: string,
  content: SessionContent,
): SessionActivity[] {
  const base = `${pathId}|${sectionId}`
  const resources = contentResources(content)
  const readTitle =
    resources.length > 1
      ? `${resources[0].title} · +${resources.length - 1} more`
      : (resources[0]?.title ?? 'Resources')
  const readMinutes = resources.reduce((sum, r) => sum + r.minutes, 0)
  return [
    { id: `${base}|learn`, kind: 'learn', title: content.lesson.title, minutes: content.lesson.minutes },
    { id: `${base}|read`, kind: 'read', title: readTitle, minutes: readMinutes },
    { id: `${base}|practice`, kind: 'practice', title: content.practice.title, minutes: content.practice.minutes },
    { id: `${base}|check`, kind: 'check', title: content.assessment.title, minutes: content.assessment.minutes },
  ]
}

/**
 * Every resource of a session as an array. Older cached rows carry a single
 * legacy `resource` instead of `resources` — both shapes read the same way.
 */
export function contentResources(content: SessionContent): Resource[] {
  if (content.resources?.length) return content.resources
  if (content.resource) return [content.resource]
  return []
}

/** True when every resource of the session is a video (watch vs. read label). */
export function contentIsAllVideo(content: SessionContent): boolean {
  const resources = contentResources(content)
  return resources.length > 0 && resources.every((r) => r.kind === 'video')
}

export function pathPercent(path: LearningPath): number {
  const total = path.sections.reduce((sum, s) => sum + s.minutes, 0)
  const done = path.sections.reduce((sum, s) => sum + Math.min(s.doneMinutes, s.minutes), 0)
  if (total === 0) return 0
  return Math.floor((done / total) * 100)
}

export function pathMinutesLeft(path: LearningPath): number {
  return path.sections.reduce(
    (sum, s) => sum + Math.max(0, s.minutes - Math.min(s.doneMinutes, s.minutes)),
    0,
  )
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hours`
  return `${h}h ${m}m`
}

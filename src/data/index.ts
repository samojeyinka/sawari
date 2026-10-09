import type { LearningPath, PathSection, SessionActivity, SessionContent } from '../types'
import { pmSessions } from './content-pm'
import { miscSessions } from './content-misc'

export { mockUser, mockNotifications, mockSettings } from './user'
export { mockProjects } from './projects'
export { mockMilestones, mockRecent } from './progress'
export { mockLearningPaths } from './paths'
export {
  sectionsForSubject,
  findTemplateMatch,
  buildGeneratedSession,
  preferredFormats,
} from './templates'

/* All session content in one registry, keyed by section id. */
export const baseSessionContent: Record<string, SessionContent> = {
  ...pmSessions,
  ...miscSessions,
}

/**
 * Resolve session content for a section. Generated paths add their content
 * at creation time through the store, so this merges both sources.
 */
export function getSessionContent(
  sectionId: string,
  custom?: Record<string, SessionContent>,
): SessionContent | null {
  return custom?.[sectionId] ?? baseSessionContent[sectionId] ?? null
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
  return [
    { id: `${base}|learn`, kind: 'learn', title: content.lesson.title, minutes: content.lesson.minutes },
    { id: `${base}|read`, kind: 'read', title: content.resource.title, minutes: content.resource.minutes },
    { id: `${base}|practice`, kind: 'practice', title: content.practice.title, minutes: content.practice.minutes },
    { id: `${base}|check`, kind: 'check', title: content.assessment.title, minutes: content.assessment.minutes },
  ]
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

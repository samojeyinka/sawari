/* ------------------------------------------------------------------ */
/*  Section gating. One place decides what "attend" means:               */
/*  - attendable: the current section or an already finished one.        */
/*    Activities can be completed and progress is tracked.               */
/*  - preview: everything else. The full session is viewable so learners */
/*    know what is ahead, but nothing can be completed until the earlier */
/*    sections are done.                                                 */
/*                                                                       */
/*  advanceSections() keeps statuses honest: finishing a section moves   */
/*  the next unfinished one to `current`. It is idempotent, so it is     */
/*  safe to run on load and after every completion.                      */
/* ------------------------------------------------------------------ */

import type { ActivityKind, LearningPath, PathSection, SectionStatus } from '../types'

const ALL_KINDS: ActivityKind[] = ['learn', 'read', 'practice', 'check']

const activityKey = (pathId: string, sectionId: string, kind: ActivityKind) =>
  `${pathId}|${sectionId}|${kind}`

function orderedSections(path: LearningPath): PathSection[] {
  return [...path.sections].sort((a, b) => a.order - b.order)
}

/** Every activity of the section is marked done (or it is flagged complete). */
export function isSectionComplete(path: LearningPath, sectionId: string): boolean {
  const section = path.sections.find((s) => s.id === sectionId)
  if (!section) return false
  if (section.status === 'completed') return true
  return ALL_KINDS.every((k) => path.completedActivities.includes(activityKey(path.id, sectionId, k)))
}

/** True when activities in this section may be completed (tracked progress). */
export function isSectionAttendable(path: LearningPath, sectionId: string): boolean {
  const section = path.sections.find((s) => s.id === sectionId)
  return section?.status === 'current' || section?.status === 'completed'
}

/** Earliest unfinished section before the given one — what blocks its preview. */
export function firstIncompleteBefore(path: LearningPath, sectionId: string): PathSection | null {
  const ordered = orderedSections(path)
  const index = ordered.findIndex((s) => s.id === sectionId)
  if (index <= 0) return null
  return ordered.slice(0, index).find((s) => !isSectionComplete(path, s.id)) ?? null
}

/**
 * Finished sections read `completed`, the first unfinished one is `current`,
 * the next is `upcoming`, the rest are `locked`. Returns the same object
 * when nothing changes so callers keep cheap referential equality.
 */
export function advanceSections(path: LearningPath): LearningPath {
  const ordered = orderedSections(path)
  if (ordered.length === 0) return path

  const doneFlags = ordered.map((s) => isSectionComplete(path, s.id))
  const firstOpen = doneFlags.findIndex((done) => !done)
  const current = firstOpen >= 0 ? ordered[firstOpen] : ordered[ordered.length - 1]

  let changed = path.currentSectionId !== current.id
  const sections = ordered.map((section, i) => {
    const done = doneFlags[i]
    let nextStatus: SectionStatus
    if (done) {
      nextStatus = 'completed'
    } else if (i === firstOpen) {
      nextStatus = 'current'
    } else if (i === firstOpen + 1) {
      nextStatus = 'upcoming'
    } else {
      nextStatus = 'locked'
    }

    let note = section.note
    if (nextStatus === 'upcoming' || nextStatus === 'locked') {
      const prev = ordered[i - 1]
      const expected =
        nextStatus === 'upcoming'
          ? `Starts after ${prev?.title ?? 'the current section'}.`
          : `Unlocks after ${prev?.title ?? 'the previous sections'}.`
      if (note !== expected) note = expected
    }

    if (section.status !== nextStatus || section.note !== note) {
      changed = true
      return { ...section, status: nextStatus, note }
    }
    return section
  })

  // Keep the stored order untouched when nothing changed.
  if (!changed) return path
  return { ...path, sections, currentSectionId: current.id }
}

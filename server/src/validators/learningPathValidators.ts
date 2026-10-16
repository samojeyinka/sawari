import { z } from 'zod'
import {
  EXPERIENCE_LEVELS,
  GOAL_REASONS,
  INTENSITIES,
  LEARNING_FORMATS,
  SECTION_STATUSES,
  WEEKLY_HOURS,
} from '../domain/index.js'
import { isoDate, listQuerySchema } from './common.js'
export const sectionSchema = z.strictObject({
  id: z.string().min(1).max(60),
  order: z.number().int().min(0),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000).default(''),
  minutes: z.number().int().min(0).default(0),
  status: z.enum(SECTION_STATUSES),
  doneMinutes: z.number().int().min(0).default(0),
  note: z.string().max(1000).optional(),
})

export const statsSchema = z.strictObject({
  sessionsCompleted: z.number().int().min(0).optional(),
  minutesLearned: z.number().int().min(0).optional(),
  topicsExplored: z.number().int().min(0).optional(),
  projectsCompleted: z.number().int().min(0).optional(),
  week: z.array(z.number().int().min(0)).max(7).optional(),
})

export const assessmentResultSchema = z.strictObject({
  score: z.number().min(0),
  total: z.number().min(0),
  date: isoDate,
  firstAttempt: z.boolean().default(true),
})

/** Fields the client supplies when creating a path (setup answers). */
export const createLearningPathSchema = z.strictObject({
  subject: z.string().trim().min(1).max(120),
  goal: z.string().max(500).default(''),
  experience: z.enum(EXPERIENCE_LEVELS).nullable().default(null),
  reason: z.enum(GOAL_REASONS).nullable().default(null),
  weeklyHours: z.enum(WEEKLY_HOURS),
  intensity: z.enum(INTENSITIES),
  formats: z.array(z.enum(LEARNING_FORMATS)).max(6).default([]),
  targetDate: isoDate.nullable().default(null),
  sections: z.array(sectionSchema).max(50).optional(),
})

/** Everything the client may change afterwards (progress + plan tuning). */
export const updateLearningPathSchema = z.strictObject({
  subject: z.string().trim().min(1).max(120).optional(),
  goal: z.string().max(500).optional(),
  experience: z.enum(EXPERIENCE_LEVELS).nullable().optional(),
  reason: z.enum(GOAL_REASONS).nullable().optional(),
  weeklyHours: z.enum(WEEKLY_HOURS).optional(),
  intensity: z.enum(INTENSITIES).optional(),
  formats: z.array(z.enum(LEARNING_FORMATS)).max(6).optional(),
  targetDate: isoDate.nullable().optional(),
  sections: z.array(sectionSchema).max(50).optional(),
  stats: statsSchema.optional(),
  currentSectionId: z.string().max(60).nullable().optional(),
  completedActivities: z.array(z.string().max(80)).max(2000).optional(),
  countedSessions: z.array(z.string().max(80)).max(500).optional(),
  assessmentResults: z
    .record(z.string().max(80), assessmentResultSchema)
    .refine((value) => Object.keys(value).length <= 200, 'Too many assessment results.')
    .optional(),
  adaptationNote: z.string().max(2000).nullable().optional(),
})

export const listLearningPathsQuery = listQuerySchema({
  subject: z.string().trim().max(120).optional(),
})

/** Query for AI session generation: `?regenerate=true` bypasses the cache. */
export const sessionQuerySchema = z.object({
  regenerate: z.enum(['true', 'false']).optional(),
})

/** Setup goal extraction: turn a niche/build line into subject + skills. */
export const extractGoalValidator = z.strictObject({
  mode: z.enum(['admire', 'build']),
  input: z.string().trim().min(3).max(500),
})

export type ExtractGoalInput = z.infer<typeof extractGoalValidator>

/** Setup admire search: find people matching a name or short description. */
export const admireSearchValidator = z.strictObject({
  query: z.string().trim().min(3).max(200),
})

export type AdmireSearchInput = z.infer<typeof admireSearchValidator>

export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>
export type UpdateLearningPathInput = z.infer<typeof updateLearningPathSchema>

export const timelineEstimateValidator = z.strictObject({
  subject: z.string().trim().min(1).max(120),
  outcome: z.string().max(500).optional(),
  experience: z.enum(EXPERIENCE_LEVELS).nullable().optional(),
  weeklyHours: z.enum(WEEKLY_HOURS).optional(),
  intensity: z.enum(INTENSITIES).optional(),
})

export type TimelineEstimateInput = z.infer<typeof timelineEstimateValidator>

export const reviewPracticeValidator = z.strictObject({
  prompt: z.string().trim().min(3).max(1000),
  userAnswer: z.string().trim().min(2).max(4000),
  modelAnswer: z.string().max(4000).optional(),
  topic: z.string().max(200).optional(),
})

export type ReviewPracticeInput = z.infer<typeof reviewPracticeValidator>
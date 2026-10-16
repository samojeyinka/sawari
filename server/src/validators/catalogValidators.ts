import { z } from 'zod'
import {
  EXPERIENCE_LEVELS,
  INTENSITIES,
  LEARNING_FORMATS,
  WEEKLY_HOURS,
} from '../domain/index.js'
import { listQuerySchema } from './common.js'

/* ------------------------------------------------------------------ */
/*  Validators for admin-authored catalog paths. Content mirrors the   */
/*  SessionContent shape (lesson, resources, practice, assessment) so   */
/*  an enrolled copy drops straight into the existing session UI.       */
/* ------------------------------------------------------------------ */

const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: z.string().min(1).max(4000) }),
  z.object({ type: z.literal('h'), text: z.string().min(1).max(300) }),
  z.object({ type: z.literal('list'), items: z.array(z.string().min(1).max(500)).min(1) }),
  z.object({ type: z.literal('steps'), items: z.array(z.string().min(1).max(500)).min(1) }),
  z.object({ type: z.literal('note'), title: z.string().min(1).max(200), text: z.string().min(1).max(2000) }),
])

const lessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  minutes: z.number().int().min(1).max(600),
  intro: z.string().trim().min(1).max(2000),
  blocks: z.array(blockSchema).min(1).max(40),
})

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  kind: z.enum(['article', 'video', 'book', 'template']),
  source: z.string().trim().min(1).max(200),
  minutes: z.number().int().min(1).max(600),
  summary: z.string().trim().min(1).max(600),
  body: z.array(z.string().min(1).max(1000)).min(1).max(20),
  url: z.string().url().max(2000).nullish(),
})

const practiceItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  detail: z.string().max(400).optional(),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  feedback: z.string().trim().min(1).max(600),
})

const practiceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('written'),
    title: z.string().trim().min(1).max(200),
    minutes: z.number().int().min(1).max(600),
    brief: z.string().trim().min(1).max(2000),
    prompt: z.string().trim().min(1).max(2000),
    modelAnswer: z.string().trim().min(1).max(4000),
  }),
  z.object({
    kind: z.literal('classify'),
    title: z.string().trim().min(1).max(200),
    minutes: z.number().int().min(1).max(600),
    brief: z.string().trim().min(1).max(2000),
    items: z.array(practiceItemSchema).min(1).max(20),
  }),
])

const questionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(2000),
    choices: z.array(z.string().min(1).max(500)).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
    explanation: z.string().trim().min(1).max(2000),
  })
  .refine((q) => q.correctIndex < q.choices.length, {
    message: 'correctIndex must point at one of the choices.',
    path: ['correctIndex'],
  })

const assessmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  intro: z.string().trim().min(1).max(2000),
  minutes: z.number().int().min(1).max(600),
  topic: z.string().trim().min(1).max(120).optional(),
  reviewTopic: z.string().trim().min(1).max(120).optional(),
  questions: z.array(questionSchema).min(1).max(20),
})

/** A full authored session for one catalog section. */
export const catalogContentSchema = z.object({
  lesson: lessonSchema,
  resources: z.array(resourceSchema).min(1).max(20),
  practice: practiceSchema,
  assessment: assessmentSchema,
})

export const catalogSectionSchema = z.object({
  /** Stable section id. Send it back when editing so threads/progress that
      are anchored to a section survive the edit; omit it for new sections. */
  id: z.string().trim().max(60).optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1000).default(''),
  minutes: z.number().int().min(0).max(1440).default(0),
  content: catalogContentSchema,
})

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by single dashes.')

const catalogFields = {
  slug: slugSchema.optional(),
  subject: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(300).default(''),
  goal: z.string().trim().max(500).default(''),
  level: z.enum(EXPERIENCE_LEVELS).nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  weeklyHours: z.enum(WEEKLY_HOURS).default('5'),
  intensity: z.enum(INTENSITIES).default('balanced'),
  formats: z.array(z.enum(LEARNING_FORMATS)).max(6).default([]),
  expectedWeeks: z.number().int().min(0).max(260).default(0),
  expectedHours: z.number().int().min(0).max(5000).default(0),
  ogImage: z.string().url().max(2000).nullable().default(null),
  sections: z.array(catalogSectionSchema).min(1).max(50),
  published: z.boolean().default(false),
} as const

export const createCatalogPathSchema = z.strictObject(catalogFields)

/** Every field is optional on update; at least one must be present. */
export const updateCatalogPathSchema = z
  .strictObject({
    slug: slugSchema.optional(),
    subject: catalogFields.subject.optional(),
    summary: catalogFields.summary.optional(),
    goal: catalogFields.goal.optional(),
    level: catalogFields.level.optional(),
    tags: catalogFields.tags.optional(),
    weeklyHours: catalogFields.weeklyHours.optional(),
    intensity: catalogFields.intensity.optional(),
    formats: catalogFields.formats.optional(),
    expectedWeeks: catalogFields.expectedWeeks.optional(),
    expectedHours: catalogFields.expectedHours.optional(),
    ogImage: catalogFields.ogImage.optional(),
    sections: catalogFields.sections.optional(),
    published: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const createReviewSchema = z.strictObject({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(2000).default(''),
})

/** Public catalog list query: pagination plus search/filter. */
export const listCatalogQuery = listQuerySchema({
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(40).optional(),
  level: z.enum(EXPERIENCE_LEVELS).optional(),
})

export const catalogSlugParam = z.object({
  slug: z.string().trim().min(1).max(120),
})

export type CreateCatalogPathInput = z.infer<typeof createCatalogPathSchema>
export type UpdateCatalogPathInput = z.infer<typeof updateCatalogPathSchema>
export type CatalogSectionInput = z.infer<typeof catalogSectionSchema>
export type CatalogContentInput = z.infer<typeof catalogContentSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>

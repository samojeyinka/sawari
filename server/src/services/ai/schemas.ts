import { z } from 'zod'

/* ------------------------------------------------------------------ */
/*  Runtime schemas for model output. The model is instructed to emit  */
/*  exact JSON, but we never trust it: everything is validated here    */
/*  before it reaches the database or the client.                      */
/* ------------------------------------------------------------------ */

/* ------------------------------ outline --------------------------- */

export const outlineSectionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(400),
  minutes: z.coerce.number().int().min(60).max(720),
})

export const outlineResponseSchema = z.object({
  sections: z.array(outlineSectionSchema).min(3).max(8),
})

export type OutlineResponse = z.infer<typeof outlineResponseSchema>

/* ------------------------------ session --------------------------- */

const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), text: z.string().min(1) }),
  z.object({ type: z.literal('h'), text: z.string().min(1) }),
  z.object({ type: z.literal('list'), items: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal('steps'), items: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal('note'), title: z.string().min(1), text: z.string().min(1) }),
])

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.enum(['article', 'video', 'book', 'template']),
  source: z.string().min(1).max(200),
  minutes: z.coerce.number().int().min(1).max(600),
  summary: z.string().min(1).max(600),
  body: z.array(z.string().min(1)).min(1),
  url: z.string().url().nullish().or(z.literal('')).transform((v) => v || undefined),
})

/** One session carries 1-3 resources (e.g. two videos + one article). */
export const resourcesSchema = z.array(resourceSchema).min(1).max(3)

/* --------------------------- goal extraction ---------------------- */

export const goalExtractionResponseSchema = z.object({
  subject: z.string().trim().min(2).max(60),
  outcome: z.string().trim().min(5).max(200),
  skills: z.array(z.string().trim().min(2).max(60)).min(4).max(8),
  label: z.string().trim().min(1).max(80),
  note: z.string().trim().min(1).max(160),
})

export type GoalExtractionResponse = z.infer<typeof goalExtractionResponseSchema>

/* --------------------------- admire search ------------------------ */

export const admireCandidateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().min(2).max(120),
  blurb: z.string().trim().min(5).max(240),
  subject: z.string().trim().min(2).max(60),
  skills: z.array(z.string().trim().min(2).max(60)).min(4).max(8),
})

export const admireCandidatesResponseSchema = z.object({
  candidates: z.array(admireCandidateSchema).min(3).max(6),
})

export type AdmireCandidatesResponse = z.infer<typeof admireCandidatesResponseSchema>

/* --------------------------- project review ----------------------- */

export const projectReviewResponseSchema = z.object({
  strengths: z.array(z.string().min(3).max(500)).min(1).max(6),
  improve: z.array(z.string().min(3).max(500)).min(1).max(6),
  note: z.string().min(3).max(1000),
})

export type ProjectReviewResponse = z.infer<typeof projectReviewResponseSchema>

/* ------------------------------ timeline -------------------------- */

export const aiTimelineResponseSchema = z.object({
  recommendedMonths: z.coerce.number().int().min(1).max(24),
  fastMonths: z.coerce.number().int().min(1).max(24),
  relaxedMonths: z.coerce.number().int().min(1).max(36),
  reason: z.string().min(5).max(400),
})

export type AiTimelineResponse = z.infer<typeof aiTimelineResponseSchema>

/* ------------------------------ practice review ------------------- */

export const practiceReviewResponseSchema = z.object({
  status: z.enum(['correct', 'close', 'needs_improvement']),
  acceptable: z.boolean(),
  score: z.coerce.number().int().min(0).max(100),
  feedback: z.string().min(3).max(1000),
  improvements: z.string().min(3).max(1000),
})

export type PracticeReviewResponse = z.infer<typeof practiceReviewResponseSchema>


const practiceItemSchema = z.object({
  label: z.string().min(1).max(200),
  detail: z.string().max(400).optional(),
  options: z.array(z.string().min(1)).min(3).max(4),
  correctIndex: z.coerce.number().int().min(0),
  feedback: z.string().min(1).max(600),
})

const practiceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('written'),
    title: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(600),
    brief: z.string().min(1),
    prompt: z.string().min(1),
    modelAnswer: z.string().min(1),
  }),
  z.object({
    kind: z.literal('classify'),
    title: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(600),
    brief: z.string().min(1),
    items: z.array(practiceItemSchema).min(1),
  }),
])

const questionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).length(4),
  correctIndex: z.coerce.number().int().min(0).max(3),
  explanation: z.string().min(1),
})

export const sessionResponseSchema = z.object({
  lesson: z.object({
    title: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(600),
    intro: z.string().min(1),
    blocks: z.array(blockSchema).min(1).max(12),
  }),
  resources: resourcesSchema,
  practice: practiceSchema,
  assessment: z.object({
    title: z.string().min(1),
    intro: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(600),
    topic: z.string().min(1).max(120).optional(),
    reviewTopic: z.string().min(1).max(120).optional(),
    questions: z.array(questionSchema).min(1).max(6),
  }),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
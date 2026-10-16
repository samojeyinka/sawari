import type { z } from 'zod'
import type { Practice, SessionContent } from '../../models/SessionContent.js'
import { AiRequestError, chatCompletion, type ChatMessage } from './deepseek.js'
import {
  contentMessages,
  goalExtractMessages,
  admireSearchMessages,
  outlineMessages,
  practiceReviewMessages,
  projectReviewMessages,
  timelineMessages,
  type BriefSection,
  type GoalExtractionMode,
  type LearnerBrief,
  type PracticeReviewParams,
  type ProjectReviewParams,
  type SessionGenContext,
  type TimelinePromptParams,
} from './prompts.js'
import {
  admireCandidatesResponseSchema,
  aiTimelineResponseSchema,
  goalExtractionResponseSchema,
  outlineResponseSchema,
  practiceReviewResponseSchema,
  projectReviewResponseSchema,
  sessionResponseSchema,
  type AdmireCandidatesResponse,
  type AiTimelineResponse,
  type GoalExtractionResponse,
  type PracticeReviewResponse,
  type ProjectReviewResponse,
  type SessionResponse,
} from './schemas.js'

/* ------------------------------------------------------------------ */
/*  High-level AI generation. Validates model output and shapes it     */
/*  into the app's own types (stable ids included).                    */
/* ------------------------------------------------------------------ */

/** A path section as the model describes it (no ids — the caller assigns them). */
export interface GeneratedSection {
  order: number
  title: string
  description: string
  minutes: number
}

function tryParseAndValidate<T>(
  text: string,
  schema: z.ZodType<T>,
): { success: true; data: T } | { success: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { success: false, error: 'Malformed JSON output' }
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
    return { success: false, error: `Schema validation failed (${issues})` }
  }

  return { success: true, data: result.data }
}

/**
 * Executes a structured chat completion against DeepSeek and validates it.
 * If the output is invalid JSON or violates the Zod schema, it retries once
 * with an assistant+user repair turn before failing.
 */
export async function generateValidated<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: { maxTokens?: number; temperature?: number; thinking?: boolean; apiKey?: string } = {},
): Promise<T> {
  let content = await chatCompletion(messages, options)
  let evaluated = tryParseAndValidate(content, schema)
  if (evaluated.success) return evaluated.data

  const repairMessages: ChatMessage[] = [
    ...messages,
    { role: 'assistant', content },
    {
      role: 'user',
      content: `The response did not meet the required schema: ${evaluated.error}. Return ONLY the corrected valid JSON matching the exact schema specified in the instructions.`,
    },
  ]

  content = await chatCompletion(repairMessages, options)
  evaluated = tryParseAndValidate(content, schema)
  if (evaluated.success) return evaluated.data

  throw new AiRequestError(`The model returned invalid data: ${evaluated.error}`)
}

export async function generateOutline(learner: LearnerBrief, apiKey?: string): Promise<GeneratedSection[]> {
  const parsed = await generateValidated(outlineMessages(learner), outlineResponseSchema, { apiKey })
  return parsed.sections.map((section, index) => ({
    order: index + 1,
    title: section.title,
    description: section.description,
    minutes: section.minutes,
  }))
}

function toPractice(practice: SessionResponse['practice'], sectionId: string): Practice {
  const base = `${sectionId}-prc`
  if (practice.kind === 'classify') {
    return {
      id: base,
      kind: 'classify',
      title: practice.title,
      minutes: practice.minutes,
      brief: practice.brief,
      items: practice.items.map((item, index) => ({
        id: `${sectionId}-pi${index + 1}`,
        label: item.label,
        detail: item.detail,
        options: item.options,
        correctIndex: Math.min(item.correctIndex, item.options.length - 1),
        feedback: item.feedback,
      })),
    }
  }
  return {
    id: base,
    kind: 'written',
    title: practice.title,
    minutes: practice.minutes,
    brief: practice.brief,
    prompt: practice.prompt,
    modelAnswer: practice.modelAnswer,
  }
}

export async function generateSessionContent(
  learner: LearnerBrief,
  section: BriefSection,
  sectionId: string,
  context?: SessionGenContext,
  apiKey?: string,
): Promise<SessionContent> {
  const parsed = await generateValidated(
    contentMessages(learner, section, context),
    sessionResponseSchema,
    { maxTokens: 8192, apiKey },
  )
  const { lesson, resources, practice, assessment } = parsed

  return {
    lesson: {
      id: `${sectionId}-lsn`,
      title: lesson.title,
      minutes: lesson.minutes,
      intro: lesson.intro,
      blocks: lesson.blocks,
    },
    resources: resources.map((resource, index) => ({
      id: `${sectionId}-res${index + 1}`,
      ...resource,
    })),
    practice: toPractice(practice, sectionId),
    assessment: {
      id: `${sectionId}-asm`,
      title: assessment.title,
      intro: assessment.intro,
      minutes: assessment.minutes,
      topic: assessment.topic,
      reviewTopic: assessment.reviewTopic,
      questions: assessment.questions.map((question, index) => ({
        id: `${sectionId}-q${index + 1}`,
        ...question,
      })),
    },
  }
}

export async function extractGoal(
  mode: GoalExtractionMode,
  input: string,
  apiKey?: string,
): Promise<GoalExtractionResponse> {
  return generateValidated(
    goalExtractMessages(mode, input),
    goalExtractionResponseSchema,
    { maxTokens: 1024, thinking: false, temperature: 0.4, apiKey },
  )
}

/** Suggests real people matching an admirer description, closest match first. */
export async function searchAdmireCandidates(
  query: string,
  apiKey?: string,
): Promise<AdmireCandidatesResponse> {
  return generateValidated(
    admireSearchMessages(query),
    admireCandidatesResponseSchema,
    { maxTokens: 2048, thinking: false, temperature: 0.6, apiKey },
  )
}

export async function reviewProjectSubmission(
  params: ProjectReviewParams,
  apiKey?: string,
): Promise<ProjectReviewResponse> {
  return generateValidated(
    projectReviewMessages(params),
    projectReviewResponseSchema,
    { maxTokens: 1200, thinking: false, temperature: 0.4, apiKey },
  )
}

export async function estimateTimeline(
  params: TimelinePromptParams,
  apiKey?: string,
): Promise<AiTimelineResponse> {
  try {
    return await generateValidated(
      timelineMessages(params),
      aiTimelineResponseSchema,
      { maxTokens: 512, thinking: false, temperature: 0.3, apiKey },
    )
  } catch {
    // Graceful fallback heuristic if AI is unreachable or fails
    const hours = params.weeklyHours === '15+' ? 15 : Number(params.weeklyHours || 5)
    const baseMonths = Math.max(1, Math.round(48 / (hours * 3.5)))
    return {
      recommendedMonths: baseMonths,
      fastMonths: Math.max(1, Math.round(baseMonths * 0.7)),
      relaxedMonths: Math.max(baseMonths + 1, Math.round(baseMonths * 1.5)),
      reason: `At ${hours} hours/week, steady progress typically covers core ${params.subject} skills in about ${baseMonths} months.`,
    }
  }
}

export async function reviewPractice(
  params: PracticeReviewParams,
  apiKey?: string,
): Promise<PracticeReviewResponse> {
  return await generateValidated(
    practiceReviewMessages(params),
    practiceReviewResponseSchema,
    { maxTokens: 600, thinking: false, temperature: 0.2, apiKey },
  )
}
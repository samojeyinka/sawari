import { z } from 'zod'
import {
  EXPERIENCE_LEVELS,
  INTENSITIES,
  LEARNING_FORMATS,
  WEEKLY_HOURS,
  type ExperienceLevel,
  type Intensity,
  type LearningFormat,
  type WeeklyHours,
} from '../src/domain/index.js'
import type { LessonBlock } from '../src/models/SessionContent.js'
import {
  createCatalogPathSchema,
  type CatalogContentInput,
  type CatalogSectionInput,
  type CreateCatalogPathInput,
} from '../src/validators/catalogValidators.js'

/* ------------------------------------------------------------------ */
/*  Catalog Content Factory                                            */
/*  Compact, reusable builders for authoring validated catalog courses */
/* ------------------------------------------------------------------ */

export interface VideoInput {
  title: string
  source: string
  url: string
  minutes: number
  summary: string
  notes?: string[] | string
}

export interface ArticleInput {
  title: string
  source: string
  url?: string | null
  minutes: number
  summary: string
  notes?: string[] | string
  kind?: 'article' | 'template' | 'book'
}

export interface LessonInput {
  title: string
  minutes: number
  intro: string
  blocks: LessonBlock[]
}

export interface ClassifyItemInput {
  label: string
  detail?: string
  options: string[]
  correctIndex: number
  feedback: string
}

export interface ClassifyPracticeInput {
  title?: string
  minutes?: number
  brief: string
  items: ClassifyItemInput[]
}

export interface WrittenPracticeInput {
  title?: string
  minutes?: number
  brief: string
  prompt: string
  modelAnswer: string
}

export interface QuestionInput {
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface AssessmentInput {
  title: string
  intro?: string
  minutes?: number
  topic?: string
  reviewTopic?: string
  questions: QuestionInput[]
}

export interface SessionBuilderInput {
  id?: string
  title: string
  description?: string
  minutes?: number
  lesson: LessonInput
  resources: Array<ReturnType<typeof video> | ReturnType<typeof article>>
  practice: ReturnType<typeof classifyPractice> | ReturnType<typeof writtenPractice>
  assessment: ReturnType<typeof assessment>
}

export interface CourseBuilderInput {
  slug: string
  subject: string
  summary: string
  goal: string
  level: ExperienceLevel
  tags: string[]
  weeklyHours?: WeeklyHours
  intensity?: Intensity
  formats?: LearningFormat[]
  expectedWeeks?: number
  expectedHours?: number
  ogImage?: string | null
  published?: boolean
  sessions: SessionBuilderInput[]
}

/* ----------------------------- builders --------------------------- */

function normalizeNotes(notes: string[] | string | undefined, fallback: string): string[] {
  if (Array.isArray(notes)) {
    return notes.length > 0 ? notes : [fallback]
  }
  if (typeof notes === 'string' && notes.trim().length > 0) {
    return [notes.trim()]
  }
  return [fallback]
}

export function video(input: VideoInput) {
  return {
    title: input.title.trim(),
    kind: 'video' as const,
    source: input.source.trim(),
    minutes: Math.max(1, Math.round(input.minutes)),
    summary: input.summary.trim(),
    body: normalizeNotes(input.notes, input.summary.trim()),
    url: input.url.trim(),
  }
}

export function article(input: ArticleInput) {
  return {
    title: input.title.trim(),
    kind: input.kind ?? ('article' as const),
    source: input.source.trim(),
    minutes: Math.max(1, Math.round(input.minutes)),
    summary: input.summary.trim(),
    body: normalizeNotes(input.notes, input.summary.trim()),
    url: input.url ? input.url.trim() : undefined,
  }
}

export function template(input: Omit<ArticleInput, 'kind'>) {
  return article({ ...input, kind: 'template' })
}

export function lesson(input: LessonInput): LessonInput {
  return {
    title: input.title.trim(),
    minutes: Math.max(1, Math.round(input.minutes)),
    intro: input.intro.trim(),
    blocks: input.blocks,
  }
}

/* Helper block constructors for concise authoring */
export const p = (text: string): LessonBlock => ({ type: 'p', text: text.trim() })
export const h = (text: string): LessonBlock => ({ type: 'h', text: text.trim() })
export const list = (items: string[]): LessonBlock => ({
  type: 'list',
  items: items.map((i) => i.trim()),
})
export const steps = (items: string[]): LessonBlock => ({
  type: 'steps',
  items: items.map((i) => i.trim()),
})
export const note = (title: string, text: string): LessonBlock => ({
  type: 'note',
  title: title.trim(),
  text: text.trim(),
})

export function classifyPractice(
  briefOrInput: string | ClassifyPracticeInput,
  items?: ClassifyItemInput[],
  minutes = 10,
  title = 'Check your understanding',
) {
  if (typeof briefOrInput === 'object' && briefOrInput !== null) {
    return {
      kind: 'classify' as const,
      title: briefOrInput.title?.trim() ?? title,
      minutes: Math.max(1, Math.round(briefOrInput.minutes ?? minutes)),
      brief: briefOrInput.brief.trim(),
      items: briefOrInput.items.map((it) => ({
        label: it.label.trim(),
        detail: it.detail?.trim(),
        options: it.options.map((opt) => opt.trim()),
        correctIndex: it.correctIndex,
        feedback: it.feedback.trim(),
      })),
    }
  }

  return {
    kind: 'classify' as const,
    title: title.trim(),
    minutes: Math.max(1, Math.round(minutes)),
    brief: briefOrInput.trim(),
    items: (items ?? []).map((it) => ({
      label: it.label.trim(),
      detail: it.detail?.trim(),
      options: it.options.map((opt) => opt.trim()),
      correctIndex: it.correctIndex,
      feedback: it.feedback.trim(),
    })),
  }
}

export function writtenPractice(
  promptOrInput: string | WrittenPracticeInput,
  modelAnswer?: string,
  brief = 'Apply what you learned in writing.',
  minutes = 12,
  title = 'Written practice',
) {
  if (typeof promptOrInput === 'object' && promptOrInput !== null) {
    return {
      kind: 'written' as const,
      title: promptOrInput.title?.trim() ?? title,
      minutes: Math.max(1, Math.round(promptOrInput.minutes ?? minutes)),
      brief: promptOrInput.brief.trim(),
      prompt: promptOrInput.prompt.trim(),
      modelAnswer: promptOrInput.modelAnswer.trim(),
    }
  }

  return {
    kind: 'written' as const,
    title: title.trim(),
    minutes: Math.max(1, Math.round(minutes)),
    brief: brief.trim(),
    prompt: promptOrInput.trim(),
    modelAnswer: (modelAnswer ?? '').trim(),
  }
}

export function assessment(input: AssessmentInput) {
  return {
    title: input.title.trim(),
    intro: input.intro?.trim() ?? 'Answer each question to check your understanding of this session.',
    minutes: Math.max(1, Math.round(input.minutes ?? 8)),
    topic: input.topic?.trim() ?? input.title.trim(),
    reviewTopic: input.reviewTopic?.trim(),
    questions: input.questions.map((q) => ({
      prompt: q.prompt.trim(),
      choices: q.choices.map((c) => c.trim()),
      correctIndex: q.correctIndex,
      explanation: q.explanation.trim(),
    })),
  }
}

export function session(input: SessionBuilderInput) {
  const lessonMinutes = input.lesson.minutes
  const resourceMinutes = input.resources.reduce((sum, r) => sum + r.minutes, 0)
  const practiceMinutes = input.practice.minutes
  const assessmentMinutes = input.assessment.minutes
  const totalMinutes =
    input.minutes ?? lessonMinutes + resourceMinutes + practiceMinutes + assessmentMinutes

  return {
    id: input.id,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    minutes: totalMinutes,
    lesson: input.lesson,
    resources: input.resources,
    practice: input.practice,
    assessment: input.assessment,
  }
}

/* ----------------------------- linter ----------------------------- */

/**
 * Strict content rules:
 * - Plain, warm, direct voice. Talk to one learner as "you".
 * - No AI tells ("delve", "dive into", "in today's fast paced world", "unlock",
 *   "elevate", "it is not just X it is Y", "game changer", "seamless",
 *   "robust", "leverage", "in conclusion").
 * - Punctuation rules:
 *   - Never use hyphen as connector in prose (use words instead).
 *   - Never use em dashes or en dashes.
 *   - Never use double hyphens.
 *   - Never use semicolons.
 *   - No emoji anywhere.
 */
export function lintCopy(text: string, context: string): string[] {
  const issues: string[] = []

  // Banned AI tells
  const aiTells = [
    { regex: /\bdelve(s|d|r|ing)?\b/i, name: 'delve' },
    { regex: /\bdive into\b/i, name: 'dive into' },
    { regex: /\bin today'?s fast[- ]paced world\b/i, name: "in today's fast paced world" },
    { regex: /\bunlock(s|ed|ing)?\b/i, name: 'unlock' },
    { regex: /\belevate(s|d|ing)?\b/i, name: 'elevate' },
    { regex: /\bit('?s| is) not (just|only) [^.]+ it('?s| is)\b/i, name: 'it is not just X it is Y' },
    { regex: /\bgame[- ]changer\b/i, name: 'game changer' },
    { regex: /\bseamless(ly)?\b/i, name: 'seamless' },
    { regex: /\brobust(ly)?\b/i, name: 'robust' },
    { regex: /\bleverage(s|d|ing)?\b/i, name: 'leverage' },
    { regex: /\bin conclusion\b/i, name: 'in conclusion' },
  ]

  for (const tell of aiTells) {
    if (tell.regex.test(text)) {
      issues.push(`[${context}] AI tell detected: "${tell.name}"`)
    }
  }

  // Em dash (—)
  if (text.includes('—') || text.includes('\u2014')) {
    issues.push(`[${context}] Em dash (—) found. Never use em dashes.`)
  }

  // En dash (–)
  if (text.includes('–') || text.includes('\u2013')) {
    issues.push(`[${context}] En dash (–) found. Never use en dashes.`)
  }

  // Double hyphen (--)
  if (text.includes('--')) {
    issues.push(`[${context}] Double hyphen (--) found.`)
  }

  // Semicolon (;)
  if (text.includes(';')) {
    issues.push(`[${context}] Semicolon (;) found. Never use semicolons.`)
  }

  // Hyphen used as connector in prose: e.g. "word - word" or space around hyphen
  // Hyphens in URLs or correct compound words ("step-by-step", "real-time") are allowed
  if (/\s+-\s+/.test(text)) {
    issues.push(`[${context}] Hyphen used as prose connector (" - "). Use words instead.`)
  }
  if (/\s+-(?=[A-Za-z])/.test(text) && !text.includes(' -')) {
    issues.push(`[${context}] Leading hyphen connector found.`)
  }

  // Emoji check
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  if (emojiRegex.test(text)) {
    issues.push(`[${context}] Emoji detected. No emojis allowed anywhere in course copy.`)
  }

  return issues
}

function lintCourseCopy(courseInput: CreateCatalogPathInput): void {
  const issues: string[] = []

  const check = (str: string | undefined | null, ctx: string) => {
    if (!str) return
    const found = lintCopy(str, ctx)
    if (found.length > 0) issues.push(...found)
  }

  check(courseInput.subject, `${courseInput.slug} > subject`)
  check(courseInput.summary, `${courseInput.slug} > summary`)
  check(courseInput.goal, `${courseInput.slug} > goal`)

  for (let i = 0; i < courseInput.sections.length; i++) {
    const s = courseInput.sections[i]!
    const sCtx = `${courseInput.slug} > session ${i + 1} (${s.title})`
    check(s.title, `${sCtx} > title`)
    check(s.description, `${sCtx} > description`)

    // Lesson
    check(s.content.lesson.title, `${sCtx} > lesson > title`)
    check(s.content.lesson.intro, `${sCtx} > lesson > intro`)
    for (const b of s.content.lesson.blocks) {
      if (b.type === 'p' || b.type === 'h') check(b.text, `${sCtx} > lesson > block:${b.type}`)
      if (b.type === 'note') {
        check(b.title, `${sCtx} > lesson > note:title`)
        check(b.text, `${sCtx} > lesson > note:text`)
      }
      if (b.type === 'list' || b.type === 'steps') {
        for (const item of b.items) check(item, `${sCtx} > lesson > block:${b.type}:item`)
      }
    }

    // Resources
    for (let r = 0; r < s.content.resources.length; r++) {
      const res = s.content.resources[r]!
      const rCtx = `${sCtx} > resource ${r + 1} (${res.title})`
      check(res.title, `${rCtx} > title`)
      check(res.source, `${rCtx} > source`)
      check(res.summary, `${rCtx} > summary`)
      for (const line of res.body) check(line, `${rCtx} > body`)
    }

    // Practice
    check(s.content.practice.title, `${sCtx} > practice > title`)
    check(s.content.practice.brief, `${sCtx} > practice > brief`)
    if (s.content.practice.kind === 'written') {
      check(s.content.practice.prompt, `${sCtx} > practice > prompt`)
      check(s.content.practice.modelAnswer, `${sCtx} > practice > modelAnswer`)
    } else {
      for (let pIdx = 0; pIdx < s.content.practice.items.length; pIdx++) {
        const item = s.content.practice.items[pIdx]!
        check(item.label, `${sCtx} > practice > item ${pIdx + 1} label`)
        check(item.detail, `${sCtx} > practice > item ${pIdx + 1} detail`)
        check(item.feedback, `${sCtx} > practice > item ${pIdx + 1} feedback`)
        for (const opt of item.options) {
          check(opt, `${sCtx} > practice > item ${pIdx + 1} option`)
        }
      }
    }

    // Assessment
    check(s.content.assessment.title, `${sCtx} > assessment > title`)
    check(s.content.assessment.intro, `${sCtx} > assessment > intro`)
    for (let qIdx = 0; qIdx < s.content.assessment.questions.length; qIdx++) {
      const q = s.content.assessment.questions[qIdx]!
      const qCtx = `${sCtx} > question ${qIdx + 1}`
      check(q.prompt, `${qCtx} > prompt`)
      check(q.explanation, `${qCtx} > explanation`)
      for (const ch of q.choices) check(ch, `${qCtx} > choice`)
    }
  }

  if (issues.length > 0) {
    const errorMsg = `[factory lint] Course "${courseInput.slug}" failed style/punctuation rules:\n` +
      issues.map((msg) => `  - ${msg}`).join('\n')
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
}

/* ----------------------------- course ----------------------------- */

export function course(input: CourseBuilderInput): CreateCatalogPathInput {
  const slug = input.slug.trim().toLowerCase()

  // Build deterministic sections and IDs
  const sections: CatalogSectionInput[] = input.sessions.map((sess, idx) => {
    const sid = sess.id ?? `${slug}-s${idx + 1}`

    const lessonObj = {
      ...sess.lesson,
    }

    const resourcesObj = sess.resources.map((r) => ({
      ...r,
      url: r.url ?? undefined,
    }))

    const practiceObj = sess.practice

    const assessmentObj = {
      ...sess.assessment,
    }

    const content: CatalogContentInput = {
      lesson: lessonObj,
      resources: resourcesObj,
      practice: practiceObj,
      assessment: assessmentObj,
    }

    return {
      id: sid,
      title: sess.title,
      description: sess.description ?? '',
      minutes: sess.minutes ?? 45,
      content,
    }
  })

  // Calculate default hours and weeks if not explicitly provided
  const totalMinutes = sections.reduce((sum, s) => sum + s.minutes, 0)
  const autoHours = Math.max(1, Math.round(totalMinutes / 60))
  const weeklyHours = input.weeklyHours ?? '5'
  const weeklyNumeric = parseInt(weeklyHours === '15+' ? '15' : weeklyHours, 10) || 5
  const autoWeeks = Math.max(1, Math.ceil(autoHours / weeklyNumeric))

  const rawDoc = {
    slug,
    subject: input.subject.trim(),
    summary: input.summary.trim(),
    goal: input.goal.trim(),
    level: input.level,
    tags: input.tags.map((t) => t.trim().toLowerCase()),
    weeklyHours,
    intensity: input.intensity ?? ('balanced' as const),
    formats: input.formats ?? ['videos', 'articles', 'exercises', 'quizzes'],
    expectedWeeks: input.expectedWeeks ?? autoWeeks,
    expectedHours: input.expectedHours ?? autoHours,
    ogImage: input.ogImage ?? null,
    sections,
    published: input.published ?? true,
  }

  // Schema validation
  const parsed = createCatalogPathSchema.safeParse(rawDoc)
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    const msg = `[factory] Schema validation failed for course "${slug}":\n${errorDetails}`
    console.error(msg)
    throw new Error(msg)
  }

  // Quality checks:
  // 1. Minimum 8 sections
  if (parsed.data.sections.length < 8) {
    const msg = `[factory] Course "${slug}" has ${parsed.data.sections.length} sections. Minimum required is 8.`
    console.error(msg)
    throw new Error(msg)
  }

  // 2. Video requirements (>= 70% by count and total minutes)
  let totalResourceCount = 0
  let videoResourceCount = 0
  let totalResourceMinutes = 0
  let videoResourceMinutes = 0

  for (let i = 0; i < parsed.data.sections.length; i++) {
    const s = parsed.data.sections[i]!
    const resources = s.content.resources

    // 2 to 5 resources per session
    if (resources.length < 2 || resources.length > 5) {
      const msg = `[factory] Course "${slug}" section ${i + 1} has ${resources.length} resources. Expected 2 to 5.`
      console.error(msg)
      throw new Error(msg)
    }

    // At least one article or template
    const hasArticleOrTemplate = resources.some(
      (r) => r.kind === 'article' || r.kind === 'template' || r.kind === 'book',
    )
    if (!hasArticleOrTemplate) {
      const msg = `[factory] Course "${slug}" section ${i + 1} needs at least one reading/reference resource (article or template).`
      console.error(msg)
      throw new Error(msg)
    }

    // Questions check (5 to 8 questions recommended, min 5)
    const qCount = s.content.assessment.questions.length
    if (qCount < 5) {
      const msg = `[factory] Course "${slug}" section ${i + 1} assessment has ${qCount} questions. Minimum required is 5.`
      console.error(msg)
      throw new Error(msg)
    }

    for (const r of resources) {
      totalResourceCount++
      totalResourceMinutes += r.minutes
      if (r.kind === 'video') {
        videoResourceCount++
        videoResourceMinutes += r.minutes
      }
    }
  }

  const videoCountRatio = totalResourceCount > 0 ? videoResourceCount / totalResourceCount : 0
  const videoMinuteRatio = totalResourceMinutes > 0 ? videoResourceMinutes / totalResourceMinutes : 0

  if (videoCountRatio < 0.70) {
    const pct = Math.round(videoCountRatio * 100)
    const msg = `[factory] Course "${slug}" video count ratio is ${pct}% (${videoResourceCount}/${totalResourceCount}). Minimum 70% required.`
    console.error(msg)
    throw new Error(msg)
  }

  if (videoMinuteRatio < 0.70) {
    const pct = Math.round(videoMinuteRatio * 100)
    const msg = `[factory] Course "${slug}" video minutes ratio is ${pct}% (${videoResourceMinutes}/${totalResourceMinutes} mins). Minimum 70% required.`
    console.error(msg)
    throw new Error(msg)
  }

  // 3. Strict copy linting
  lintCourseCopy(parsed.data)

  return parsed.data
}

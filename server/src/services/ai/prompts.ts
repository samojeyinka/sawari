import type { ExperienceLevel, GoalReason, Intensity, LearningFormat, WeeklyHours } from '../../domain/index.js'
import type { ChatMessage } from './deepseek.js'

/* ------------------------------------------------------------------ */
/*  Prompts for AI path + session generation. Kept in one file so the  */
/*  contracts stay reviewable and are never duplicated inline.        */
/* ------------------------------------------------------------------ */

/** Everything the model is told about the learner. */
export interface LearnerBrief {
  subject: string
  experience: ExperienceLevel | null
  reason: GoalReason | null
  outcome: string
  weeklyHours: WeeklyHours
  formats: LearningFormat[]
  intensity: Intensity
  targetDate: string | null
}

const REASON_PHRASE: Record<GoalReason, string> = {
  career: 'to grow in their job',
  school: 'for school',
  growth: 'for personal growth',
  'career-change': 'to change careers',
  project: 'for a specific project',
  other: 'for their own reasons',
}

function briefText(learner: LearnerBrief): string {
  const reason = learner.reason ? REASON_PHRASE[learner.reason] : 'for their own reasons'
  return [
    `Subject: ${learner.subject}`,
    `Experience: ${learner.experience ?? 'unspecified'}`,
    `Reason: ${reason}`,
    `Outcome they want: ${learner.outcome || `get comfortable with ${learner.subject}`}`,
    `Time available: about ${learner.weeklyHours} hours a week`,
    `Preferred formats: ${learner.formats.length ? learner.formats.join(', ') : 'a mix'}`,
    `Intensity: ${learner.intensity}`,
    `Target date: ${learner.targetDate ?? 'no fixed date'}`,
  ].join('\n')
}

export const OUTLINE_SYSTEM = `You design rigorous, topic-specific learning paths for a study app called Sawari.
Given a learner brief, produce a path of 4 to 6 sections taking them from their current level to their desired outcome.
Every section must focus strictly on the subject matter itself.

CRITICAL RULES:
- FORBIDDEN: Do NOT include generic study skills, meta-learning advice, or generic filler (e.g. no "Getting started", "How to learn", "Time management", "Setting up routines", "Core skills", "Guided practice").
- TOPIC SPECIFICITY: Every single title and description must name concrete domain topics, technologies, mechanisms, or concepts specific to the subject.
- PROGRESSION: Order logically from foundational domain prerequisites, to core practical techniques, to advanced concepts, concluding with a concrete hands-on domain final project.
- CALIBRATION: Calibrate topic depth and pacing specifically to the learner's experience level, weekly hours, and intensity.

Return only JSON. Use exactly this shape:
{
  "sections": [
    { "order": 1, "title": "short title", "description": "one or two sentences", "minutes": 180 }
  ]
}
Rules:
- "minutes" is an integer between 120 and 600.
- Titles are 2 to 6 words, domain-specific, no numbering, no trailing period.
- Descriptions are 10 to 25 words describing the specific domain content taught.`

export const CONTENT_SYSTEM = `You write one deep, topic-specific study session for a learner in a study app called Sawari.
You are given the learner brief and the section topic. Produce the session content as JSON.
Write like a world-class teacher: rigorous, direct, clear, and instructive.

- CRITICAL RULES:
- REAL TEACHING ONLY: Teach the actual subject matter directly. Cover core mechanisms, concrete principles, worked examples, formulas, domain terminology, and trade-offs.
- NO META-ADVICE: Strictly forbid generic advice about how to study (e.g. no "take notes", "read without writing", "study in 50-minute chunks", "cramming is bad", "plan one piece of work"). Teach the subject itself!
- RESPECT THE PATH CONTEXT: You are writing ONE section of a longer path. Build directly on the "already covered" sections without reteaching them, and do NOT jump ahead into "upcoming" topics — leave them room.
- FORMATS & MEDIA EMBED: Strictly respect the learner's preferred formats from the brief.
  * RESOURCES ARRAY: "resources" holds 1 to 3 items. Prefer 2-3 when the topic deserves it; one excellent source beats filler. NEVER repeat anything from the "already used" list: no repeated URLs, titles, or sources — every session must point somewhere new.
  * MULTIPLE VIDEOS WELCOME: When videos fit the learner's formats, include MORE THAN ONE video whenever each teaches something distinct (e.g. a concept explainer plus a worked example). Never pad with filler.
  * Video: a real YouTube/Vimeo watch URL you are confident exists (well-known channels, courses, conference talks). Name the channel in "source". The app embeds YouTube/Vimeo URLs in an inline interactive video player.
  * Article/book: a real authoritative URL (official documentation, MDN, arXiv, Wikipedia, or a trusted publication). Write an accurate 2-sentence "summary" explaining what the piece covers, and in "body" provide 3 to 5 structured key learning takeaways detailing the core mechanisms the learner should study while reading that source. Do NOT fabricate prose pretending to be the article itself.
  * REAL URLS ONLY: If you cannot name a URL you genuinely trust, OMIT "url" entirely rather than inventing one. A resource without a URL is always better than a fake link.
- PRACTICE: Must be an applied domain exercise directly testing the material taught in this session (written exercise with a detailed model answer, or a classification task).
- ASSESSMENT: Exactly 3 multiple-choice questions testing comprehension and application of the domain concepts taught in this session.

Return only JSON. Use exactly this shape:
{
  "lesson": {
    "title": "string",
    "minutes": 15,
    "intro": "2 to 4 sentences introducing the core domain topic",
    "blocks": [
      { "type": "h", "text": "short heading" },
      { "type": "p", "text": "a detailed paragraph teaching the concept" },
      { "type": "steps", "items": ["concrete domain step", "concrete domain step"] },
      { "type": "list", "items": ["domain item", "domain item"] },
      { "type": "note", "title": "short title", "text": "one or two sentences highlighting a critical domain distinction" }
    ]
  },
  "resources": [
    {
      "title": "string",
      "kind": "article",
      "source": "string",
      "minutes": 10,
      "summary": "two sentences explaining what the piece covers and what to focus on",
      "body": [
        "Key concept #1 to focus on while reading the source",
        "Key concept #2 to focus on while reading the source",
        "Key concept #3 to focus on while reading the source"
      ],
      "url": "https://..."
    }
  ],
  "practice": {
    "title": "string",
    "minutes": 10,
    "brief": "one sentence describing the domain task",
    "kind": "written",
    "prompt": "the specific domain challenge or problem to solve",
    "modelAnswer": "a thorough, exemplar response"
  },
  "assessment": {
    "title": "string",
    "intro": "one sentence",
    "minutes": 10,
    "topic": "short topic name",
    "reviewTopic": "short topic to review if they score low",
    "questions": [
      {
        "prompt": "question directly testing material in this session",
        "choices": ["a", "b", "c", "d"],
        "correctIndex": 1,
        "explanation": "why that answer is correct based on the domain rules"
      }
    ]
  }
}
Rules:
- "lesson.blocks": 4 to 6 blocks, mix the types, do not start with an "h".
- "resources": 1 to 3 items, each with kind one of article, video, book, template.
  More than one video is welcome when each teaches something distinct.
- "practice.kind": either "written" (prompt + modelAnswer) or "classify"
  (items: [{ label, detail, options[3-4], correctIndex, feedback }]).
- "assessment.questions": exactly 3, each with 4 choices and one correctIndex (0-3).
- "minutes" are integers.`

export function outlineMessages(learner: LearnerBrief): ChatMessage[] {
  return [
    { role: 'system', content: OUTLINE_SYSTEM },
    { role: 'user', content: `Learner brief:\n${briefText(learner)}\n\nDesign the path.` },
  ]
}

export interface BriefSection {
  title: string
  description: string
}

/** What the model is told about the rest of the path when writing one session. */
export interface SessionGenContext {
  /** 1-based position of the section being written. */
  position: number
  total: number
  outline: { order: number; title: string; description: string }[]
  priorResources: { sectionTitle: string; title: string; kind: string; url?: string }[]
}

/**
 * Renders the path context block for a session prompt: where this section
 * sits, what came before (build on it), what comes after (leave it alone),
 * and which resources are already used (never repeat them).
 */
export function formatSessionContext(section: BriefSection, context: SessionGenContext): string {
  const lines = [...context.outline]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const marker =
        s.order < context.position
          ? 'already covered'
          : s.order === context.position
            ? 'THIS SECTION'
            : 'upcoming — do not cover yet'
      return `${s.order}. "${s.title}" — ${s.description} [${marker}]`
    })

  const used =
    context.priorResources.length === 0
      ? '(none yet — this is the first session with resources)'
      : context.priorResources
          .map(
            (r) =>
              `- "${r.title}" (${r.kind}${r.url ? `, ${r.url}` : ''}) — used in "${r.sectionTitle}"`,
          )
          .join('\n')

  return [
    `Path outline (section ${context.position} of ${context.total} — you are writing "${section.title}"):`,
    ...lines,
    '',
    'Resources already used in this path (NEVER repeat any of these — new URL, title, and source required):',
    used,
  ].join('\n')
}

export function contentMessages(
  learner: LearnerBrief,
  section: BriefSection,
  context?: SessionGenContext,
): ChatMessage[] {
  const contextBlock = context ? `\n\n${formatSessionContext(section, context)}` : ''
  return [
    { role: 'system', content: CONTENT_SYSTEM },
    {
      role: 'user',
      content: `Learner brief:\n${briefText(learner)}\n\nSection: "${section.title}" - ${section.description}${contextBlock}\n\nWrite the session for this section.`,
    },
  ]
}

/* -------------------------- goal extraction ----------------------- */

export type GoalExtractionMode = 'admire' | 'build'

export const GOAL_EXTRACT_SYSTEM = `You read a learner's one-line niche or build idea for a study app called Sawari and turn it into a structured learning goal.
Two modes:
- admire: the input names a person they admire (a name, a LinkedIn URL, or a role). Infer that person's niche and the core domain skills behind it.
- build: the input describes something to build. Name the concrete thing and the domain skills it draws on.

CRITICAL RULES:
- Concrete domain topics only: name real technologies, mechanisms, crafts, or disciplines. No generic filler ("fundamentals", "mindset", "productivity").
- Subject is 2 to 6 words, domain-specific, no numbering, no trailing period.
- Outcome is one sentence stating what the learner will be able to do.
- Skills are 5 to 7 concrete items the niche or build genuinely draws on.
- Label is the person's name (or short role) for admire, the short thing-name for build.
- Note is one short line saying how you read it (e.g. "Niche read from Amara Osei's profile").

Return only valid JSON matching this shape:
{
  "subject": "string",
  "outcome": "string",
  "skills": ["string"],
  "label": "string",
  "note": "string"
}`

export function goalExtractMessages(mode: GoalExtractionMode, input: string): ChatMessage[] {
  return [
    { role: 'system', content: GOAL_EXTRACT_SYSTEM },
    {
      role: 'user',
      content: `Mode: ${mode}\nInput: "${input}"\n\nExtract the learning goal.`,
    },
  ]
}

/* --------------------------- project review ----------------------- */

export interface ProjectReviewParams {
  title: string
  description?: string
  objectives: string[]
  tasks: { title: string; done: boolean }[]
  submissionNote?: string
}

export const PROJECT_REVIEW_SYSTEM = `You review a learner's finished project for a study app called Sawari. Be a rigorous, encouraging reviewer: specific, honest, and tied to the actual work described.
You receive the project brief, which tasks were completed, and the learner's own submission note.

CRITICAL RULES:
- Reference their real tasks and note. Name what is strong and what is missing.
- Never generic praise ("great job", "good effort") without a concrete reason.
- If the note is empty and few tasks are done, say so plainly and keep the next steps concrete and small.
- "strengths": 2 to 5 specific things done well.
- "improve": 2 to 5 concrete next steps.
- "note": 1 to 2 sentences, overall verdict.

Return only valid JSON matching this shape:
{
  "strengths": ["string"],
  "improve": ["string"],
  "note": "string"
}`

export function projectReviewMessages(params: ProjectReviewParams): ChatMessage[] {
  const taskLines = params.tasks.length
    ? params.tasks.map((t) => `- [${t.done ? 'done' : 'open'}] ${t.title}`).join('\n')
    : '(no task breakdown provided)';
  return [
    { role: 'system', content: PROJECT_REVIEW_SYSTEM },
    {
      role: 'user',
      content: [
        `Project: ${params.title}`,
        params.description ? `Brief: ${params.description}` : '',
        params.objectives.length ? `Objectives: ${params.objectives.join('; ')}` : '',
        `Tasks:\n${taskLines}`,
        params.submissionNote?.trim()
          ? `Learner's submission note: "${params.submissionNote.trim()}"`
          : 'Learner left no submission note.',
        '',
        'Review the project.',
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ]
}

/* ------------------------------ timeline -------------------------- */

export interface TimelinePromptParams {
  subject: string
  outcome?: string
  experience?: string | null
  weeklyHours?: string
  intensity?: string
}

export const TIMELINE_SYSTEM = `You are an expert curriculum planner estimating realistic study timelines for learners.
Evaluate the subject's technical depth, scope, prerequisite density, and the learner's starting level and weekly study hours.
Calculate realistic duration estimates in months:
- "recommendedMonths": the realistic, sustainable duration for steady progress (integer between 1 and 24).
- "fastMonths": an intensive, fast-tracked duration for rapid completion (integer between 1 and 24).
- "relaxedMonths": a low-pressure, flexible duration with more breathing room (integer between 1 and 36).
- "reason": 1 to 2 clear sentences explaining specifically why this subject and depth requires this duration at this schedule.

Return only valid JSON matching this shape:
{
  "recommendedMonths": number,
  "fastMonths": number,
  "relaxedMonths": number,
  "reason": "string"
}`

export function timelineMessages(params: TimelinePromptParams): ChatMessage[] {
  return [
    { role: 'system', content: TIMELINE_SYSTEM },
    {
      role: 'user',
      content: `Subject: ${params.subject}\nGoal/Outcome: ${params.outcome || 'Master the subject'}\nExperience: ${params.experience || 'beginner'}\nWeekly hours: ${params.weeklyHours || '5'}\nIntensity: ${params.intensity || 'balanced'}\n\nEstimate the study timeline.`,
    },
  ]
}

/* ------------------------------ practice review ------------------- */

export interface PracticeReviewParams {
  prompt: string
  userAnswer: string
  modelAnswer?: string
  topic?: string
}

export const PRACTICE_REVIEW_SYSTEM = `You are a rigorous, encouraging tutor evaluating a learner's answer to a domain practice exercise in the Sawari study app.
Evaluate how well the learner's answer addresses the prompt and aligns with the expected domain concepts in the model answer.

CRITICAL RULES:
- Check genuine domain comprehension and correlation with what was asked. Reject spam, gibberish, filler, random characters, or unrelated text.
- Status must be one of:
  * "correct": The answer demonstrates solid, accurate understanding of the concepts asked.
  * "close": The answer touches on the right ideas or answers part of the question, but misses key nuances, terminology, or details.
  * "needs_improvement": The answer is inaccurate, too vague, irrelevant, or fails to address the question.
- "acceptable": true if status is "correct" or "close" (showing genuine effort and grasp), false otherwise.
- "feedback": 1 to 2 clear sentences acknowledging specifically what the learner got right or understood.
- "improvements": 1 to 2 concrete sentences explaining how the answer can be improved, what key concept was omitted, or what distinction was missed.
- "score": An integer from 0 to 100 representing accuracy.

Return strictly valid JSON matching this shape:
{
  "status": "correct" | "close" | "needs_improvement",
  "acceptable": boolean,
  "score": number,
  "feedback": "string",
  "improvements": "string"
}`

export function practiceReviewMessages(params: PracticeReviewParams): ChatMessage[] {
  return [
    { role: 'system', content: PRACTICE_REVIEW_SYSTEM },
    {
      role: 'user',
      content: `Topic: ${params.topic || 'Practice Exercise'}\nPrompt: ${params.prompt}\n${params.modelAnswer ? `Exemplar/Model Answer: ${params.modelAnswer}\n` : ''}Learner Answer: "${params.userAnswer}"\n\nEvaluate the learner's answer.`,
    },
  ]
}
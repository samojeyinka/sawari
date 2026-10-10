/*
 * Throwaway AI spike. Not part of the app.
 *
 * Talks to the real DeepSeek API with the same setup answers the app collects,
 * asks for the exact JSON shapes the frontend already expects (path outline +
 * one SessionContent), and reports whether the model can hold that contract.
 *
 * Run (from server/):
 *   node --env-file=.env scripts/ai-spike.mjs [sample] [stage]
 *     sample: machine-learning | guitar | excel
 *     stage:  prompt | outline | content | all   (default: all)
 */

const KEY = process.env.DEEPSEEK_API_KEY
const BASE = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

if (!KEY) {
  console.error('Missing DEEPSEEK_API_KEY (add it to server/.env).')
  process.exit(1)
}

/* ------------------------------- samples ------------------------------- */

const samples = {
  'machine-learning': {
    subject: 'machine learning',
    experience: 'some',
    reason: 'career',
    outcome: 'build and evaluate a small model end to end',
    weeklyHours: '5',
    days: ['mon', 'wed', 'sat'],
    timeWindow: 'evening',
    formats: ['videos', 'exercises', 'projects'],
    intensity: 'balanced',
    targetDate: '2026-01-15',
  },
  guitar: {
    subject: 'guitar',
    experience: 'beginner',
    reason: 'growth',
    outcome: 'play three songs from start to finish',
    weeklyHours: '2',
    days: ['tue', 'thu', 'sun'],
    timeWindow: 'anytime',
    formats: ['videos', 'practice', 'exercises'],
    intensity: 'relaxed',
    targetDate: '2026-03-01',
  },
  excel: {
    subject: 'excel',
    experience: 'comfortable',
    reason: 'project',
    outcome: 'build a monthly reporting workbook my team can reuse',
    weeklyHours: '10',
    days: ['mon', 'tue', 'wed', 'thu'],
    timeWindow: 'morning',
    formats: ['articles', 'exercises'],
    intensity: 'intensive',
    targetDate: '2025-12-20',
  },
}

const answers = samples[process.argv[2]] ?? samples['machine-learning']
const stage = process.argv[3] ?? 'all'

/* -------------------------- brief from answers ------------------------- */

function brief(a) {
  const reason = {
    career: 'to grow in their job',
    school: 'for school',
    growth: 'for personal growth',
    'career-change': 'to change careers',
    project: 'for a specific project',
    other: 'for their own reasons',
  }[a.reason] ?? 'for their own reasons'

  return [
    `Subject: ${a.subject}`,
    `Experience: ${a.experience}`,
    `Reason: ${reason}`,
    `Outcome they want: ${a.outcome}`,
    `Time available: about ${a.weeklyHours} hours a week on ${a.days.join(', ')} (${a.timeWindow})`,
    `Preferred formats: ${a.formats.join(', ')}`,
    `Intensity: ${a.intensity}`,
    `Target date: ${a.targetDate}`,
  ].join('\n')
}

/* ------------------------------ prompts -------------------------------- */

const OUTLINE_SYSTEM = `You design learning paths for a study app called Sawari.
Given a learner brief, produce a short path of 4 to 6 sections that takes them
from where they are to their stated outcome, ordered from foundations to a final
hands-on project. Each section should be completable in one to several sessions.
Be concrete and specific to the subject. Do not pad.

Return only JSON. Use exactly this shape:
{
  "sections": [
    { "order": 1, "title": "short title", "description": "one or two sentences", "minutes": 180 }
  ]
}
Rules:
- "minutes" is an integer between 120 and 600.
- Titles are 2 to 6 words, no numbering, no trailing period.
- Descriptions are 10 to 25 words.`

const CONTENT_SYSTEM = `You write one study session for a learner in a study app called Sawari.
You are given the learner brief and the section they are on. Produce the session
content as JSON. Write like a good teacher: direct, useful, no filler and no
cheerleading. If a resource link is useful, provide a real, well known URL;
otherwise omit "url".

Return only JSON. Use exactly this shape:
{
  "lesson": {
    "title": "string",
    "minutes": 15,
    "intro": "2 to 4 sentences",
    "blocks": [
      { "type": "h", "text": "short heading" },
      { "type": "p", "text": "a paragraph" },
      { "type": "steps", "items": ["step", "step"] },
      { "type": "list", "items": ["item", "item"] },
      { "type": "note", "title": "short title", "text": "one or two sentences" }
    ]
  },
  "resource": {
    "title": "string",
    "kind": "article",
    "source": "string",
    "minutes": 10,
    "summary": "one or two sentences",
    "body": ["paragraph", "paragraph"]
  },
  "practice": {
    "title": "string",
    "minutes": 10,
    "brief": "one sentence",
    "kind": "written",
    "prompt": "the task",
    "modelAnswer": "what a strong answer looks like"
  },
  "assessment": {
    "title": "string",
    "intro": "one sentence",
    "minutes": 10,
    "topic": "short topic name",
    "reviewTopic": "short topic to review if they score low",
    "questions": [
      {
        "prompt": "question",
        "choices": ["a", "b", "c", "d"],
        "correctIndex": 1,
        "explanation": "why that answer is right"
      }
    ]
  }
}
Rules:
- "lesson.blocks": 4 to 6 blocks, mix the types, do not start with an "h".
- "resource.kind": one of article, video, book, template.
- "practice.kind": either "written" (prompt + modelAnswer) or "classify"
  (items: [{ label, detail, options[3-4], correctIndex, feedback }]).
- "assessment.questions": exactly 3, each with 4 choices and one correctIndex.
- "minutes" are integers.`

function outlineMessages(a) {
  return [
    { role: 'system', content: OUTLINE_SYSTEM },
    { role: 'user', content: `Learner brief:\n${brief(a)}\n\nDesign the path.` },
  ]
}

function contentMessages(a, section) {
  return [
    { role: 'system', content: CONTENT_SYSTEM },
    {
      role: 'user',
      content: `Learner brief:\n${brief(a)}\n\nSection: "${section.title}" - ${section.description}\n\nWrite the session for this section.`,
    },
  ]
}

/* ------------------------------- client -------------------------------- */

async function callDeepSeek(messages, maxTokens = 4096) {
  const started = Date.now()
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  })
  const ms = Date.now() - started
  const text = await res.text()
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${text}`)
  const json = JSON.parse(text)
  return { ms, usage: json.usage, content: json.choices?.[0]?.message?.content ?? '' }
}

/* ----------------------------- validation ------------------------------ */

function check(label, ok) {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`)
  return ok
}

function validateOutline(parsed) {
  console.log('\nOutline check:')
  const s = parsed.sections
  let ok = check('has sections array', Array.isArray(s))
  if (!ok) return false
  ok = check('4 to 6 sections', s.length >= 4 && s.length <= 6) && ok
  ok =
    check(
      'each has order/title/description/minutes',
      s.every(
        (x) =>
          Number.isInteger(x.order) &&
          typeof x.title === 'string' &&
          typeof x.description === 'string' &&
          Number.isInteger(x.minutes),
      ),
    ) && ok
  ok = check('minutes in range', s.every((x) => x.minutes >= 120 && x.minutes <= 600)) && ok
  return ok
}

function validateContent(parsed) {
  console.log('\nContent check:')
  const { lesson, resource, practice, assessment } = parsed
  let ok = check('has lesson/resource/practice/assessment', Boolean(lesson && resource && practice && assessment))
  if (!ok) return false
  ok = check('lesson has title/intro/blocks(4-6)', Boolean(lesson.title && lesson.intro && Array.isArray(lesson.blocks) && lesson.blocks.length >= 4)) && ok
  ok = check('blocks use known types', lesson.blocks.every((b) => ['p', 'h', 'list', 'steps', 'note'].includes(b.type))) && ok
  ok = check('resource has title/kind/summary/body[]', Boolean(resource.title && ['article', 'video', 'book', 'template'].includes(resource.kind) && resource.summary && Array.isArray(resource.body))) && ok
  ok = check('practice has kind written|classify', ['written', 'classify'].includes(practice.kind)) && ok
  if (practice.kind === 'written') ok = check('written has prompt+modelAnswer', Boolean(practice.prompt && practice.modelAnswer)) && ok
  else ok = check('classify has items[]', Array.isArray(practice.items) && practice.items.length > 0) && ok
  ok = check('assessment has exactly 3 questions', Array.isArray(assessment.questions) && assessment.questions.length === 3) && ok
  ok = check('each question has 4 choices + correctIndex', assessment.questions.every((q) => Array.isArray(q.choices) && q.choices.length === 4 && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4)) && ok
  return ok
}

/* -------------------------------- main --------------------------------- */

async function main() {
  console.log(`model=${MODEL} base=${BASE} sample=${process.argv[2] ?? 'machine-learning'} stage=${stage}\n`)
  console.log('Brief:\n' + brief(answers) + '\n')

  if (stage === 'prompt') {
    console.log('--- outline system ---\n' + OUTLINE_SYSTEM)
    console.log('\n--- content system ---\n' + CONTENT_SYSTEM)
    return
  }

  let outline = null
  if (stage === 'outline' || stage === 'all') {
    console.log('== Outline ==')
    const r = await callDeepSeek(outlineMessages(answers))
    console.log(`ms=${r.ms} tokens=${JSON.stringify(r.usage)}`)
    const parsed = JSON.parse(r.content)
    validateOutline(parsed)
    console.log('\n' + JSON.stringify(parsed, null, 2))
    outline = parsed
  }

  if (stage === 'content' || stage === 'all') {
    if (!outline) {
      const r = await callDeepSeek(outlineMessages(answers))
      outline = JSON.parse(r.content)
    }
    const section = outline.sections?.[0] ?? { title: 'Getting started', description: 'The first steps.' }
    console.log(`\n== Content: "${section.title}" ==`)
    const r = await callDeepSeek(contentMessages(answers, section), 8192)
    console.log(`ms=${r.ms} tokens=${JSON.stringify(r.usage)}`)
    const parsed = JSON.parse(r.content)
    validateContent(parsed)
    console.log('\n' + JSON.stringify(parsed, null, 2))
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})

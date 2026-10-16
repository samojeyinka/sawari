import { useEffect, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Button } from '../ui/Button'
import type {
  ExperienceLevel,
  Intensity,
  LearningFormat,
  LessonBlock,
  Resource,
  WeeklyHours,
} from '../../types'
import { toSectionInput, type CatalogPathInput, type CatalogSectionInput } from '../../lib/api'
import type { CatalogSection } from '../../lib/api'
import { cx } from '../../lib/utils'

/* ------------------------------------------------------------------ */
/*  Admin authoring form for a catalog path. Keeps a fully-editable    */
/*  draft in local state and converts it to the API payload on submit. */
/* ------------------------------------------------------------------ */

export const FORMATS: LearningFormat[] = [
  'videos',
  'articles',
  'books',
  'exercises',
  'projects',
  'quizzes',
]
export const WEEKLY_HOURS: WeeklyHours[] = ['2', '5', '10', '15+']
export const INTENSITIES: Intensity[] = ['relaxed', 'balanced', 'intensive']
export const LEVELS: ExperienceLevel[] = ['beginner', 'some', 'comfortable', 'advanced']
export const RESOURCE_KINDS: Resource['kind'][] = ['article', 'video', 'book', 'template']
export const BLOCK_TYPES: LessonBlock['type'][] = ['p', 'h', 'list', 'steps', 'note']

const uid = () => Math.random().toString(36).slice(2, 10)

type BlockDraft = LessonBlock & { uid: string }

interface ResourceDraft extends Omit<Resource, 'id'> {
  uid: string
  url: string
}
interface PracticeItemDraft {
  uid: string
  label: string
  detail: string
  options: string[]
  correctIndex: number
  feedback: string
}
type PracticeDraft =
  | { kind: 'written'; title: string; minutes: number; brief: string; prompt: string; modelAnswer: string }
  | { kind: 'classify'; title: string; minutes: number; brief: string; items: PracticeItemDraft[] }
interface QuestionDraft {
  uid: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}
interface AssessmentDraft {
  title: string
  intro: string
  minutes: number
  topic: string
  reviewTopic: string
  questions: QuestionDraft[]
}
interface ContentDraft {
  lesson: { title: string; minutes: number; intro: string; blocks: BlockDraft[] }
  resources: ResourceDraft[]
  practice: PracticeDraft
  assessment: AssessmentDraft
}
export interface SectionDraft {
  uid: string
  id?: string
  title: string
  description: string
  minutes: number
  content: ContentDraft
}

export interface FormDraft {
  subject: string
  slug: string
  summary: string
  goal: string
  level: ExperienceLevel | ''
  tagsText: string
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  expectedWeeks: number
  expectedHours: number
  ogImage: string
  published: boolean
  sections: SectionDraft[]
}

/* ------------------------------ defaults ------------------------------ */

function emptyBlock(): BlockDraft {
  return { uid: uid(), type: 'p', text: '' }
}

function emptySection(): SectionDraft {
  return {
    uid: uid(),
    title: '',
    description: '',
    minutes: 30,
    content: {
      lesson: { title: '', minutes: 15, intro: '', blocks: [emptyBlock()] },
      resources: [
        { uid: uid(), title: '', kind: 'article', source: '', minutes: 10, summary: '', body: [''], url: '' },
      ],
      practice: { kind: 'written', title: '', minutes: 10, brief: '', prompt: '', modelAnswer: '' },
      assessment: {
        title: '',
        intro: '',
        minutes: 10,
        topic: '',
        reviewTopic: '',
        questions: [{ uid: uid(), prompt: '', choices: ['', ''], correctIndex: 0, explanation: '' }],
      },
    },
  }
}

export function emptyDraft(): FormDraft {
  return {
    subject: '',
    slug: '',
    summary: '',
    goal: '',
    level: '',
    tagsText: '',
    weeklyHours: '5',
    intensity: 'balanced',
    formats: [],
    expectedWeeks: 0,
    expectedHours: 0,
    ogImage: '',
    published: false,
    sections: [emptySection()],
  }
}

/** Rebuilds an editable draft from a fetched catalog section. */
export function sectionToDraft(section: CatalogSection): SectionDraft {
  const input = toSectionInput(section)
  const c = input.content
  return {
    uid: uid(),
    id: input.id,
    title: input.title,
    description: input.description ?? '',
    minutes: input.minutes ?? 0,
    content: {
      lesson: {
        title: c.lesson.title,
        minutes: c.lesson.minutes,
        intro: c.lesson.intro,
        blocks: c.lesson.blocks.map((block) => ({ ...block, uid: uid() }) as BlockDraft),
      },
      resources: c.resources.map((resource) => ({
        uid: uid(),
        title: resource.title,
        kind: resource.kind,
        source: resource.source,
        minutes: resource.minutes,
        summary: resource.summary,
        body: resource.body.length ? resource.body : [''],
        url: resource.url ?? '',
      })),
      practice:
        c.practice.kind === 'classify'
          ? {
              kind: 'classify',
              title: c.practice.title,
              minutes: c.practice.minutes,
              brief: c.practice.brief,
              items: c.practice.items.map((item) => ({
                uid: uid(),
                label: item.label,
                detail: item.detail ?? '',
                options: item.options,
                correctIndex: item.correctIndex,
                feedback: item.feedback,
              })),
            }
          : {
              kind: 'written',
              title: c.practice.title,
              minutes: c.practice.minutes,
              brief: c.practice.brief,
              prompt: c.practice.prompt,
              modelAnswer: c.practice.modelAnswer,
            },
      assessment: {
        title: c.assessment.title,
        intro: c.assessment.intro,
        minutes: c.assessment.minutes,
        topic: c.assessment.topic ?? '',
        reviewTopic: c.assessment.reviewTopic ?? '',
        questions: c.assessment.questions.map((question) => ({
          uid: uid(),
          prompt: question.prompt,
          choices: question.choices.length ? question.choices : ['', ''],
          correctIndex: question.correctIndex,
          explanation: question.explanation,
        })),
      },
    },
  }
}

/* --------------------------- draft → payload --------------------------- */

const clean = (lines: string[]) => lines.map((line) => line.trim()).filter(Boolean)

function blocksToPayload(blocks: BlockDraft[]): LessonBlock[] {
  const out: LessonBlock[] = []
  for (const block of blocks) {
    if (block.type === 'p') {
      const text = block.text.trim()
      if (text) out.push({ type: 'p', text })
    } else if (block.type === 'h') {
      const text = block.text.trim()
      if (text) out.push({ type: 'h', text })
    } else if (block.type === 'note') {
      const title = block.title.trim()
      const text = block.text.trim()
      if (title && text) out.push({ type: 'note', title, text })
    } else {
      const items = clean(block.items)
      if (items.length) out.push({ type: block.type, items })
    }
  }
  return out
}

function sectionToInput(section: SectionDraft): CatalogSectionInput {
  const { content } = section
  const practice: CatalogSectionInput['content']['practice'] =
    content.practice.kind === 'classify'
      ? {
          kind: 'classify',
          title: content.practice.title.trim(),
          minutes: content.practice.minutes,
          brief: content.practice.brief.trim(),
          items: content.practice.items.map((item) => {
            const options = clean(item.options)
            return {
              label: item.label.trim(),
              detail: item.detail.trim() || undefined,
              options,
              correctIndex: Math.min(item.correctIndex, Math.max(0, options.length - 1)),
              feedback: item.feedback.trim(),
            }
          }),
        }
      : {
          kind: 'written',
          title: content.practice.title.trim(),
          minutes: content.practice.minutes,
          brief: content.practice.brief.trim(),
          prompt: content.practice.prompt.trim(),
          modelAnswer: content.practice.modelAnswer.trim(),
        }

  return {
    ...(section.id ? { id: section.id } : {}),
    title: section.title.trim(),
    description: section.description.trim(),
    minutes: section.minutes,
    content: {
      lesson: {
        title: content.lesson.title.trim(),
        minutes: content.lesson.minutes,
        intro: content.lesson.intro.trim(),
        blocks: blocksToPayload(content.lesson.blocks),
      },
      resources: content.resources.map((resource) => ({
        title: resource.title.trim(),
        kind: resource.kind,
        source: resource.source.trim(),
        minutes: resource.minutes,
        summary: resource.summary.trim(),
        body: clean(resource.body),
        url: resource.url.trim() || null,
      })),
      practice,
      assessment: {
        title: content.assessment.title.trim(),
        intro: content.assessment.intro.trim(),
        minutes: content.assessment.minutes,
        topic: content.assessment.topic.trim() || undefined,
        reviewTopic: content.assessment.reviewTopic.trim() || undefined,
        questions: content.assessment.questions.map((question) => {
          const choices = clean(question.choices)
          return {
            prompt: question.prompt.trim(),
            choices,
            correctIndex: Math.min(question.correctIndex, Math.max(0, choices.length - 1)),
            explanation: question.explanation.trim(),
          }
        }),
      },
    },
  }
}

export function draftToPayload(draft: FormDraft): CatalogPathInput {
  return {
    slug: draft.slug.trim() || undefined,
    subject: draft.subject.trim(),
    summary: draft.summary.trim(),
    goal: draft.goal.trim(),
    level: draft.level || null,
    tags: draft.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    weeklyHours: draft.weeklyHours,
    intensity: draft.intensity,
    formats: draft.formats,
    expectedWeeks: draft.expectedWeeks,
    expectedHours: draft.expectedHours,
    ogImage: draft.ogImage.trim() || null,
    sections: draft.sections.map(sectionToInput),
    published: draft.published,
  }
}

/** First blocking problem in the draft, or null when it is ready to send. */
export function validateDraft(draft: FormDraft): string | null {
  if (!draft.subject.trim()) return 'Give the path a subject.'
  if (draft.sections.length === 0) return 'Add at least one section.'
  for (let i = 0; i < draft.sections.length; i++) {
    const s = draft.sections[i]
    const n = i + 1
    if (!s.title.trim()) return `Section ${n}: add a title.`
    if (!s.content.lesson.title.trim()) return `Section ${n}: add a lesson title.`
    if (!s.content.lesson.intro.trim()) return `Section ${n}: add a lesson intro.`
    const hasBlock = s.content.lesson.blocks.some((b) =>
      b.type === 'p' || b.type === 'h'
        ? b.text.trim().length > 0
        : b.type === 'note'
          ? b.title.trim().length > 0 && b.text.trim().length > 0
          : b.items.some((item) => item.trim().length > 0),
    )
    if (!hasBlock) return `Section ${n}: add at least one lesson block.`
    if (s.content.resources.length === 0) return `Section ${n}: add at least one resource.`
    for (const r of s.content.resources) {
      if (!r.title.trim() || !r.source.trim() || !r.summary.trim())
        return `Section ${n}: complete each resource (title, source, summary).`
      if (!r.body.some((line) => line.trim()))
        return `Section ${n}: add resource body lines.`
    }
    const p = s.content.practice
    if (!p.title.trim() || !p.brief.trim())
      return `Section ${n}: complete the practice title and brief.`
    if (p.kind === 'written') {
      if (!p.prompt.trim() || !p.modelAnswer.trim())
        return `Section ${n}: complete the written prompt and model answer.`
    } else {
      if (p.items.length === 0) return `Section ${n}: add at least one practice item.`
      for (const item of p.items) {
        if (
          !item.label.trim() ||
          clean(item.options).length < 2 ||
          !item.feedback.trim()
        )
          return `Section ${n}: each practice item needs a label, two options and feedback.`
      }
    }
    const a = s.content.assessment
    if (!a.title.trim() || !a.intro.trim())
      return `Section ${n}: complete the assessment title and intro.`
    if (a.questions.length === 0) return `Section ${n}: add at least one question.`
    for (const q of a.questions) {
      if (!q.prompt.trim() || clean(q.choices).length < 2 || !q.explanation.trim())
        return `Section ${n}: each question needs a prompt, two choices and an explanation.`
    }
  }
  return null
}

/* ------------------------------ primitives ---------------------------- */

const inputClass =
  'w-full border border-on-band/20 bg-band px-3 py-2 text-[13.5px] text-on-band placeholder:text-on-band-dim focus:border-on-band/45 focus:outline-none'

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className={labelClass}>{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-[11.5px] text-on-band-dim">{hint}</span>}
    </label>
  )
}

const labelClass = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'

function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass, className)} {...rest} />
}

function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputClass, 'resize-y leading-relaxed', className)} {...rest} />
}

function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputClass, className)} {...rest}>
      {children}
    </select>
  )
}

/** Number input that keeps its own text so clearing/typing feels natural. */
function NumberInput({
  value,
  onChange,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => {
    setText((current) => (Number(current) === value ? current : String(value)))
  }, [value])
  return (
    <input
      type="number"
      min={0}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = Number(e.target.value)
        onChange(Number.isFinite(parsed) ? parsed : 0)
      }}
      className={cx(inputClass, className)}
      {...rest}
    />
  )
}

/** Textarea edited as raw text, committed to a string[] as you type. */
function ListTextarea({
  value,
  onLines,
  className,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string[]
  onLines: (lines: string[]) => void
}) {
  const [text, setText] = useState(() => value.join('\n'))
  return (
    <TextArea
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onLines(e.target.value.split('\n'))
      }}
      className={className}
      {...rest}
    />
  )
}

function Row({
  children,
  onRemove,
  onMove,
  removeLabel = 'Remove',
}: {
  children: ReactNode
  onRemove: () => void
  onMove?: { up: () => void; down: () => void; canUp: boolean; canDown: boolean }
  removeLabel?: string
}) {
  return (
    <div className="border border-on-band/15 bg-band p-4">
      <div className="mb-3 flex items-center justify-end gap-1.5">
        {onMove && (
          <>
            <button
              type="button"
              onClick={onMove.up}
              disabled={!onMove.canUp}
              className={cx(labelClass, 'px-1.5 py-0.5 hover:text-on-band disabled:opacity-30')}
            >
              up
            </button>
            <button
              type="button"
              onClick={onMove.down}
              disabled={!onMove.canDown}
              className={cx(labelClass, 'px-1.5 py-0.5 hover:text-on-band disabled:opacity-30')}
            >
              down
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onRemove}
          className={cx(labelClass, 'px-1.5 py-0.5 text-danger-bright hover:text-danger-bright/80')}
        >
          {removeLabel}
        </button>
      </div>
      {children}
    </div>
  )
}

/** Moves an item within an array (returns a new array). */
function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/* -------------------------------- form -------------------------------- */

export function CatalogForm({
  initial,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormDraft
  submitting: boolean
  submitLabel: string
  onSubmit: (input: CatalogPathInput) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<FormDraft>(initial)
  const [error, setError] = useState<string | null>(null)

  const section = draft.sections
  const patchSection = (i: number, patch: Partial<SectionDraft>) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const patchContent = (i: number, patch: Partial<ContentDraft>) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, idx) =>
        idx === i ? { ...s, content: { ...s.content, ...patch } } : s,
      ),
    }))
  const patchLesson = (i: number, patch: Partial<ContentDraft['lesson']>) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, idx) =>
        idx === i ? { ...s, content: { ...s.content, lesson: { ...s.content.lesson, ...patch } } } : s,
      ),
    }))
  const patchAssessment = (i: number, patch: Partial<AssessmentDraft>) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, idx) =>
        idx === i
          ? { ...s, content: { ...s.content, assessment: { ...s.content.assessment, ...patch } } }
          : s,
      ),
    }))
  const patchResources = (i: number, resources: ResourceDraft[]) => patchContent(i, { resources })

  const submit = () => {
    const problem = validateDraft(draft)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    onSubmit(draftToPayload(draft))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-w-0 space-y-8">
        {/* -------------------------- basics -------------------------- */}
        <section className="space-y-4 border border-on-band/15 bg-panel p-5">
          <h2 className={labelClass}>Path details</h2>
          <Field label="Subject">
            <TextInput
              value={draft.subject}
              maxLength={120}
              onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              placeholder="e.g. Public speaking"
            />
          </Field>
          <Field label="Summary" hint="One or two lines shown on the catalog card.">
            <TextArea
              value={draft.summary}
              maxLength={300}
              rows={2}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
            />
          </Field>
          <Field label="Goal" hint="What the learner walks away able to do.">
            <TextArea
              value={draft.goal}
              maxLength={500}
              rows={2}
              onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Level">
              <Select
                value={draft.level}
                onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value as ExperienceLevel | '' }))}
              >
                <option value="">Any</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" hint="Comma separated.">
              <TextInput
                value={draft.tagsText}
                onChange={(e) => setDraft((d) => ({ ...d, tagsText: e.target.value }))}
                placeholder="speaking, confidence"
              />
            </Field>
            <Field label="Slug" hint="Leave blank to generate from the subject.">
              <TextInput
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="public-speaking"
              />
            </Field>
          </div>
        </section>

        {/* -------------------------- sections ------------------------ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={labelClass}>Sections</h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDraft((d) => ({ ...d, sections: [...d.sections, emptySection()] }))}
            >
              Add section
            </Button>
          </div>

          {section.map((s, i) => (
            <div key={s.uid} className="border border-on-band/20 bg-panel">
              <div className="flex items-center justify-between gap-3 border-b border-on-band/10 px-5 py-3">
                <span className="font-mono text-[11px] text-on-band-dim">
                  {String(i + 1).padStart(2, '0')} · {s.title || 'Untitled section'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => setDraft((d) => ({ ...d, sections: move(d.sections, i, i - 1) }))}
                    className={cx(labelClass, 'px-1.5 py-0.5 hover:text-on-band disabled:opacity-30')}
                  >
                    up
                  </button>
                  <button
                    type="button"
                    disabled={i === section.length - 1}
                    onClick={() => setDraft((d) => ({ ...d, sections: move(d.sections, i, i + 1) }))}
                    className={cx(labelClass, 'px-1.5 py-0.5 hover:text-on-band disabled:opacity-30')}
                  >
                    down
                  </button>
                  <button
                    type="button"
                    disabled={section.length === 1}
                    onClick={() => setDraft((d) => ({ ...d, sections: d.sections.filter((_, idx) => idx !== i) }))}
                    className={cx(labelClass, 'px-1.5 py-0.5 text-danger-bright hover:text-danger-bright/80 disabled:opacity-30')}
                  >
                    remove
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field label="Title">
                    <TextInput value={s.title} maxLength={160} onChange={(e) => patchSection(i, { title: e.target.value })} />
                  </Field>
                  <Field label="Minutes">
                    <NumberInput value={s.minutes} onChange={(minutes) => patchSection(i, { minutes })} />
                  </Field>
                </div>
                <Field label="Description">
                  <TextArea
                    value={s.description}
                    maxLength={1000}
                    rows={2}
                    onChange={(e) => patchSection(i, { description: e.target.value })}
                  />
                </Field>

                <div className="border-t border-on-band/10 pt-4">
                  <p className={cx(labelClass, 'mb-3')}>Lesson</p>
                  <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                    <Field label="Lesson title">
                      <TextInput
                        value={s.content.lesson.title}
                        maxLength={200}
                        onChange={(e) => patchLesson(i, { title: e.target.value })}
                      />
                    </Field>
                    <Field label="Minutes">
                      <NumberInput
                        value={s.content.lesson.minutes}
                        onChange={(minutes) => patchLesson(i, { minutes })}
                      />
                    </Field>
                  </div>
                  <Field label="Intro" className="mt-4">
                    <TextArea
                      value={s.content.lesson.intro}
                      maxLength={2000}
                      rows={2}
                      onChange={(e) => patchLesson(i, { intro: e.target.value })}
                    />
                  </Field>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>Blocks</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          patchLesson(i, { blocks: [...s.content.lesson.blocks, emptyBlock()] })
                        }
                      >
                        Add block
                      </Button>
                    </div>
                    {s.content.lesson.blocks.map((block, bi) => (
                      <Row
                        key={block.uid}
                        onRemove={() =>
                          patchLesson(i, { blocks: s.content.lesson.blocks.filter((_, idx) => idx !== bi) })
                        }
                        onMove={{
                          up: () => patchLesson(i, { blocks: move(s.content.lesson.blocks, bi, bi - 1) }),
                          down: () => patchLesson(i, { blocks: move(s.content.lesson.blocks, bi, bi + 1) }),
                          canUp: bi > 0,
                          canDown: bi < s.content.lesson.blocks.length - 1,
                        }}
                      >
                        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                          <Select
                            value={block.type}
                            onChange={(e) => {
                              const type = e.target.value as LessonBlock['type']
                              const fresh: BlockDraft =
                                type === 'note'
                                  ? { uid: block.uid, type: 'note', title: '', text: '' }
                                  : type === 'list' || type === 'steps'
                                    ? { uid: block.uid, type, items: [''] }
                                    : { uid: block.uid, type, text: '' }
                              patchLesson(i, {
                                blocks: s.content.lesson.blocks.map((b, idx) => (idx === bi ? fresh : b)),
                              })
                            }}
                          >
                            {BLOCK_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Select>
                          {block.type === 'p' || block.type === 'h' ? (
                            <TextArea
                              key={block.type}
                              value={block.text}
                              rows={block.type === 'h' ? 1 : 3}
                              placeholder={block.type === 'h' ? 'Heading' : 'Paragraph'}
                              onChange={(e) =>
                                patchLesson(i, {
                                  blocks: s.content.lesson.blocks.map((b, idx) =>
                                    idx === bi ? { ...b, text: e.target.value } : b,
                                  ),
                                })
                              }
                            />
                          ) : block.type === 'note' ? (
                            <div key="note" className="space-y-2">
                              <TextInput
                                value={block.title}
                                placeholder="Note title"
                                onChange={(e) =>
                                  patchLesson(i, {
                                    blocks: s.content.lesson.blocks.map((b, idx) =>
                                      idx === bi && b.type === 'note' ? { ...b, title: e.target.value } : b,
                                    ),
                                  })
                                }
                              />
                              <TextArea
                                value={block.text}
                                rows={2}
                                placeholder="Note body"
                                onChange={(e) =>
                                  patchLesson(i, {
                                    blocks: s.content.lesson.blocks.map((b, idx) =>
                                      idx === bi && b.type === 'note' ? { ...b, text: e.target.value } : b,
                                    ),
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <ListTextarea
                              key={block.type}
                              value={block.items}
                              rows={3}
                              placeholder="One item per line"
                              onLines={(lines) =>
                                patchLesson(i, {
                                  blocks: s.content.lesson.blocks.map((b, idx) =>
                                    idx === bi && (b.type === 'list' || b.type === 'steps')
                                      ? { ...b, items: lines }
                                      : b,
                                  ),
                                })
                              }
                            />
                          )}
                        </div>
                      </Row>
                    ))}
                  </div>
                </div>

                {/* resources */}
                <ResourceEditor
                  resources={s.content.resources}
                  onChange={(resources) => patchResources(i, resources)}
                />

                {/* practice */}
                <PracticeEditor
                  practice={s.content.practice}
                  onChange={(practice) => patchContent(i, { practice })}
                />

                {/* assessment */}
                <AssessmentEditor
                  assessment={s.content.assessment}
                  onChange={(patch) => patchAssessment(i, patch)}
                />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* ---------------------------- sidebar --------------------------- */}
      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <div className="space-y-4 border border-on-band/15 bg-panel p-5">
          <h2 className={labelClass}>Publishing</h2>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
              className="h-4 w-4 accent-[var(--color-accent-bright)]"
            />
            <span className="text-[13.5px] text-on-band">Published</span>
          </label>
          <p className="text-[12px] leading-relaxed text-on-band-dim">
            A draft is hidden from the public site and search engines. You can publish once at least
            one section is ready.
          </p>
        </div>

        <div className="space-y-4 border border-on-band/15 bg-panel p-5">
          <h2 className={labelClass}>Plan</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weekly hours">
              <Select
                value={draft.weeklyHours}
                onChange={(e) => setDraft((d) => ({ ...d, weeklyHours: e.target.value as WeeklyHours }))}
              >
                {WEEKLY_HOURS.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Intensity">
              <Select
                value={draft.intensity}
                onChange={(e) => setDraft((d) => ({ ...d, intensity: e.target.value as Intensity }))}
              >
                {INTENSITIES.map((intensity) => (
                  <option key={intensity} value={intensity}>
                    {intensity}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Expected weeks">
              <NumberInput
                value={draft.expectedWeeks}
                onChange={(expectedWeeks) => setDraft((d) => ({ ...d, expectedWeeks }))}
              />
            </Field>
            <Field label="Expected hours">
              <NumberInput
                value={draft.expectedHours}
                onChange={(expectedHours) => setDraft((d) => ({ ...d, expectedHours }))}
              />
            </Field>
          </div>
          <div>
            <span className={labelClass}>Formats</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FORMATS.map((format) => (
                <label key={format} className="flex items-center gap-2 text-[13px] text-on-band-muted">
                  <input
                    type="checkbox"
                    checked={draft.formats.includes(format)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        formats: e.target.checked
                          ? [...d.formats, format]
                          : d.formats.filter((value) => value !== format),
                      }))
                    }
                    className="h-4 w-4 accent-[var(--color-accent-bright)]"
                  />
                  {format}
                </label>
              ))}
            </div>
          </div>
          <Field label="Cover image URL" hint="Optional, used for social cards.">
            <TextInput
              value={draft.ogImage}
              onChange={(e) => setDraft((d) => ({ ...d, ogImage: e.target.value }))}
              placeholder="https://…"
            />
          </Field>
        </div>

        {error && (
          <div className="border border-danger-bright/40 bg-danger-bright/10 px-4 py-3">
            <p className="text-[13px] leading-relaxed text-danger-bright">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" loading={submitting} className="flex-1">
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </aside>
    </form>
  )
}

/* ------------------------------ resources ----------------------------- */

function ResourceEditor({
  resources,
  onChange,
}: {
  resources: ResourceDraft[]
  onChange: (resources: ResourceDraft[]) => void
}) {
  return (
    <div className="border-t border-on-band/10 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={labelClass}>Resources</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange([
              ...resources,
              { uid: uid(), title: '', kind: 'article', source: '', minutes: 10, summary: '', body: [''], url: '' },
            ])
          }
        >
          Add resource
        </Button>
      </div>
      <div className="space-y-3">
        {resources.map((resource, i) => (
          <Row
            key={resource.uid}
            onRemove={() => onChange(resources.filter((_, idx) => idx !== i))}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_120px_100px]">
              <Field label="Title">
                <TextInput
                  value={resource.title}
                  onChange={(e) =>
                    onChange(resources.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))
                  }
                />
              </Field>
              <Field label="Kind">
                <Select
                  value={resource.kind}
                  onChange={(e) =>
                    onChange(
                      resources.map((r, idx) =>
                        idx === i ? { ...r, kind: e.target.value as Resource['kind'] } : r,
                      ),
                    )
                  }
                >
                  {RESOURCE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Source">
                <TextInput
                  value={resource.source}
                  onChange={(e) =>
                    onChange(resources.map((r, idx) => (idx === i ? { ...r, source: e.target.value } : r)))
                  }
                />
              </Field>
              <Field label="Minutes">
                <NumberInput
                  value={resource.minutes}
                  onChange={(minutes) =>
                    onChange(resources.map((r, idx) => (idx === i ? { ...r, minutes } : r)))
                  }
                />
              </Field>
            </div>
            <Field label="Summary" className="mt-3">
              <TextInput
                value={resource.summary}
                onChange={(e) =>
                  onChange(resources.map((r, idx) => (idx === i ? { ...r, summary: e.target.value } : r)))
                }
              />
            </Field>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Body" hint="One line per paragraph.">
                <ListTextarea
                  value={resource.body}
                  rows={4}
                  onLines={(body) => onChange(resources.map((r, idx) => (idx === i ? { ...r, body } : r)))}
                />
              </Field>
              <Field label="Link" hint="Optional. YouTube or Vimeo embeds inline.">
                <TextInput
                  value={resource.url}
                  onChange={(e) =>
                    onChange(resources.map((r, idx) => (idx === i ? { ...r, url: e.target.value } : r)))
                  }
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Row>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------- practice ----------------------------- */

function PracticeEditor({
  practice,
  onChange,
}: {
  practice: PracticeDraft
  onChange: (practice: PracticeDraft) => void
}) {
  return (
    <div className="border-t border-on-band/10 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={labelClass}>Practice</span>
        <div className="w-40">
          <Select
            value={practice.kind}
            onChange={(e) => {
              const kind = e.target.value as PracticeDraft['kind']
              if (kind === practice.kind) return
              onChange(
                kind === 'classify'
                  ? {
                      kind: 'classify',
                      title: practice.title,
                      minutes: practice.minutes,
                      brief: practice.brief,
                      items: [
                        { uid: uid(), label: '', detail: '', options: ['', ''], correctIndex: 0, feedback: '' },
                      ],
                    }
                  : {
                      kind: 'written',
                      title: practice.title,
                      minutes: practice.minutes,
                      brief: practice.brief,
                      prompt: '',
                      modelAnswer: '',
                    },
              )
            }}
          >
            <option value="written">written</option>
            <option value="classify">classify</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Field label="Title">
          <TextInput value={practice.title} onChange={(e) => onChange({ ...practice, title: e.target.value })} />
        </Field>
        <Field label="Minutes">
          <NumberInput value={practice.minutes} onChange={(minutes) => onChange({ ...practice, minutes })} />
        </Field>
      </div>
      <Field label="Brief" className="mt-3">
        <TextArea
          value={practice.brief}
          rows={2}
          onChange={(e) => onChange({ ...practice, brief: e.target.value })}
        />
      </Field>

      {practice.kind === 'written' ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Prompt">
            <TextArea
              value={practice.prompt}
              rows={3}
              onChange={(e) => onChange({ ...practice, prompt: e.target.value })}
            />
          </Field>
          <Field label="Model answer">
            <TextArea
              value={practice.modelAnswer}
              rows={3}
              onChange={(e) => onChange({ ...practice, modelAnswer: e.target.value })}
            />
          </Field>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Items</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange({
                  ...practice,
                  items: [
                    ...practice.items,
                    { uid: uid(), label: '', detail: '', options: ['', ''], correctIndex: 0, feedback: '' },
                  ],
                })
              }
            >
              Add item
            </Button>
          </div>
          {practice.items.map((item, i) => (
            <Row
              key={item.uid}
              onRemove={() =>
                onChange({ ...practice, items: practice.items.filter((_, idx) => idx !== i) })
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label">
                  <TextInput
                    value={item.label}
                    onChange={(e) =>
                      onChange({
                        ...practice,
                        items: practice.items.map((it, idx) =>
                          idx === i ? { ...it, label: e.target.value } : it,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Detail" hint="Optional.">
                  <TextInput
                    value={item.detail}
                    onChange={(e) =>
                      onChange({
                        ...practice,
                        items: practice.items.map((it, idx) =>
                          idx === i ? { ...it, detail: e.target.value } : it,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Options" hint="One per line.">
                  <ListTextarea
                    value={item.options}
                    rows={3}
                    onLines={(options) =>
                      onChange({
                        ...practice,
                        items: practice.items.map((it, idx) => (idx === i ? { ...it, options } : it)),
                      })
                    }
                  />
                </Field>
                <div className="space-y-3">
                  <Field label="Correct option">
                    <Select
                      value={item.correctIndex}
                      onChange={(e) =>
                        onChange({
                          ...practice,
                          items: practice.items.map((it, idx) =>
                            idx === i ? { ...it, correctIndex: Number(e.target.value) } : it,
                          ),
                        })
                      }
                    >
                      {item.options.map((option, oi) => (
                        <option key={oi} value={oi}>
                          {option.trim() || `Option ${oi + 1}`}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Feedback">
                    <TextArea
                      value={item.feedback}
                      rows={2}
                      onChange={(e) =>
                        onChange({
                          ...practice,
                          items: practice.items.map((it, idx) =>
                            idx === i ? { ...it, feedback: e.target.value } : it,
                          ),
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            </Row>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ assessment ---------------------------- */

function AssessmentEditor({
  assessment,
  onChange,
}: {
  assessment: AssessmentDraft
  onChange: (patch: Partial<AssessmentDraft>) => void
}) {
  return (
    <div className="border-t border-on-band/10 pt-4">
      <span className={cx(labelClass, 'mb-3 block')}>Assessment</span>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Field label="Title">
          <TextInput
            value={assessment.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Minutes">
          <NumberInput value={assessment.minutes} onChange={(minutes) => onChange({ minutes })} />
        </Field>
      </div>
      <Field label="Intro" className="mt-3">
        <TextArea value={assessment.intro} rows={2} onChange={(e) => onChange({ intro: e.target.value })} />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Topic" hint="Short name shown in results.">
          <TextInput value={assessment.topic} onChange={(e) => onChange({ topic: e.target.value })} />
        </Field>
        <Field label="Review topic" hint="What to revisit on a low score.">
          <TextInput
            value={assessment.reviewTopic}
            onChange={(e) => onChange({ reviewTopic: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={labelClass}>Questions</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange({
              questions: [
                ...assessment.questions,
                { uid: uid(), prompt: '', choices: ['', ''], correctIndex: 0, explanation: '' },
              ],
            })
          }
        >
          Add question
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {assessment.questions.map((question, i) => (
          <Row
            key={question.uid}
            onRemove={() =>
              onChange({ questions: assessment.questions.filter((_, idx) => idx !== i) })
            }
          >
            <Field label="Prompt">
              <TextArea
                value={question.prompt}
                rows={2}
                onChange={(e) =>
                  onChange({
                    questions: assessment.questions.map((q, idx) =>
                      idx === i ? { ...q, prompt: e.target.value } : q,
                    ),
                  })
                }
              />
            </Field>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Choices" hint="One per line.">
                <ListTextarea
                  value={question.choices}
                  rows={3}
                  onLines={(choices) =>
                    onChange({
                      questions: assessment.questions.map((q, idx) =>
                        idx === i ? { ...q, choices } : q,
                      ),
                    })
                  }
                />
              </Field>
              <div className="space-y-3">
                <Field label="Correct choice">
                  <Select
                    value={question.correctIndex}
                    onChange={(e) =>
                      onChange({
                        questions: assessment.questions.map((q, idx) =>
                          idx === i ? { ...q, correctIndex: Number(e.target.value) } : q,
                        ),
                      })
                    }
                  >
                    {question.choices.map((choice, ci) => (
                      <option key={ci} value={ci}>
                        {choice.trim() || `Choice ${ci + 1}`}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Explanation">
                  <TextArea
                    value={question.explanation}
                    rows={2}
                    onChange={(e) =>
                      onChange({
                        questions: assessment.questions.map((q, idx) =>
                          idx === i ? { ...q, explanation: e.target.value } : q,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          </Row>
        ))}
      </div>
    </div>
  )
}

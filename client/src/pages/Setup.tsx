import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type {
  ExperienceLevel,
  GoalReason,
  Intensity,
  LearningFormat,
  SetupAnswers,
  WeeklyHours,
  Weekday,
  TimeWindow,
} from '../types'
import { useApp } from '../state/store'
import { aiApi, type AiTimelineEstimate } from '../lib/api'
import { Logo } from '../components/ui/Logo'
import { ChoiceCard } from '../components/ui/Choice'
import { Field } from '../components/ui/ProgressBar'
import { Sweep } from '../components/ui/Sweep'
import { DatePickerField } from '../components/ui/DatePickerField'
import { cx } from '../lib/utils'
import { extractGoal, offlineAdmireCandidates, candidateToExtraction, type AdmireCandidate, type GoalExtraction, type GoalMode } from '../lib/goalExtract'
import { AdmireCandidatesModal } from '../components/modals/AdmireCandidatesModal'

const steps = [
  'What do you want to learn?',
  'Your experience',
  'Why, and what for',
  'Time each week',
  'Formats',
  'Intensity',
  'Your timeline',
]

/* One clarifying line per step, so a heading never has to be repeated as a
   field label. */
const stepHints = [
  'Anything at all. Name the subject, a person whose skills you want, or something you want to build.',
  'So the path starts at the right level instead of the beginning.',
  'The reason shapes what the path puts first.',
  'Be honest about it. Every session is scheduled from this number.',
  'Mix as many as you like.',
  'How much do you want each session to push you?',
  'We work back from a finish date, and you can change your mind later.',
]

/* Setup styles its own primitives rather than the shared kit, so the flow can
   read like the public pages without restyling screens that have not been
   reviewed yet. Square corners, hairline borders, no icons. */
const monoNote = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'

const setupInput =
  'w-full border border-on-band/20 bg-band-soft px-4 py-3 text-[15px] text-on-band ' +
  'placeholder:text-on-band-dim transition-colors duration-150 hover:border-on-band/35 ' +
  'focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/20'

const setupPrimary =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors disabled:pointer-events-none disabled:opacity-50'

const setupGhost =
  'inline-flex h-12 items-center justify-center border border-on-band/20 px-6 text-[14.5px] ' +
  'font-medium text-on-band transition-colors hover:border-on-band/45'

const setupSecondary =
  'group relative inline-flex h-11 items-center justify-center overflow-hidden border ' +
  'border-on-band/20 px-6 text-[14px] font-medium text-on-band transition-colors ' +
  'hover:border-on-band/45 disabled:pointer-events-none disabled:opacity-50'

const groupLabel = 'text-[14.5px] font-medium text-on-band'
const groupHint = 'mt-1 text-[13px] leading-relaxed text-on-band-dim'

/** Small square-cornered choice used for tags and day pickers. */
function Tag({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'border px-3.5 py-2 text-[13.5px] transition-colors',
        selected
          ? 'border-accent-bright bg-accent-bright/15 text-accent-bright'
          : 'border-on-band/15 text-on-band-muted hover:border-on-band/35 hover:text-on-band',
        className,
      )}
    >
      {children}
    </button>
  )
}

const subjects = [
  'Project Management',
  'Photography',
  'Spanish',
  'Digital Marketing',
  'Finance',
  'Data Analysis',
  'C++',
  'Public Speaking',
  'Product Management',
  'Graphic Design',
]

const goalModes: { id: GoalMode; label: string; hint: string }[] = [
  { id: 'topic', label: 'A skill or topic', hint: 'Type it or pick one' },
  { id: 'admire', label: 'Someone I admire', hint: 'Copy their skills' },
  { id: 'build', label: 'Something to build', hint: 'Work back from it' },
]

const experiences: { id: ExperienceLevel; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Complete beginner', hint: 'Starting from zero' },
  { id: 'some', label: 'Some experience', hint: 'Read a bit, tried a little' },
  { id: 'comfortable', label: 'Comfortable', hint: 'I can hold my own' },
  { id: 'advanced', label: 'Advanced', hint: 'Looking to sharpen specific skills' },
]

const reasons: { id: GoalReason; label: string }[] = [
  { id: 'career', label: 'Career' },
  { id: 'school', label: 'School' },
  { id: 'growth', label: 'Personal development' },
  { id: 'career-change', label: 'Career change' },
  { id: 'project', label: 'Specific project' },
  { id: 'other', label: 'Other' },
]

const hours: { id: WeeklyHours; label: string; hint: string }[] = [
  { id: '2', label: '2 hours', hint: 'Light and steady' },
  { id: '5', label: '5 hours', hint: 'A session most days' },
  { id: '10', label: '10 hours', hint: 'Serious momentum' },
  { id: '15+', label: '15+ hours', hint: 'Full commitment' },
]

const weekdays: { id: Weekday; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

const timeWindows: { id: TimeWindow; label: string; hint: string }[] = [
  { id: 'morning', label: 'Morning', hint: 'Fresh start, sharp focus' },
  { id: 'afternoon', label: 'Afternoon', hint: 'Mid-day momentum' },
  { id: 'evening', label: 'Evening', hint: 'Wind down and learn' },
  { id: 'anytime', label: 'Anytime', hint: 'Flow with your day' },
]

const formats: { id: LearningFormat; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'books', label: 'Books' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'projects', label: 'Projects' },
  { id: 'quizzes', label: 'Quizzes' },
]

const intensities: { id: Intensity; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: 'Short sessions, no pressure' },
  { id: 'balanced', label: 'Balanced', hint: 'Steady pace, weekly wins' },
  { id: 'intensive', label: 'Intensive', hint: 'Push hard, finish sooner' },
]

/* ---------- timeline: turn "when do I finish?" into a helpful duration ----
   Asking for an end date up front is meaningless without knowing the start.
   Instead we estimate a realistic duration from the answers they already gave,
   then let them pick a start day and a pace; the finish date is derived. */

const HOURS_BASE_MONTHS: Record<WeeklyHours, number> = { '2': 12, '5': 6, '10': 4, '15+': 3 }
const INTENSITY_FACTOR: Record<Intensity, number> = { relaxed: 1.2, balanced: 1, intensive: 0.85 }
const EXPERIENCE_FACTOR: Record<ExperienceLevel, number> = {
  beginner: 1.15,
  some: 1.05,
  comfortable: 1,
  advanced: 0.9,
}

function recommendedMonths(setup: SetupAnswers): number {
  const base = setup.weeklyHours ? HOURS_BASE_MONTHS[setup.weeklyHours] : 6
  const intensity = setup.intensity ? INTENSITY_FACTOR[setup.intensity] : 1
  const experience = setup.experience ? EXPERIENCE_FACTOR[setup.experience] : 1
  return Math.max(1, Math.round(base * intensity * experience))
}

function monthLabel(months: number): string {
  return months === 1 ? '1 month' : `${months} months`
}

function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setMonth(base.getMonth() + months)
  const mm = String(base.getMonth() + 1).padStart(2, '0')
  const dd = String(base.getDate()).padStart(2, '0')
  return `${base.getFullYear()}-${mm}-${dd}`
}

const timelineFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

function finishDate(startISO: string, months: number): string {
  return timelineFmt.format(new Date(addMonths(startISO || todayISO(), months)))
}

function formatISO(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return timelineFmt.format(new Date(y, m - 1, d))
}

export function SetupPage() {
  const { state, patchSetup } = useApp()
  const navigate = useNavigate()
  const setup = state.setup
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [startISO, setStartISO] = useState(todayISO())
  const [durationMonths, setDurationMonths] = useState<number | null>(null)
  const [mode, setMode] = useState<GoalMode>('topic')
  const [aim, setAim] = useState('')
  const [extraction, setExtraction] = useState<GoalExtraction | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [candidates, setCandidates] = useState<AdmireCandidate[]>([])
  const [searching, setSearching] = useState(false)
  const [admireOpen, setAdmireOpen] = useState(false)
  const [admireOffline, setAdmireOffline] = useState(false)
  const [aiTimeline, setAiTimeline] = useState<AiTimelineEstimate | null>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // Fetch AI timeline estimation for the learner's specific topic and parameters
  useEffect(() => {
    if (!setup.subject.trim()) return
    if (step !== 6) return

    let active = true
    setLoadingTimeline(true)
    aiApi
      .estimateTimeline({
        subject: setup.subject,
        outcome: setup.outcome,
        experience: setup.experience,
        weeklyHours: setup.weeklyHours,
        intensity: setup.intensity,
      })
      .then((est) => {
        if (active) setAiTimeline(est)
      })
      .catch(() => {
        // Graceful fallback to static calculation
      })
      .finally(() => {
        if (active) setLoadingTimeline(false)
      })

    return () => {
      active = false
    }
  }, [step, setup.subject, setup.outcome, setup.experience, setup.weeklyHours, setup.intensity])

  const progress = ((step + 1) / steps.length) * 100

  const baseRecMonths = recommendedMonths(setup)
  const recMonths = aiTimeline?.recommendedMonths ?? baseRecMonths
  const fastMonths = aiTimeline?.fastMonths ?? Math.max(1, Math.round(recMonths * 0.65))
  const relaxedMonths = aiTimeline?.relaxedMonths ?? Math.max(recMonths + 1, Math.round(recMonths * 1.5))
  const seenMonths = new Set<number>()
  const durationOptions = [
    { months: fastMonths, tag: 'Fastest', hint: 'Push the pace' },
    { months: recMonths, tag: 'Recommended', hint: 'Steady and sustainable' },
    { months: relaxedMonths, tag: 'Relaxed', hint: 'More breathing room' },
  ].filter((option) => (seenMonths.has(option.months) ? false : (seenMonths.add(option.months), true)))

  const validate = (): string | null => {
    switch (step) {
      case 0:
        if (mode !== 'topic' && !extraction)
          return mode === 'admire'
            ? 'Find and pick the person closest to who you mean.'
            : 'Describe it, then find the skills.'
        if (setup.subject.trim().length < 2) return 'Tell us what you want to learn.'
        if (setup.subject.trim().length > 120) return 'Keep the subject under 120 characters.'
        if (aim.trim().length > 500) return 'Keep that description under 500 characters.'
        return null
      case 1:
        return setup.experience ? null : 'Pick the option closest to you.'
      case 2:
        if (!setup.reason) return 'Why are you learning this?'
        if (setup.outcome.trim().length < 5) return 'Describe what you want to be able to do.'
        if (setup.outcome.trim().length > 500) return 'Keep your goal under 500 characters.'
        return null
      case 3:
        return setup.weeklyHours ? null : 'Choose how much time you have.'
      case 4:
        return setup.formats.length > 0 ? null : 'Pick at least one format.'
      case 5:
        return setup.intensity ? null : 'Choose an intensity.'
      default:
        return null
    }
  }

  const next = (e?: FormEvent) => {
    e?.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    if (step < steps.length - 1) setStep(step + 1)
    else navigate('/generate')
  }

  const back = () => {
    setError('')
    if (step > 0) setStep(step - 1)
    else navigate('/')
  }

  const changeMode = (next: GoalMode) => {
    setMode(next)
    setError('')
    setExtraction(null)
    setAim('')
    setCandidates([])
    setAdmireOpen(false)
  }

  const runExtract = async () => {
    if (mode === 'topic' || aim.trim().length < 3) return
    setError('')
    setExtracting(true)
    setExtraction(null)
    try {
      const result = await aiApi.extractGoal(mode, aim.trim())
      setExtraction(result)
      patchSetup({ subject: result.subject, outcome: result.outcome })
    } catch {
      // Offline fallback: keyword match so the flow still works end to end.
      const result = extractGoal(mode, aim)
      setExtraction({ ...result, offline: true })
      patchSetup({ subject: result.subject, outcome: result.outcome })
    } finally {
      setExtracting(false)
    }
  }

  /** Asks the AI for people matching the description, then opens the picker. */
  const runAdmireSearch = async () => {
    if (aim.trim().length < 3) return
    setError('')
    setSearching(true)
    setExtraction(null)
    try {
      const found = await aiApi.searchAdmire(aim.trim())
      setCandidates(found)
      setAdmireOffline(false)
    } catch {
      // Offline fallback: one keyword-matched candidate so the flow still works.
      setCandidates(offlineAdmireCandidates(aim))
      setAdmireOffline(true)
    } finally {
      setSearching(false)
      setAdmireOpen(true)
    }
  }

  const chooseAdmire = (candidate: AdmireCandidate) => {
    const result = candidateToExtraction(candidate, admireOffline)
    setExtraction(result)
    patchSetup({ subject: result.subject, outcome: result.outcome })
    setAdmireOpen(false)
    setError('')
  }

  const toggleFormat = (id: LearningFormat) => {
    patchSetup({
      formats: setup.formats.includes(id)
        ? setup.formats.filter((f) => f !== id)
        : [...setup.formats, id],
    })
  }

  const toggleDay = (id: Weekday) => {
    patchSetup({
      days: setup.days.includes(id) ? setup.days.filter((d) => d !== id) : [...setup.days, id],
    })
  }

  const chooseDuration = (months: number) => {
    setDurationMonths(months)
    patchSetup({ targetDate: addMonths(startISO || todayISO(), months) })
  }

  const changeStart = (iso: string) => {
    setStartISO(iso)
    if (durationMonths) patchSetup({ targetDate: addMonths(iso || todayISO(), durationMonths) })
  }

  return (
    <div className="app-theme min-h-screen bg-band">
      <header className="border-b border-on-band/10">
        <div className="mx-auto flex h-[76px] max-w-[1060px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" aria-label="Sawari home">
            <Logo size="sm" />
          </Link>
          <span className={monoNote}>
            step {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
        </div>
        <div className="h-[3px] w-full bg-on-band/10">
          <div className="bar-fill h-full bg-accent-bright" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-[1060px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <form onSubmit={next} key={step}>
          <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
            <aside className="hidden lg:block">
              <p className={monoNote}>your path</p>
              <ol className="mt-5">
                {steps.map((title, i) => (
                  <li
                    key={title}
                    className={cx(
                      'flex items-baseline gap-3 border-t border-on-band/10 py-2.5 text-[13px]',
                      i === step ? 'text-on-band' : 'text-on-band-dim',
                    )}
                  >
                    <span className={monoNote}>{String(i + 1).padStart(2, '0')}</span>
                    {title}
                  </li>
                ))}
              </ol>
            </aside>

            <div className="animate-rise">
              <p className={monoNote}>step {String(step + 1).padStart(2, '0')}</p>
              <h1 className="mt-3 max-w-[620px] font-display text-[28px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[34px]">
                {steps[step]}
              </h1>
              <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-on-band-muted">
                {stepHints[step]}
              </p>

            {/* step 0 */}
            {step === 0 && (
              <div className="mt-7">
                <div className="grid gap-2 sm:grid-cols-3">
                  {goalModes.map((option) => {
                    const active = mode === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => changeMode(option.id)}
                        aria-pressed={active}
                        className={cx(
                          'border px-4 py-3.5 text-left transition-colors duration-150',
                          active
                            ? 'border-accent-bright bg-accent-bright/10'
                            : 'border-on-band/15 hover:border-on-band/35',
                        )}
                      >
                        <span
                          className={cx(
                            'block text-[13.5px]',
                            active ? 'text-accent-bright' : 'text-on-band',
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="mt-1 block truncate text-[11.5px] text-on-band-dim">
                          {option.hint}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {mode === 'topic' && (
                  <div className="mt-6">
                    <Field
                      label="Subject"
                      htmlFor="subject"
                      hint="Anything. We will build the path around it."
                      error={error}
                    >
                      <input
                        id="subject"
                        value={setup.subject}
                        maxLength={120}
                        onChange={(e) => patchSetup({ subject: e.target.value })}
                        placeholder="Project Management"
                        autoFocus
                        className={cx(setupInput, error && 'border-danger')}
                      />
                    </Field>
                    <div className="mt-6">
                      <p className={cx(monoNote, 'mb-3')}>popular right now</p>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map((subject) => (
                          <Tag
                            key={subject}
                            selected={setup.subject === subject}
                            onClick={() => patchSetup({ subject })}
                          >
                            {subject}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'admire' && (
                  <div className="mt-6">
                    <Field
                      label="Person you admire"
                      htmlFor="admire"
                      hint="Name someone, or describe who you mean. We suggest the closest matches so you can pick the one you had in mind."
                    >
                      <input
                        id="admire"
                        value={aim}
                        maxLength={200}
                        onChange={(e) => {
                          setAim(e.target.value)
                          setExtraction(null)
                          setCandidates([])
                        }}
                        placeholder="e.g. a product designer known for design systems"
                        autoFocus
                        className={setupInput}
                      />
                    </Field>
                    <button
                      type="button"
                      className={cx(setupSecondary, 'mt-4')}
                      onClick={runAdmireSearch}
                      disabled={searching || aim.trim().length < 3}
                    >
                      <Sweep tone="soft" />
                      <span className="relative">
                        {searching ? 'Finding people…' : 'Find people'}
                      </span>
                    </button>
                  </div>
                )}

                {mode === 'build' && (
                  <div className="mt-6">
                    <Field
                      label="What do you want to build?"
                      htmlFor="build"
                      hint="Describe it in a sentence. We work out the skills it takes, then build the path."
                    >
                      <textarea
                        id="build"
                        rows={3}
                        value={aim}
                        maxLength={500}
                        onChange={(e) => {
                          setAim(e.target.value)
                          setExtraction(null)
                        }}
                        placeholder="A booking website for my photography studio"
                        autoFocus
                        className={cx(setupInput, 'resize-y leading-relaxed')}
                      />
                    </Field>
                    <button
                      type="button"
                      className={cx(setupSecondary, 'mt-4')}
                      onClick={runExtract}
                      disabled={extracting || aim.trim().length < 3}
                    >
                      <Sweep tone="soft" />
                      <span className="relative">
                        {extracting ? 'Finding the skills…' : 'Find the skills'}
                      </span>
                    </button>
                  </div>
                )}

                {extraction && mode !== 'topic' && (
                  <div className="mt-6 animate-rise border border-accent-bright/40 bg-accent-bright/10 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className={cx(monoNote, 'text-accent-bright')}>{extraction.note}</p>
                      {extraction.offline && (
                        <span className={cx(monoNote, 'text-accent-bright/70')}>offline</span>
                      )}
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-on-band">
                      Your path will be built around{' '}
                      <span className="font-medium">{extraction.subject}</span>.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {extraction.skills.map((skill) => (
                        <span
                          key={skill}
                          className="border border-on-band/15 px-2.5 py-1 text-[12.5px] text-on-band-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className={cx(monoNote, 'mt-4')}>goal · {extraction.outcome}</p>
                  </div>
                )}

                {error && mode !== 'topic' && <p className="mt-3 text-[13px] text-danger">{error}</p>}
              </div>
            )}

            {/* step 1 */}
            {step === 1 && (
              <div className="mt-7 space-y-2.5">
                {experiences.map((option) => (
                  <ChoiceCard
                    key={option.id}
                    selected={setup.experience === option.id}
                    onClick={() => patchSetup({ experience: option.id })}
                    label={option.label}
                    description={option.hint}
                  />
                ))}
                {error && <p className="text-[13px] text-danger">{error}</p>}
              </div>
            )}

            {/* step 2 */}
            {step === 2 && (
              <div className="mt-7 space-y-7">
                <div>
                  <p className={cx(groupLabel, 'mb-3')}>Why are you learning this?</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {reasons.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        selected={setup.reason === option.id}
                        onClick={() => patchSetup({ reason: option.id })}
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>
                <Field
                  label="What do you want to be able to do?"
                  htmlFor="outcome"
                  hint="One sentence. This becomes your goal."
                  error={error && error.startsWith('Describe') ? error : undefined}
                >
                  <textarea
                    id="outcome"
                    rows={3}
                    value={setup.outcome}
                    maxLength={500}
                    onChange={(e) => patchSetup({ outcome: e.target.value })}
                    placeholder="Run a project from planning through delivery without second guessing myself."
                    className={cx(setupInput, 'resize-y leading-relaxed')}
                  />
                </Field>
                {error && !error.startsWith('Describe') && (
                  <p className="-mt-4 text-[13px] text-danger">{error}</p>
                )}
              </div>
            )}

            {/* step 3 */}
            {step === 3 && (
              <div className="mt-8 space-y-8">
                <div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {hours.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        selected={setup.weeklyHours === option.id}
                        onClick={() => patchSetup({ weeklyHours: option.id })}
                        label={option.label}
                        description={option.hint}
                      />
                    ))}
                  </div>
                  {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
                </div>

                <div>
                  <p className={groupLabel}>Preferred days</p>
                  <p className={groupHint}>
                    Optional — pick the days you usually study. We schedule sessions for them.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <Tag
                        key={day.id}
                        selected={setup.days.includes(day.id)}
                        onClick={() => toggleDay(day.id)}
                      >
                        {day.label}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={groupLabel}>Best time of day</p>
                  <p className={groupHint}>
                    We put your toughest material in your best hours. (Optional)
                  </p>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {timeWindows.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        selected={setup.timeWindow === option.id}
                        onClick={() => patchSetup({ timeWindow: option.id })}
                        label={option.label}
                        description={option.hint}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* step 4 */}
            {step === 4 && (
              <div className="mt-7">
                <p className="mb-1 text-[14.5px] text-on-band-muted">
                  Choose as many as you like. We will mix them.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {formats.map((format) => (
                    <Tag
                      key={format.id}
                      selected={setup.formats.includes(format.id)}
                      onClick={() => toggleFormat(format.id)}
                      className="px-4 py-2.5"
                    >
                      {format.label}
                    </Tag>
                  ))}
                </div>
                {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
              </div>
            )}

            {/* step 5 */}
            {step === 5 && (
              <div className="mt-7 space-y-2.5">
                {intensities.map((option) => (
                  <ChoiceCard
                    key={option.id}
                    selected={setup.intensity === option.id}
                    onClick={() => patchSetup({ intensity: option.id })}
                    label={option.label}
                    description={option.hint}
                  />
                ))}
                {error && <p className="text-[13px] text-danger">{error}</p>}
              </div>
            )}

            {/* step 6 */}
            {step === 6 && (
              <div className="mt-7 space-y-6">
                <div className="border border-accent-bright/40 bg-accent-bright/10 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={cx(monoNote, 'text-accent-bright')}>ai recommended timeline</p>
                    {loadingTimeline && (
                      <span className={monoNote}>analyzing {setup.subject}…</span>
                    )}
                  </div>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-on-band-muted">
                    {aiTimeline?.reason ? (
                      aiTimeline.reason
                    ) : (
                      <>
                        At{' '}
                        <span className="font-semibold text-ink">
                          {setup.weeklyHours ? `${setup.weeklyHours} hours a week` : 'your current pace'}
                        </span>
                        {setup.intensity && (
                          <>
                            {' '}
                            on a <span className="font-semibold text-ink">{setup.intensity}</span> pace
                          </>
                        )}
                        , realistic mastery for <span className="font-semibold text-ink">{setup.subject}</span> takes about{' '}
                        <span className="font-semibold text-ink">{monthLabel(recMonths)}</span>. The fastest
                        focused path is around{' '}
                        <span className="font-semibold text-ink">{monthLabel(fastMonths)}</span>.
                      </>
                    )}
                  </p>
                </div>

                <Field
                  label="When do you want to start?"
                  htmlFor="start"
                  hint="We use this to work out your finish date. Defaults to today."
                >
                  <DatePickerField
                    id="start"
                    value={startISO}
                    onChange={changeStart}
                    placeholder="Today"
                  />
                </Field>

                <div>
                  <p className={groupLabel}>How long do you want to give it?</p>
                  <p className={cx(groupHint, 'mb-4')}>
                    Pick a pace, we will set your finish date for you.
                  </p>
                  <div className="space-y-2.5">
                    {durationOptions.map((option) => (
                      <ChoiceCard
                        key={option.months}
                        selected={durationMonths === option.months}
                        onClick={() => chooseDuration(option.months)}
                        label={`${monthLabel(option.months)} · ${option.tag}`}
                        description={`${option.hint} · finish ${finishDate(startISO, option.months)}`}
                      />
                    ))}
                  </div>
                  {setup.targetDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setDurationMonths(null)
                        patchSetup({ targetDate: '' })
                      }}
                      className="mt-4 text-[13.5px] font-medium text-accent-bright transition-colors hover:text-on-band"
                    >
                      No timeline, keep it open
                    </button>
                  )}
                </div>

                <div className="border border-on-band/15 px-5 py-4">
                  <p className={monoNote}>quick look</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-on-band-muted">
                    <span className="text-on-band">{setup.subject}</span>
                    {setup.experience &&
                      ` · ${experiences.find((e) => e.id === setup.experience)?.label.toLowerCase()}`}
                    {setup.weeklyHours && ` · ${setup.weeklyHours} hours a week`}
                    {setup.days.length > 0 &&
                      ` · ${setup.days.map((d) => weekdays.find((w) => w.id === d)?.label).join(', ')}`}
                    {setup.timeWindow &&
                      ` · ${timeWindows.find((w) => w.id === setup.timeWindow)?.label.toLowerCase()}`}
                    {setup.intensity && ` · ${setup.intensity}`}
                    {setup.targetDate && ` · finish by ${formatISO(setup.targetDate)}`}
                  </p>
                </div>
              </div>
            )}

              {/* actions */}
              <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 pt-6">
                <button type="button" onClick={back} className={setupGhost}>
                  {step === 0 ? 'Back home' : 'Back'}
                </button>
                <button type="submit" className={setupPrimary}>
                  <Sweep />
                  <span className="relative">
                    {step === steps.length - 1 ? 'Build my path' : 'Continue'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      <AdmireCandidatesModal
        open={admireOpen}
        onClose={() => setAdmireOpen(false)}
        candidates={candidates}
        selectedName={extraction?.label}
        onSelect={chooseAdmire}
        offline={admireOffline}
      />
    </div>
  )
}

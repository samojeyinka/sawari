import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuArrowLeft } from 'react-icons/lu'
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
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { ChoiceCard } from '../components/ui/Choice'
import { Chip, Field, inputClass } from '../components/ui/ProgressBar'
import { DatePickerField } from '../components/ui/DatePickerField'
import { LuSparkles } from 'react-icons/lu'
import { cx } from '../lib/utils'

const steps = [
  'What do you want to learn?',
  'Your experience',
  'Why, and what for',
  'Time each week',
  'Formats',
  'Intensity',
  'Your timeline',
]

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

  const progress = ((step + 1) / steps.length) * 100

  const recMonths = recommendedMonths(setup)
  const fastMonths = Math.max(1, Math.round(recMonths * 0.65))
  const relaxedMonths = Math.max(recMonths + 1, Math.round(recMonths * 1.5))
  const seenMonths = new Set<number>()
  const durationOptions = [
    { months: fastMonths, tag: 'Fastest', hint: 'Push the pace' },
    { months: recMonths, tag: 'Recommended', hint: 'Steady and sustainable' },
    { months: relaxedMonths, tag: 'Relaxed', hint: 'More breathing room' },
  ].filter((option) => (seenMonths.has(option.months) ? false : (seenMonths.add(option.months), true)))

  const validate = (): string | null => {
    switch (step) {
      case 0:
        return setup.subject.trim().length >= 2 ? null : 'Tell us what you want to learn.'
      case 1:
        return setup.experience ? null : 'Pick the option closest to you.'
      case 2:
        if (!setup.reason) return 'Why are you learning this?'
        return setup.outcome.trim().length >= 5
          ? null
          : 'Describe what you want to be able to do.'
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
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" aria-label="Sawari home">
            <Logo size="sm" />
          </Link>
          <span className="text-[13px] text-muted">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1 w-full bg-canvas-deep">
          <div className="bar-fill h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <form onSubmit={next} key={step}>
          <div className="animate-rise">
            <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{steps[step]}</h1>

            {/* step 0 */}
            {step === 0 && (
              <div className="mt-7">
                <Field
                  label="Subject"
                  htmlFor="subject"
                  hint="Anything. We will build the path around it."
                  error={error}
                >
                  <input
                    id="subject"
                    value={setup.subject}
                    onChange={(e) => patchSetup({ subject: e.target.value })}
                    placeholder="Project Management"
                    autoFocus
                    className={cx(inputClass, error && 'border-danger')}
                  />
                </Field>
                <div className="mt-5">
                  <p className="mb-2.5 text-[13px] font-medium text-muted">Popular right now</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Chip
                        key={subject}
                        selected={setup.subject === subject}
                        onClick={() => patchSetup({ subject })}
                      >
                        {subject}
                      </Chip>
                    ))}
                  </div>
                </div>
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
                  <p className="mb-2.5 text-sm font-medium text-ink">Why are you learning this?</p>
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
                    onChange={(e) => patchSetup({ outcome: e.target.value })}
                    placeholder="Run a project from planning through delivery without second guessing myself."
                    className={cx(inputClass, 'resize-y leading-relaxed')}
                  />
                </Field>
                {error && !error.startsWith('Describe') && (
                  <p className="-mt-4 text-[13px] text-danger">{error}</p>
                )}
              </div>
            )}

            {/* step 3 */}
            {step === 3 && (
              <div className="mt-7 space-y-8">
                <div>
                  <p className="text-sm font-medium text-ink">Time each week</p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
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
                  <p className="text-sm font-medium text-ink">Preferred days</p>
                  <p className="mt-1 text-[13px] text-muted">
                    Optional — pick the days you usually study. We schedule sessions for them.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <Chip key={day.id} selected={setup.days.includes(day.id)} onClick={() => toggleDay(day.id)}>
                        {day.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink">Best time of day</p>
                  <p className="mt-1 text-[13px] text-muted">
                    We put your toughest material in your best hours. (Optional)
                  </p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
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
                <p className="mb-1 text-[15px] text-body">
                  Choose as many as you like. We will mix them.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {formats.map((format) => (
                    <Chip
                      key={format.id}
                      selected={setup.formats.includes(format.id)}
                      onClick={() => toggleFormat(format.id)}
                      className="px-4 py-2.5"
                    >
                      {format.label}
                    </Chip>
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
                <div className="rounded-xl border border-accent bg-accent-soft/50 px-4 py-4">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                  
                    Recommended timeline
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
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
                    , most people reach this goal in about{' '}
                    <span className="font-semibold text-ink">{monthLabel(recMonths)}</span>. The fastest
                    realistic path is around{' '}
                    <span className="font-semibold text-ink">{monthLabel(fastMonths)}</span>.
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
                  <p className="mb-1 text-sm font-medium text-ink">
                    How long do you want to give it?
                  </p>
                  <p className="mb-3 text-[13px] text-muted">
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
                      className="mt-3 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
                    >
                      No timeline, keep it open
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-line bg-canvas px-4 py-4">
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
                    Quick look
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    <span className="font-semibold text-ink">{setup.subject}</span>
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
          </div>

          {/* actions */}
          <div className="mt-9 flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button type="button" variant="ghost" onClick={back}>
              <LuArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Home' : 'Back'}
            </Button>
            <Button type="submit" size="lg">
              {step === steps.length - 1 ? 'Build my path' : 'Continue'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuCheck, LuInfo, LuMail, LuSend, LuTriangleAlert } from 'react-icons/lu'
import type { Intensity, LearningFormat, WeeklyHours } from '../types'
import { useApp } from '../state/store'
import { notificationsApi, type TestEmailResponse } from '../lib/api'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Chip, Field, Toggle, inputClass } from '../components/ui/ProgressBar'
import { AiProviderSection } from '../components/settings/AiProviderSection'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { Modal } from '../components/ui/Modal'
import { cx, initials } from '../lib/utils'

type SectionId =
  | 'profile'
  | 'preferences'
  | 'schedule'
  | 'notifications'
  | 'ai'
  | 'account'

const sections: { id: SectionId; label: string }[] = [
  { id: 'preferences', label: 'Learning preferences' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'ai', label: 'AI provider' },
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
]

const hoursOptions: { id: WeeklyHours; label: string }[] = [
  { id: '2', label: '2 hours' },
  { id: '5', label: '5 hours' },
  { id: '10', label: '10 hours' },
  { id: '15+', label: '15+ hours' },
]

const intensityOptions: { id: Intensity; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: 'Short sessions, room to breathe' },
  { id: 'balanced', label: 'Balanced', hint: 'Steady pace, weekly momentum' },
  { id: 'intensive', label: 'Intensive', hint: 'Push hard, finish sooner' },
]

const formatOptions: { id: LearningFormat; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'books', label: 'Books' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'projects', label: 'Projects' },
  { id: 'quizzes', label: 'Quizzes' },
]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const timezones: { value: string; label: string }[] = [
  { value: 'UTC', label: '(GMT+00:00) UTC' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'Africa/Lagos', label: '(GMT+01:00) Lagos' },
  { value: 'Africa/Nairobi', label: '(GMT+03:00) Nairobi' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Mumbai' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore' },
  { value: 'America/New_York', label: '(GMT-05:00) New York' },
]

export function SettingsPage() {
  const { toast } = useApp()
  const [active, setActive] = useState<SectionId>('profile')

  const nav = (
    <nav className="flex gap-1 overflow-x-auto border-b border-line lg:flex-col lg:gap-0.5 lg:border-b-0">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActive(section.id)}
          className={cx(
            'whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors duration-150',
            active === section.id
              ? 'bg-canvas font-medium text-ink lg:bg-panel lg:border lg:border-line lg:shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
              : 'text-muted hover:text-ink',
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  )

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Settings"
        title="Your account"
        subtitle="Changes here apply straight away in this browser."
      />

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">{nav}</div>

        <div className="min-w-0 animate-rise" key={active}>
          {active === 'profile' && <ProfileSection />}
          {active === 'preferences' && <PreferencesSection />}
          {active === 'schedule' && <ScheduleSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'ai' && <AiProviderSection />}
          {active === 'account' && <AccountSection onOpenAi={() => setActive('ai')} />}
        </div>
      </div>

      <p className="mt-10 border-t border-line pt-5 text-[13px] text-muted">
        Nothing here talks to a server yet. Every change is stored in local app state so the
        product feels real while the backend is being built.{' '}
        <button
          onClick={() => toast('Settings reset is disabled in the demo')}
          className="font-medium text-accent hover:text-accent-strong"
        >
          Reset demo data
        </button>
      </p>
    </Page>
  )
}

function ProfileSection() {
  const { state, updateProfile, toast } = useApp()
  const user = state.user
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC')

  if (!user) return null

  const save = () => {
    updateProfile({ name: name.trim() || user.name, email: email.trim() || user.email, timezone })
    toast('Profile saved')
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading
        title="Profile"
        description="How you appear in sessions and on your projects."
      />

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lg font-semibold text-band">
          {initials(name || user.name)}
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{name || user.name}</p>
          <p className="text-[13px] text-muted">{user.joined}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Full name" htmlFor="profile-name">
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Timezone" hint="Used for session reminders." htmlFor="profile-tz">
          <select
            id="profile-tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputClass}
          >
            {timezones.some((tz) => tz.value === timezone) ? null : (
              <option value={timezone}>{timezone}</option>
            )}
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button onClick={save}>Save profile</Button>
    </div>
  )
}

function PreferencesSection() {
  const { state, updatePreferences, toast } = useApp()
  const prefs = state.settings.preferences
  const [weekly, setWeekly] = useState<WeeklyHours>(prefs.weeklyHours)
  const [intensity, setIntensity] = useState<Intensity>(prefs.intensity)
  const [formats, setFormats] = useState<LearningFormat[]>(prefs.formats)
  const [sessionLength, setSessionLength] = useState(prefs.sessionLength)

  const toggleFormat = (id: LearningFormat) =>
    setFormats((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))

  const save = () => {
    updatePreferences({
      weeklyHours: weekly,
      intensity,
      formats: formats.length ? formats : prefs.formats,
      sessionLength,
    })
    toast('Learning preferences saved')
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading
        title="Learning preferences"
        description="Shape how sessions are planned across every path."
      />

      <div>
        <p className="mb-2.5 text-sm font-medium text-ink">Time each week</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {hoursOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setWeekly(option.id)}
              className={cx(
                'rounded-lg border px-3 py-2.5 text-sm transition-all',
                weekly === option.id
                  ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                  : 'border-line text-body hover:border-line-strong hover:bg-canvas',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-ink">Intensity</p>
        <div className="space-y-2">
          {intensityOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setIntensity(option.id)}
              className={cx(
                'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all',
                intensity === option.id
                  ? 'border-accent bg-accent-soft/60'
                  : 'border-line hover:border-line-strong hover:bg-canvas',
              )}
            >
              <span>
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="block text-[13px] text-muted">{option.hint}</span>
              </span>
              <span
                className={cx(
                  'h-4 w-4 shrink-0 rounded-full border-2 transition-all',
                  intensity === option.id ? 'border-accent bg-accent' : 'border-line-strong',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-ink">Formats</p>
        <div className="flex flex-wrap gap-2">
          {formatOptions.map((format) => (
            <Chip
              key={format.id}
              selected={formats.includes(format.id)}
              onClick={() => toggleFormat(format.id)}
            >
              {format.label}
            </Chip>
          ))}
        </div>
      </div>

      <Field label="Session length" hint="Used to split the daily plan." htmlFor="session-length">
        <select
          id="session-length"
          value={sessionLength}
          onChange={(e) => setSessionLength(Number(e.target.value))}
          className={inputClass}
        >
          <option value={25}>25 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>60 minutes</option>
          <option value={90}>90 minutes</option>
        </select>
      </Field>

      <Button onClick={save}>Save preferences</Button>
    </div>
  )
}

function ScheduleSection() {
  const { state, updateSchedule, toast } = useApp()
  const schedule = state.settings.schedule
  const [selected, setSelected] = useState<string[]>(schedule.days)
  const [time, setTime] = useState(schedule.time)
  const [restDay, setRestDay] = useState(schedule.restDay)

  const toggleDay = (day: string) =>
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  const save = () => {
    updateSchedule({ days: selected, time, restDay })
    toast('Schedule updated')
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading
        title="Schedule"
        description="When you like to learn. Missed days simply move the plan."
      />

      <div>
        <p className="mb-2.5 text-sm font-medium text-ink">Learning days</p>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <Chip
              key={day}
              selected={selected.includes(day)}
              onClick={() => toggleDay(day)}
              className="min-w-14 text-center"
            >
              {day}
            </Chip>
          ))}
        </div>
        {selected.length === 0 && (
          <p className="mt-2 text-[13px] text-danger">Pick at least one day.</p>
        )}
      </div>

      <Field label="Preferred session time" hint="When your daily reminder arrives." htmlFor="time">
        <select
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={inputClass}
        >
          {['07:00', '09:00', '12:00', '17:00', '19:00', '21:00'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-ink">Remind me on rest days</p>
          <p className="text-[13px] text-muted">A nudge, never a guilt trip.</p>
        </div>
        <Toggle checked={restDay} onChange={setRestDay} label="Remind me on rest days" />
      </div>

      <Button onClick={save} disabled={selected.length === 0}>
        Save schedule
      </Button>
    </div>
  )
}

function NotificationsSection() {
  const { state, updateNotificationSettings, toast } = useApp()
  const settings = state.settings.notifications
  const user = state.user

  const [testEmail, setTestEmail] = useState(
    user?.email && !user.email.includes('@example.com')
      ? user.email
      : 'samuelojeyinka@gmail.com',
  )
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<TestEmailResponse | null>(null)

  const items: { key: keyof typeof settings; label: string; hint: string }[] = [
    { key: 'dailyReminder', label: 'Daily session reminder', hint: 'At your scheduled time' },
    { key: 'weeklySummary', label: 'Weekly summary', hint: 'What you finished and what is next' },
    { key: 'projectFeedback', label: 'Project feedback', hint: 'When a submission is reviewed' },
    { key: 'pathUpdates', label: 'Path changes', hint: 'When your plan adapts after a check' },
    { key: 'productNews', label: 'Product news', hint: 'New features, once a month or so' },
  ]

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast('Please enter a valid email address.')
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await notificationsApi.sendTestEmail({ targetEmail: testEmail.trim() })
      setResult(res)
      if (res.delivered) {
        toast(`Test reminder dispatched to ${res.recipient}`)
      } else {
        toast(res.message || 'Delivery notice')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not connect to email service.'
      setResult({
        delivered: false,
        recipient: testEmail,
        subject: 'Reminder Test',
        inAppNotificationId: '',
        error: msg,
        message: msg,
      })
      toast('Email test failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading
        title="Notifications"
        description="Choose what earns a notification. Everything else waits for you."
      />

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 bg-panel px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.label}</p>
              <p className="text-[13px] text-muted">{item.hint}</p>
            </div>
            <Toggle
              checked={settings[item.key]}
              label={item.label}
              onChange={(next) => updateNotificationSettings({ [item.key]: next })}
            />
          </div>
        ))}
      </div>

      {/* Resend Outbound Email Testing Card */}
      <section className="rounded-2xl border border-line bg-canvas/70 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <LuMail className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Email Delivery & Resend Testing</h3>
            <p className="text-[12px] text-muted">
              Verify that session reminders and weekly summaries reach your inbox.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field
            label="Recipient email address"
            hint="For free Resend accounts without a custom domain, delivery is restricted to the account owner (samuelojeyinka@gmail.com)."
            htmlFor="testEmail"
          >
            <div className="flex gap-2">
              <input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="samuelojeyinka@gmail.com"
                className={inputClass}
              />
              <Button
                onClick={handleSendTest}
                disabled={sending}
                className="shrink-0"
              >
                {sending ? (
                  'Sending...'
                ) : (
                  <>
                    <LuSend className="h-4 w-4" /> Send test
                  </>
                )}
              </Button>
            </div>
          </Field>

          {result && (
            <div
              className={cx(
                'rounded-xl border p-3.5 text-xs animate-rise',
                result.delivered
                  ? 'border-success/30 bg-success-soft/70 text-success'
                  : 'border-danger/30 bg-danger-soft/70 text-danger',
              )}
            >
              <div className="flex items-start gap-2">
                {result.delivered ? (
                  <LuCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    {result.delivered
                      ? 'Test Reminder Successfully Delivered!'
                      : 'Delivery Notice'}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-body">{result.message}</p>
                  {result.delivered && (
                    <p className="mt-1 text-[11px] text-muted">
                      Subject: "{result.subject}" · Delivered via Resend to {result.recipient}. Check your inbox!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-line/60 bg-panel/70 p-3 text-[12px] leading-relaxed text-muted">
            <div className="flex items-start gap-2">
              <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                <strong>Resend sandbox note:</strong> With the default <code className="rounded bg-canvas px-1 py-0.5">onboarding@resend.dev</code> sender, emails can only be delivered to <strong className="text-ink">samuelojeyinka@gmail.com</strong>. To send to any learner address, verify your domain in Resend.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function AccountSection({ onOpenAi }: { onOpenAi: () => void }) {
  const { state, signOut, toast, changePassword } = useApp()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const user = state.user
  if (!user) return null

  const savePassword = async () => {
    if (current.length === 0) {
      setError('Enter your current password.')
      return
    }
    if (next.length < 8) {
      setError('New password needs at least 8 characters.')
      return
    }
    if (next !== confirm) {
      setError('The two new passwords do not match.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await changePassword(current, next)
      setPasswordOpen(false)
      setCurrent('')
      setNext('')
      setConfirm('')
      toast('Password updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading title="Account" description="Your login, plan and the buttons that end things." />

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        <Row label="Email" value={user.email} />
        <Row
          label="Plan"
          value={state.settings.ai.mode === 'managed' ? 'Managed AI · $8/mo' : 'Own API key'}
          action={
            <button
              onClick={onOpenAi}
              className="text-[13px] font-medium text-accent hover:text-accent-strong"
            >
              Change
            </button>
          }
        />
        <Row label="Joined" value={user.joined} />
        <Row label="Timezone" value={user.timezone} />
      </div>

      <div className="space-y-3">
        <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
          Change password
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              signOut()
              toast('Signed out')
            }}
          >
            Sign out
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-canvas px-4 py-3.5">
        <p className="text-[13px] leading-relaxed text-muted">
          Demo account with local state. When the backend lands, this screen keeps the same shape
          and swaps to real calls.
        </p>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePassword} loading={busy}>
              Update password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Current password" htmlFor="cur-pass">
            <input
              id="cur-pass"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="New password" htmlFor="new-pass" hint="At least 8 characters.">
            <input
              id="new-pass"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-pass" error={error}>
            <input
              id="confirm-pass"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          signOut()
          toast('Account deleted')
          navigate('/')
        }}
        title="Delete your account?"
        body="This clears your account and local demo data from this browser. Your learning paths go with it."
        confirmLabel="Delete account"
        danger
      />
    </div>
  )
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  )
}

function Row({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-panel px-4 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">{value}</span>
        {action}
      </span>
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import type { Intensity, LearningFormat, WeeklyHours } from '../types'
import { useApp } from '../state/store'
import { notificationsApi, type TestEmailResponse } from '../lib/api'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Chip, Field, Toggle, inputClass } from '../components/ui/ProgressBar'
import { monoLabel } from '../components/layout/nav'
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
  const [active, setActive] = useState<SectionId>('profile')

  const nav = (
    <nav className="flex gap-1 overflow-x-auto border-b border-on-band/10 lg:flex-col lg:gap-0.5 lg:border-b-0">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActive(section.id)}
          aria-current={active === section.id ? 'page' : undefined}
          className={cx(
            'whitespace-nowrap border px-3.5 py-2.5 text-left text-sm transition-colors duration-150',
            active === section.id
              ? 'border-on-band/15 bg-on-band/[0.04] font-medium text-on-band'
              : 'border-transparent text-on-band-dim hover:text-on-band',
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
        subtitle="Changes here apply straight away."
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

      <p className="mt-10 border-t border-on-band/10 pt-5 text-[13px] text-on-band-dim">
        Every change here saves to your account straight away.
      </p>
    </Page>
  )
}

function ProfileSection() {
  const { state, updateProfile, requestEmailChange, confirmEmailChange, toast } = useApp()
  const user = state.user
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeError, setCodeError] = useState('')

  if (!user) return null

  const save = async () => {
    setSaveError('')
    const trimmedName = name.trim() || user.name
    const trimmedEmail = email.trim() || user.email
    if (!trimmedName) {
      setSaveError('Enter your name.')
      return
    }
    if (!trimmedEmail.includes('@')) {
      setSaveError('Enter a valid email address.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ name: trimmedName, timezone })
      if (trimmedEmail.toLowerCase() !== user.email.toLowerCase()) {
        const pending = await requestEmailChange(trimmedEmail)
        setCodeSentTo(pending)
        setCode('')
        setCodeError('')
      } else {
        setCodeSentTo(null)
      }
      toast('Profile saved')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  const confirmCode = async () => {
    if (code.trim().length !== 6) {
      setCodeError('Enter the 6-digit code.')
      return
    }
    setCodeError('')
    setCodeBusy(true)
    try {
      const updated = await confirmEmailChange(code.trim())
      setEmail(updated.email)
      setCodeSentTo(null)
      setCode('')
      toast('Email updated')
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Could not confirm the code.')
    } finally {
      setCodeBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading
        title="Profile"
        description="How you appear in sessions and on your projects."
      />

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-on-band text-lg font-medium text-band">
          {initials(name || user.name)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-band">{name || user.name}</p>
          <p className="text-[13px] text-on-band-dim">{user.joined}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Full name" htmlFor="profile-name">
          <input
            id="profile-name"
            value={name}
            maxLength={161}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <input
            id="profile-email"
            type="email"
            maxLength={254}
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

      {codeSentTo && (
        <div className="border border-on-band/15 bg-panel p-4">
          <p className={cx(monoLabel, 'text-accent-bright')}>confirm new email</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-on-band-muted">
            We sent a 6-digit code to {codeSentTo}. Enter it below to move your account there.
          </p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input
              id="email-change-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''))
                if (codeError) setCodeError('')
              }}
              placeholder="000000"
              autoComplete="one-time-code"
              className={cx(inputClass, 'font-mono tracking-[0.3em] sm:max-w-56')}
            />
            <Button onClick={() => void confirmCode()} disabled={codeBusy} className="shrink-0">
              {codeBusy ? 'Confirming…' : 'Confirm email'}
            </Button>
          </div>
          {codeError && <p className="mt-2 text-[13px] text-danger-bright">{codeError}</p>}
        </div>
      )}

      {saveError && <p className="text-[13px] text-danger-bright">{saveError}</p>}

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
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
        <p className="mb-2.5 text-sm font-medium text-on-band">Time each week</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {hoursOptions.map((option) => {
            const selected = weekly === option.id
            return (
              <button
                key={option.id}
                onClick={() => setWeekly(option.id)}
                aria-pressed={selected}
                className={cx(
                  'border px-3 py-2.5 text-sm transition-colors',
                  selected
                    ? 'border-accent-bright/60 bg-accent-bright/10 font-medium text-on-band'
                    : 'border-on-band/20 text-on-band-muted hover:border-on-band/45 hover:text-on-band',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-on-band">Intensity</p>
        <div className="space-y-2">
          {intensityOptions.map((option) => {
            const selected = intensity === option.id
            return (
              <button
                key={option.id}
                onClick={() => setIntensity(option.id)}
                aria-pressed={selected}
                className={cx(
                  'flex w-full items-center justify-between gap-3 border px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-accent-bright/60 bg-accent-bright/10'
                    : 'border-on-band/20 hover:border-on-band/45 hover:bg-on-band/[0.03]',
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-on-band">{option.label}</span>
                  <span className="block text-[13px] text-on-band-dim">{option.hint}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'flex h-4 w-4 shrink-0 items-center justify-center border transition-colors',
                    selected ? 'border-accent-bright' : 'border-on-band/30',
                  )}
                >
                  {selected && <span className="h-2 w-2 bg-accent-bright" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-on-band">Formats</p>
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
        <p className="mb-2.5 text-sm font-medium text-on-band">Learning days</p>
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
          <p className="mt-2 text-[13px] text-danger-bright">Pick at least one day.</p>
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

      <div className="flex items-center justify-between gap-4 border border-on-band/15 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-band">Remind me on rest days</p>
          <p className="text-[13px] text-on-band-dim">A nudge, never a guilt trip.</p>
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
    setSending(true)
    setResult(null)
    try {
      const res = await notificationsApi.sendTestEmail()
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
        recipient: user?.email ?? '',
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

      <div className="divide-y divide-on-band/10 border border-on-band/15">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 bg-panel px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-band">{item.label}</p>
              <p className="text-[13px] text-on-band-dim">{item.hint}</p>
            </div>
            <Toggle
              checked={settings[item.key]}
              label={item.label}
              onChange={(next) => updateNotificationSettings({ [item.key]: next })}
            />
          </div>
        ))}
      </div>

      {/* Resend outbound email testing */}
      <section className="border border-on-band/15 bg-band-deep p-5">
        <h3 className="text-sm font-medium text-on-band">Email delivery &amp; Resend testing</h3>
        <p className={cx(monoLabel, 'mt-1')}>
          Verify that reminders and summaries reach your inbox
        </p>

        <div className="mt-4 space-y-3">
          <Field
            label="Recipient email address"
            hint={`The test reminder always goes to your account email (${user?.email ?? '…'}).`}
            htmlFor="testEmail"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="testEmail"
                type="email"
                value={user?.email ?? ''}
                disabled
                readOnly
                className={cx(inputClass, 'min-w-0 flex-1')}
              />
              <Button
                onClick={handleSendTest}
                disabled={sending}
                className="shrink-0"
              >
                {sending ? 'Sending…' : 'Send test'}
              </Button>
            </div>
          </Field>

          {result && (
            <div
              className={cx(
                'border p-3.5 animate-rise',
                result.delivered
                  ? 'border-success-bright/40 bg-success-bright/10'
                  : 'border-danger-bright/40 bg-danger-bright/10',
              )}
            >
              <p className={cx(monoLabel, result.delivered ? 'text-success-bright' : 'text-danger-bright')}>
                {result.delivered ? 'test reminder delivered' : 'delivery notice'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-on-band-muted">{result.message}</p>
              {result.delivered && (
                <p className={cx(monoLabel, 'mt-2')}>
                  Subject: &quot;{result.subject}&quot; · via Resend to {result.recipient}
                </p>
              )}
            </div>
          )}

          <div className="border border-on-band/10 bg-panel px-4 py-3">
            <p className="text-[12.5px] leading-relaxed text-on-band-dim">
              <span className="font-medium text-on-band-muted">Resend sandbox note:</span> With the
              default <code className="bg-on-band/10 px-1 py-0.5 font-mono text-[11.5px]">onboarding@resend.dev</code> sender,
              emails can only be delivered to <span className="font-medium text-on-band">samuelojeyinka@gmail.com</span>.
              To send to any learner address, verify your domain in Resend.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function AccountSection({ onOpenAi }: { onOpenAi: () => void }) {
  const { state, signOut, toast, changePassword, requestAccountDeletion } = useApp()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const user = state.user
  if (!user) return null

  const billing = state.billing
  const planValue = !billing
    ? 'Free'
    : billing.plan === 'pro'
      ? 'Pro · one-time'
      : billing.hasOwnKey
        ? 'Own DeepSeek key'
        : `Free · ${billing.pathsUsed} of ${billing.pathLimit} paths`

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

  const handleDeleteRequest = async () => {
    setDeleteBusy(true)
    try {
      await requestAccountDeletion()
      setDeleteOpen(false)
      toast('Check your email for the confirmation link')
    } catch (err) {
      setDeleteOpen(false)
      toast(err instanceof Error ? err.message : 'Could not start deletion.')
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Heading title="Account" description="Your login, plan and the buttons that end things." />

      <div className="divide-y divide-on-band/10 border border-on-band/15">
        <Row label="Email" value={user.email} />
        <Row
          label="Plan"
          value={planValue}
          action={
            <button
              onClick={onOpenAi}
              className="text-[13px] font-medium text-accent-bright transition-colors hover:text-on-band"
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

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePassword} disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
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
        onConfirm={() => void handleDeleteRequest()}
        title="Delete your account?"
        body="We will email you a confirmation link. Your paths, projects and progress are kept for 30 days afterwards in case you change your mind."
        confirmLabel="Send confirmation email"
        busy={deleteBusy}
        danger
      />

    </div>
  )
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-display text-[20px] font-light tracking-[-0.015em] text-on-band">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-on-band-muted">{description}</p>
    </div>
  )
}

function Row({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-panel px-4 py-3.5">
      <span className="text-sm text-on-band-dim">{label}</span>
      <span className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm font-medium text-on-band">{value}</span>
        {action}
      </span>
    </div>
  )
}

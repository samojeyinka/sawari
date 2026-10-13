import { env } from '../config/env.js'
import { sessionReminder } from '../mail/templates/sessionReminder.js'
import { weeklySummary } from '../mail/templates/weeklySummary.js'
import { LearningPath } from '../models/LearningPath.js'
import { toReminderPreferences, User, type UserDocument } from '../models/User.js'
import { createNotification } from '../services/notifications.js'
import type { ReminderDay } from '../domain/index.js'

/* ------------------------------------------------------------------ */
/*  Reminder scheduler.                                                */
/*                                                                     */
/*  A single in-process interval wakes on SCHEDULER_POLL_MS, computes  */
/*  each user's *local* time from their IANA timezone, and fires a     */
/*  session reminder / weekly summary when their chosen time is hit.   */
/*  Deliveries are deduped per local day via reminderLastSentAt /      */
/*  summaryLastSentAt so a missed or repeated tick cannot double-send. */
/* ------------------------------------------------------------------ */

/** How long after the target minute a reminder may still fire. */
const DELIVERY_WINDOW_MINUTES = 5

function parseTime(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

/** The user's local weekday + minutes-since-midnight, or null on a bad zone. */
function localNow(date: Date, timeZone: string): { day: ReminderDay; minutes: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]))
    const hour = Number(parts.hour)
    const minute = Number(parts.minute)
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
    return { day: parts.weekday as ReminderDay, minutes: hour * 60 + minute }
  } catch {
    return null
  }
}

/** A stable YYYY-MM-DD key in the user's zone, used to dedupe sends. */
function localDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

function withinWindow(nowMinutes: number, targetMinutes: number): boolean {
  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + DELIVERY_WINDOW_MINUTES
}

/* ------------------------- session reminders ---------------------- */

async function sendSessionReminder(user: UserDocument): Promise<boolean> {
  const path = await LearningPath.findOne({ userId: user._id }).sort({ createdAt: -1 })
  if (!path) return false

  const section =
    path.sections.find((s) => s.id === path.currentSectionId) ??
    path.sections.find((s) => s.status === 'current') ??
    path.sections[0]
  if (!section) return false

  const minutes = section.minutes || 30
  const ctaUrl = `${env.FRONTEND_URL}/app/session/${section.id}`

  await createNotification({
    userId: user._id.toString(),
    kind: 'session',
    title: `Today: ${section.title}`,
    body: `${minutes} minutes on ${path.subject}. Start whenever you are ready.`,
    link: `/app/session/${section.id}`,
    meta: { pathId: path._id.toString(), sectionId: section.id },
    email: {
      to: user.email,
      rendered: sessionReminder({
        firstName: user.firstName,
        pathTitle: path.subject,
        sessionTitle: section.title,
        minutes,
        ctaUrl,
      }),
    },
  })
  return true
}

/* --------------------------- weekly summary ----------------------- */

async function sendWeeklySummary(user: UserDocument): Promise<boolean> {
  const path = await LearningPath.findOne({ userId: user._id }).sort({ createdAt: -1 })
  if (!path) return false

  const focus =
    path.sections.find((s) => s.id === path.currentSectionId)?.title ??
    path.sections.find((s) => s.status === 'current')?.title ??
    'your next session'

  await createNotification({
    userId: user._id.toString(),
    kind: 'path',
    title: 'Your week on Sawari',
    body: `${path.stats.sessionsCompleted} sessions and ${path.stats.minutesLearned} minutes this week. Next up: ${focus}.`,
    link: '/app/path',
    meta: { pathId: path._id.toString() },
    email: {
      to: user.email,
      rendered: weeklySummary({
        firstName: user.firstName,
        sessionsCompleted: path.stats.sessionsCompleted,
        minutes: path.stats.minutesLearned,
        streakWeek: 1,
        focus,
        ctaUrl: `${env.FRONTEND_URL}/app/path`,
      }),
    },
  })
  return true
}

/* ------------------------------ tick ------------------------------ */

export async function runSchedulerTick(now: Date = new Date()): Promise<void> {
  const users = await User.find({
    $or: [
      { 'preferences.dailyReminder': { $ne: false } },
      { 'preferences.weeklySummary': { $ne: false } },
    ],
  })

  for (const user of users) {
    const prefs = toReminderPreferences(user)
    const local = localNow(now, prefs.timezone)
    if (!local) continue

    const target = parseTime(prefs.reminderTime)
    if (!withinWindow(local.minutes, target)) continue

    const today = localDateKey(now, prefs.timezone)

    if (prefs.dailyReminder && prefs.reminderDays.includes(local.day)) {
      const sentToday =
        user.reminderLastSentAt != null &&
        localDateKey(user.reminderLastSentAt, prefs.timezone) === today
      if (!sentToday && (await sendSessionReminder(user))) {
        user.reminderLastSentAt = now
      }
    }

    if (prefs.weeklySummary && local.day === 'Mon') {
      const sentToday =
        user.summaryLastSentAt != null &&
        localDateKey(user.summaryLastSentAt, prefs.timezone) === today
      if (!sentToday && (await sendWeeklySummary(user))) {
        user.summaryLastSentAt = now
      }
    }

    if (user.isModified()) await user.save()
  }
}

/* --------------------------- lifecycle ---------------------------- */

let timer: NodeJS.Timeout | null = null

export function startScheduler(): void {
  if (timer || !env.SCHEDULER_ENABLED) return

  const tick = () => {
    void runSchedulerTick().catch((error) => console.error('[scheduler] tick failed:', error))
  }

  timer = setInterval(tick, env.SCHEDULER_POLL_MS)
  timer.unref()
  console.log(`[scheduler] started (poll ${env.SCHEDULER_POLL_MS}ms)`)
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

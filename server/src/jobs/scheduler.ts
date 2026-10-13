import { env } from '../config/env.js'
import { sessionReminder } from '../mail/templates/sessionReminder.js'
import { weeklySummary } from '../mail/templates/weeklySummary.js'
import { Job } from '../models/Job.js'
import { LearningPath } from '../models/LearningPath.js'
import { Notification } from '../models/Notification.js'
import { Project } from '../models/Project.js'
import { SessionContentModel } from '../models/SessionContent.js'
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

/* ------------------------------ purge ----------------------------- */

/** Soft-deleted accounts age out after this long, then vanish for good. */
const PURGE_AFTER_MS = 30 * 24 * 60 * 60 * 1000

/** Finished jobs are kept 7 days; read notifications 90 days. */
const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
const READ_NOTIFICATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

/** Hard-deletes accounts past the restore window with all their data. */
export async function purgeExpiredDeletions(now: Date = new Date()): Promise<number> {  const expired = await User.find({ deletedAt: { $lt: new Date(now.getTime() - PURGE_AFTER_MS) } })
    .select('_id')
    .lean()
  if (expired.length === 0) return 0

  const userIds = expired.map((u) => u._id)
  const paths = await LearningPath.find({ userId: { $in: userIds } }).select('_id').lean()
  const pathIds = paths.map((p) => p._id)
  await Promise.all([
    SessionContentModel.deleteMany({ pathId: { $in: pathIds } }),
    LearningPath.deleteMany({ userId: { $in: userIds } }),
    Project.deleteMany({ userId: { $in: userIds } }),
    Notification.deleteMany({ user: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ])
  return userIds.length
}

/**
 * Retention sweep so the jobs + notifications tables cannot grow forever:
 * finished jobs older than 7 days, read notifications older than 90 days.
 * (TTL indexes back this up; the sweep covers backends where TTL is delayed.)
 */
export async function cleanupOldRecords(now: Date = new Date()): Promise<void> {
  await Promise.all([
    Job.deleteMany({
      status: { $in: ['done', 'failed'] },
      finishedAt: { $lt: new Date(now.getTime() - JOB_RETENTION_MS) },
    }),
    Notification.deleteMany({
      read: true,
      updatedAt: { $lt: new Date(now.getTime() - READ_NOTIFICATION_RETENTION_MS) },
    }),
  ])
}

/* ------------------------------ tick ------------------------------ */

const SCHEDULER_PAGE_SIZE = 100

type SchedulerUser = Awaited<ReturnType<typeof User.find>>[number]

/** One user's reminders for this tick; throws are caught per-user by the tick. */
async function processUserReminders(user: SchedulerUser, now: Date): Promise<void> {
  const prefs = toReminderPreferences(user)
  const local = localNow(now, prefs.timezone)
  if (!local) return

  const target = parseTime(prefs.reminderTime)
  if (!withinWindow(local.minutes, target)) return

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

export async function runSchedulerTick(now: Date = new Date()): Promise<void> {
  try {
    await purgeExpiredDeletions(now)
  } catch (error) {
    console.error('[scheduler] purge failed:', error)
  }

  try {
    await cleanupOldRecords(now)
  } catch (error) {
    console.error('[scheduler] retention cleanup failed:', error)
  }

  // Paginated cursor over eligible users: no full-table load, and one user's
  // throw can never abort the tick for everyone after them.
  let lastId: SchedulerUser['_id'] | null = null
  for (;;) {
    const users = await User.find({
      deletedAt: null,
      ...(lastId != null ? { _id: { $gt: lastId } } : {}),
      $or: [
        { 'preferences.dailyReminder': { $ne: false } },
        { 'preferences.weeklySummary': { $ne: false } },
      ],
    })
      .sort({ _id: 1 })
      .limit(SCHEDULER_PAGE_SIZE)

    if (users.length === 0) break

    for (const user of users) {
      try {
        await processUserReminders(user, now)
      } catch (error) {
        console.error(`[scheduler] user ${user._id.toString()} failed:`, error)
      }
    }

    if (users.length < SCHEDULER_PAGE_SIZE) break
    lastId = users[users.length - 1]!._id
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

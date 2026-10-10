import { createContext, useContext } from 'react'
import type {
  ActivityKind,
  AppNotification,
  LearningPath,
  PathSection,
  Project,
  RecentlyDone,
  SessionContent,
  SetupAnswers,
  Settings,
  User,
} from '../types'
import type { AlertVariant } from '../components/ui/Alert'
import type { RegisterInput } from '../lib/api'
import {
  mockLearningPaths,
  mockNotifications,
  mockProjects,
  mockRecent,
  mockSettings,
  buildGeneratedSession,
  findTemplateMatch,
  sectionsForSubject,
} from '../data'
import { fallbackFeedback, launchFeedback } from '../data/projects'

/* ------------------------------------------------------------------ */
/*  Store: one slice of app state, one reducer, a handful of actions.  */
/*  Everything is in memory so an API can replace it later cleanly.    */
/* ------------------------------------------------------------------ */

const emptySetup: SetupAnswers = {
  subject: '',
  experience: null,
  reason: null,
  outcome: '',
  weeklyHours: null,
  days: [],
  timeWindow: null,
  formats: [],
  intensity: null,
  targetDate: '',
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}
const WINDOW_TIMES: Record<string, string> = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '19:00',
  anytime: '19:00',
}

export type AuthStatus = 'checking' | 'authenticated' | 'guest'

export interface AppState {
  user: User | null
  authStatus: AuthStatus
  paths: LearningPath[]
  activePathId: string
  customContent: Record<string, SessionContent>
  projects: Project[]
  notifications: AppNotification[]
  recent: RecentlyDone[]
  settings: Settings
  setup: SetupAnswers
}

type Action =
  | { type: 'auth/setUser'; user: User | null }
  | { type: 'auth/sessionGuest' }
  | { type: 'auth/signOut' }
  | { type: 'setup/patch'; patch: Partial<SetupAnswers> }
  | { type: 'setup/reset' }
  | { type: 'path/activate'; id: string }
  | { type: 'path/create'; pathId: string; createdAt: string; subject: string; setup: SetupAnswers }
  | { type: 'path/delete'; id: string }
  | { type: 'path/preferences'; pathId: string; patch: Partial<Pick<LearningPath, 'weeklyHours' | 'intensity' | 'formats' | 'targetDate' | 'goal'>> }
  | { type: 'path/activity'; pathId: string; sectionId: string; kind: ActivityKind; title: string; minutes: number }
  | { type: 'path/assessment'; pathId: string; sectionId: string; assessmentId: string; title: string; score: number; total: number; minutes: number }
  | { type: 'project/toggleTask'; projectId: string; taskId: string }
  | { type: 'project/submit'; projectId: string }
  | { type: 'project/review'; projectId: string }
  | { type: 'notif/read'; id: string }
  | { type: 'notif/readAll' }
  | { type: 'settings/preferences'; patch: Partial<Settings['preferences']> }
  | { type: 'settings/schedule'; patch: Partial<Settings['schedule']> }
  | { type: 'settings/notifications'; patch: Partial<Settings['notifications']> }
  | { type: 'settings/ai'; patch: Partial<Settings['ai']> }
  | { type: 'profile/update'; patch: Partial<User> }

export const initialState: AppState = {
  user: null,
  authStatus: 'checking',
  paths: mockLearningPaths,
  activePathId: mockLearningPaths[0].id,
  customContent: {},
  projects: mockProjects,
  notifications: mockNotifications,
  recent: mockRecent,
  settings: mockSettings,
  setup: emptySetup,
}

const activityKey = (pathId: string, sectionId: string, kind: ActivityKind) =>
  `${pathId}|${sectionId}|${kind}`

const allKinds: ActivityKind[] = ['learn', 'read', 'practice', 'check']

function mapPath(state: AppState, id: string, fn: (p: LearningPath) => LearningPath): AppState {
  return { ...state, paths: state.paths.map((p) => (p.id === id ? fn(p) : p)) }
}

/** Mark one activity done and count the session when all four are in. */
function applyActivity(
  path: LearningPath,
  sectionId: string,
  kind: ActivityKind,
  minutes: number,
): LearningPath {
  const key = activityKey(path.id, sectionId, kind)
  if (path.completedActivities.includes(key)) return path

  const completedActivities = [...path.completedActivities, key]
  const allDone = allKinds.every((k) => completedActivities.includes(activityKey(path.id, sectionId, k)))

  let stats = path.stats
  let sections = path.sections

  if (allDone && !path.countedSessions.includes(sectionId)) {
    const week = [...path.stats.week]
    week[week.length - 1] = week[week.length - 1] + minutes
    stats = {
      ...path.stats,
      sessionsCompleted: path.stats.sessionsCompleted + 1,
      minutesLearned: path.stats.minutesLearned + minutes,
      topicsExplored: path.stats.topicsExplored + 1,
      week,
    }
    sections = path.sections.map((s) =>
      s.id === sectionId
        ? { ...s, doneMinutes: Math.min(s.minutes, s.doneMinutes + minutes) }
        : s,
    )
  }

  return { ...path, completedActivities, stats, sections }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'auth/setUser':
      return {
        ...state,
        user: action.user,
        authStatus: action.user ? 'authenticated' : 'guest',
      }

    case 'auth/sessionGuest':
      // Only the initial session check may downgrade to guest; a late response
      // must never sign out a user who just logged in.
      return state.authStatus === 'checking'
        ? { ...state, user: null, authStatus: 'guest' }
        : state

    case 'auth/signOut':
      return { ...state, user: null, authStatus: 'guest' }

    case 'setup/patch':
      return { ...state, setup: { ...state.setup, ...action.patch } }

    case 'setup/reset':
      return { ...state, setup: emptySetup }

    case 'path/activate':
      return { ...state, activePathId: action.id }

    case 'path/create': {
      const answers = action.setup
      const matchId = findTemplateMatch(action.subject, state.paths)
      const { createdAt } = action

      if (matchId) {
        // This subject already has a path: reopen it instead of starting a duplicate,
        // and let the goal from setup update it.
        const goal = answers.outcome.trim()
        return {
          ...state,
          activePathId: matchId,
          setup: emptySetup,
          paths: goal
            ? state.paths.map((p) => (p.id === matchId ? { ...p, goal } : p))
            : state.paths,
        }
      }

      // New subject: build a path from the template list and one session.
      const templates = sectionsForSubject(action.subject)
      const id = action.pathId
      const sections: PathSection[] = templates.map((t, i) => ({
        id: `${id}-s${i + 1}`,
        order: i + 1,
        title: t.title,
        description: t.description,
        minutes: t.minutes,
        status: i === 0 ? 'current' : i === 1 ? 'upcoming' : 'locked',
        doneMinutes: 0,
        note:
          i === 0
            ? undefined
            : i === 1
              ? `Starts after ${templates[0].title}.`
              : `Unlocks after ${templates[i - 1].title}.`,
      }))

      const path: LearningPath = {
        id,
        subject: titleCase(action.subject),
        goal: answers.outcome.trim() || `Build real confidence with ${titleCase(action.subject)}.`,
        experience: answers.experience,
        reason: answers.reason,
        weeklyHours: answers.weeklyHours ?? '5',
        intensity: answers.intensity ?? 'balanced',
        formats: answers.formats.length ? answers.formats : ['articles', 'exercises'],
        targetDate: answers.targetDate,
        createdAt,
        stats: {
          sessionsCompleted: 0,
          minutesLearned: 0,
          topicsExplored: 0,
          projectsCompleted: 0,
          week: [0, 0, 0, 0, 0, 0, 0],
        },
        currentSectionId: sections[0].id,
        sections,
        completedActivities: [],
        countedSessions: [],
        assessmentResults: {},
        adaptationNote: null,
      }

      const content = buildGeneratedSession(answers, sections[0].title, 1)

      const scheduledDays = answers.days.map((d) => DAY_LABELS[d]).filter(Boolean)
      const scheduledTime = answers.timeWindow ? WINDOW_TIMES[answers.timeWindow] : undefined

      return {
        ...state,
        paths: [...state.paths, path],
        activePathId: path.id,
        customContent: { ...state.customContent, [sections[0].id]: content },
        setup: emptySetup,
        settings: {
          ...state.settings,
          schedule: {
            ...state.settings.schedule,
            days: scheduledDays.length > 0 ? scheduledDays : state.settings.schedule.days,
            time: scheduledTime ?? state.settings.schedule.time,
          },
        },
      }
    }

    case 'path/delete': {
      const paths = state.paths.filter((p) => p.id !== action.id)
      const activePathId =
        state.activePathId === action.id ? (paths[0]?.id ?? '') : state.activePathId
      return { ...state, paths, activePathId }
    }

    case 'path/preferences':
      return mapPath(state, action.pathId, (p) => ({ ...p, ...action.patch }))

    case 'path/activity': {
      const path = state.paths.find((p) => p.id === action.pathId)
      if (!path) return state
      const next = applyActivity(path, action.sectionId, action.kind, action.minutes)
      if (next === path) return state

      const labels: Record<ActivityKind, string> = {
        learn: 'Lesson',
        read: 'Reading',
        practice: 'Practice',
        check: 'Check',
      }
      const item: RecentlyDone = {
        id: activityKey(action.pathId, action.sectionId, action.kind),
        title: `${labels[action.kind]}: ${action.title}`,
        kind: action.kind,
        when: 'Just now',
      }
      return {
        ...mapPath(state, action.pathId, () => next),
        recent: [item, ...state.recent.filter((r) => r.id !== item.id)].slice(0, 6),
      }
    }

    case 'path/assessment': {
      const path = state.paths.find((p) => p.id === action.pathId)
      if (!path) return state
      const withActivity = applyActivity(path, action.sectionId, 'check', action.minutes)
      const previous = path.assessmentResults[action.assessmentId]
      const firstAttempt = !previous
      const perfect = action.score === action.total
      const decent = action.score / action.total >= 0.7
      const section = path.sections.find((s) => s.id === action.sectionId)
      const title = section?.title ?? 'this section'

      const note = perfect
        ? `Path updated: a clean check on ${title}. Tomorrow stays as planned.`
        : decent
          ? `Path updated: ${title} is in good shape. Tomorrow opens with a two minute recap, then moves on.`
          : `Path updated: tomorrow now opens with a review of ${title}, and new material moves back a day.`

      const updated: LearningPath = {
        ...withActivity,
        assessmentResults: {
          ...withActivity.assessmentResults,
          [action.assessmentId]: {
            score: action.score,
            total: action.total,
            date: new Date().toISOString().slice(0, 10),
            firstAttempt,
          },
        },
        adaptationNote: note,
      }

      const item: RecentlyDone = {
        id: activityKey(action.pathId, action.sectionId, 'check'),
        title: `Check: ${action.title}`,
        kind: 'check',
        when: 'Just now',
      }

      return {
        ...mapPath(state, action.pathId, () => updated),
        recent: [item, ...state.recent.filter((r) => r.id !== item.id)].slice(0, 6),
      }
    }

    case 'project/toggleTask':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id !== action.projectId
            ? p
            : {
                ...p,
                completedTaskIds: p.completedTaskIds.includes(action.taskId)
                  ? p.completedTaskIds.filter((id) => id !== action.taskId)
                  : [...p.completedTaskIds, action.taskId],
                submitted: false,
                reviewed: false,
                submittedAt: null,
                feedback: null,
              },
        ),
      }

    case 'project/submit':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? { ...p, submitted: true, reviewed: false, submittedAt: 'Just now' }
            : p,
        ),
      }

    case 'project/review':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? {
                ...p,
                reviewed: true,
                feedback: p.feedback ?? (p.id === 'prj-launch' ? launchFeedback : fallbackFeedback),
              }
            : p,
        ),
      }

    case 'notif/read':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      }

    case 'notif/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    case 'settings/preferences':
      return {
        ...state,
        settings: {
          ...state.settings,
          preferences: { ...state.settings.preferences, ...action.patch },
        },
      }

    case 'settings/schedule':
      return {
        ...state,
        settings: { ...state.settings, schedule: { ...state.settings.schedule, ...action.patch } },
      }

    case 'settings/notifications':
      return {
        ...state,
        settings: {
          ...state.settings,
          notifications: { ...state.settings.notifications, ...action.patch },
        },
      }

    case 'settings/ai':
      return {
        ...state,
        settings: { ...state.settings, ai: { ...state.settings.ai, ...action.patch } },
      }

    case 'profile/update':
      return { ...state, user: state.user ? { ...state.user, ...action.patch } : null }

    default:
      return state
  }
}

function titleCase(value: string): string {
  const clean = value.trim()
  return clean.length ? clean.slice(0, 1).toUpperCase() + clean.slice(1) : 'Something new'
}

/* ------------------------------- context ------------------------------- */

export interface Store {
  state: AppState
  activePath: LearningPath | null
  unreadCount: number
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  refreshSession: () => Promise<void>
  signOut: () => void
  patchSetup: (patch: Partial<SetupAnswers>) => void
  resetSetup: () => void
  activatePath: (id: string) => void
  createPath: (subject: string, answers: SetupAnswers) => void
  deletePath: (id: string) => void
  updatePathPreferences: (
    pathId: string,
    patch: Partial<Pick<LearningPath, 'weeklyHours' | 'intensity' | 'formats' | 'targetDate' | 'goal'>>,
  ) => void
  completeActivity: (
    pathId: string,
    sectionId: string,
    kind: ActivityKind,
    title: string,
    minutes: number,
  ) => void
  submitAssessment: (
    pathId: string,
    sectionId: string,
    assessmentId: string,
    title: string,
    score: number,
    total: number,
    minutes: number,
  ) => void
  toggleTask: (projectId: string, taskId: string) => void
  submitProject: (projectId: string) => void
  reviewProject: (projectId: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  updatePreferences: (patch: Partial<Settings['preferences']>) => void
  updateSchedule: (patch: Partial<Settings['schedule']>) => void
  updateNotificationSettings: (patch: Partial<Settings['notifications']>) => void
  updateAi: (patch: Partial<Settings['ai']>) => void
  updateProfile: (patch: Partial<User>) => void
  toast: (text: string, variant?: AlertVariant) => void
  sessionContentFor: (sectionId: string) => SessionContent | null
}

export const AppContext = createContext<Store | null>(null)

export function useApp(): Store {
  const store = useContext(AppContext)
  if (!store) throw new Error('useApp must be used inside AppProvider')
  return store
}

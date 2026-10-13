import { createContext, useContext } from 'react'
import type {
  ActivityKind,
  AppNotification,
  GenerationStatus,
  LearningPath,
  Project,
  RecentlyDone,
  SessionContent,
  SetupAnswers,
  Settings,
  User,
} from '../types'
import type { AlertVariant } from '../components/ui/Alert'
import type { ApiBillingStatus, RegisterInput } from '../lib/api'
import { advanceSections } from '../lib/sections'
import { mockSettings } from '../data'
import { fallbackFeedback } from '../data/projects'

/* ------------------------------------------------------------------ */
/*  Store: one slice of app state, one reducer, a handful of actions.  */
/*  Domain data (paths, projects) is loaded from and written to the    */
/*  API; the reducer stays pure so it can also compute the next state  */
/*  for optimistic updates.                                            */
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

export const DRAFT_SETUP_KEY = 'sawari_draft_setup'

export function loadDraftSetup(): SetupAnswers {
  try {
    const raw = localStorage.getItem(DRAFT_SETUP_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SetupAnswers>
      return { ...emptySetup, ...parsed }
    }
  } catch {
    // Ignore storage parse error
  }
  return emptySetup
}

export type AuthStatus = 'checking' | 'authenticated' | 'guest'
export type DataStatus = 'idle' | 'loading' | 'ready'

export interface AppState {
  user: User | null
  authStatus: AuthStatus
  dataStatus: DataStatus
  paths: LearningPath[]
  activePathId: string
  customContent: Record<string, SessionContent>
  contentLoading: Record<string, boolean>
  contentErrors: Record<string, string>
  projects: Project[]
  notifications: AppNotification[]
  recent: RecentlyDone[]
  settings: Settings
  setup: SetupAnswers
  billing: ApiBillingStatus | null
}

type Action =
  | { type: 'auth/setUser'; user: User | null }
  | { type: 'auth/sessionGuest' }
  | { type: 'auth/signOut' }
  | { type: 'setup/patch'; patch: Partial<SetupAnswers> }
  | { type: 'setup/reset' }
  | { type: 'data/loading' }
  | { type: 'data/loaded'; paths: LearningPath[]; projects: Project[]; content: Record<string, SessionContent> }
  | { type: 'path/add'; path: LearningPath; content: Record<string, SessionContent> }
  | { type: 'path/replace'; path: LearningPath }
  | { type: 'path/status'; id: string; status: GenerationStatus; error?: string | null }
  | { type: 'path/activate'; id: string }
  | { type: 'path/delete'; id: string }
  | { type: 'path/preferences'; pathId: string; patch: Partial<Pick<LearningPath, 'weeklyHours' | 'intensity' | 'formats' | 'targetDate' | 'goal'>> }
  | { type: 'path/activity'; pathId: string; sectionId: string; kind: ActivityKind; title: string; minutes: number }
  | { type: 'path/assessment'; pathId: string; sectionId: string; assessmentId: string; title: string; score: number; total: number; minutes: number }
  | { type: 'project/replace'; project: Project }
  | { type: 'project/toggleTask'; projectId: string; taskId: string }
  | { type: 'project/submit'; projectId: string }
  | { type: 'project/review'; projectId: string }
  | { type: 'notif/loaded'; notifications: AppNotification[] }
  | { type: 'notif/read'; id: string }
  | { type: 'notif/readAll' }
  | { type: 'content/loading'; sectionId: string }
  | { type: 'content/loaded'; content: Record<string, SessionContent> }
  | { type: 'content/error'; sectionId: string; error: string }
  | { type: 'settings/preferences'; patch: Partial<Settings['preferences']> }
  | {
      type: 'settings/loaded'
      timezone: string
      schedule: Pick<Settings['schedule'], 'days' | 'time'>
      notifications: Pick<Settings['notifications'], 'dailyReminder' | 'weeklySummary'>
    }
  | { type: 'settings/schedule'; patch: Partial<Settings['schedule']> }
  | { type: 'settings/notifications'; patch: Partial<Settings['notifications']> }
  | { type: 'settings/ai'; patch: Partial<Settings['ai']> }
  | { type: 'profile/update'; patch: Partial<User> }
  | { type: 'billing/loaded'; billing: ApiBillingStatus | null }

export const initialState: AppState = {
  user: null,
  authStatus: 'checking',
  dataStatus: 'idle',
  paths: [],
  activePathId: '',
  customContent: {},
  contentLoading: {},
  contentErrors: {},
  projects: [],
  notifications: [],
  recent: [],
  settings: mockSettings,
  setup: loadDraftSetup(),
  billing: null,
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
      return {
        ...state,
        user: null,
        authStatus: 'guest',
        dataStatus: 'idle',
        paths: [],
        activePathId: '',
        customContent: {},
        projects: [],
        notifications: [],
        recent: [],
        billing: null,
        setup: emptySetup,
      }

    case 'setup/patch': {
      const nextSetup = { ...state.setup, ...action.patch }
      try {
        localStorage.setItem(DRAFT_SETUP_KEY, JSON.stringify(nextSetup))
      } catch {
        // Ignore quota errors
      }
      return { ...state, setup: nextSetup }
    }

    case 'setup/reset': {
      try {
        localStorage.removeItem(DRAFT_SETUP_KEY)
      } catch {
        // Ignore
      }
      return { ...state, setup: emptySetup }
    }

    case 'data/loading':
      return state.dataStatus === 'loading' ? state : { ...state, dataStatus: 'loading' }

    case 'data/loaded': {
      const activePathId = action.paths.some((p) => p.id === state.activePathId)
        ? state.activePathId
        : (action.paths[0]?.id ?? '')
      return {
        ...state,
        dataStatus: 'ready',
        paths: action.paths,
        projects: action.projects,
        activePathId,
        customContent: action.content,
      }
    }

    case 'path/add': {
      try {
        localStorage.removeItem(DRAFT_SETUP_KEY)
      } catch {
        // Ignore
      }
      return {
        ...state,
        paths: [...state.paths, action.path],
        activePathId: action.path.id,
        customContent: { ...state.customContent, ...action.content },
        setup: emptySetup,
      }
    }

    case 'path/replace':
      return {
        ...state,
        paths: state.paths.map((p) => (p.id === action.path.id ? action.path : p)),
      }

    case 'path/status':
      return {
        ...state,
        paths: state.paths.map((p) =>
          p.id === action.id
            ? {
                ...p,
                generationStatus: action.status,
                generationError: action.error !== undefined ? action.error : p.generationError,
              }
            : p,
        ),
      }

    case 'path/activate':
      return { ...state, activePathId: action.id }

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
      const next = advanceSections(
        applyActivity(path, action.sectionId, action.kind, action.minutes),
      )
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

      const updated: LearningPath = advanceSections({
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
      })

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

    case 'project/replace':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.project.id ? action.project : p)),
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
                status: 'completed',
                feedback: p.feedback ?? fallbackFeedback,
              }
            : p,
        ),
      }

    case 'notif/loaded':
      return { ...state, notifications: action.notifications }

    case 'notif/read':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      }

    case 'notif/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    case 'content/loading':
      return {
        ...state,
        contentLoading: { ...state.contentLoading, [action.sectionId]: true },
        contentErrors: { ...state.contentErrors, [action.sectionId]: '' },
      }

    case 'content/loaded': {
      const nextLoading = { ...state.contentLoading }
      const nextErrors = { ...state.contentErrors }
      for (const key of Object.keys(action.content)) {
        delete nextLoading[key]
        delete nextErrors[key]
      }
      return {
        ...state,
        customContent: { ...state.customContent, ...action.content },
        contentLoading: nextLoading,
        contentErrors: nextErrors,
      }
    }

    case 'content/error': {
      const nextLoading = { ...state.contentLoading }
      delete nextLoading[action.sectionId]
      return {
        ...state,
        contentLoading: nextLoading,
        contentErrors: { ...state.contentErrors, [action.sectionId]: action.error },
      }
    }

    case 'settings/preferences':
      return {
        ...state,
        settings: {
          ...state.settings,
          preferences: { ...state.settings.preferences, ...action.patch },
        },
      }

    case 'settings/loaded':
      return {
        ...state,
        user: state.user ? { ...state.user, timezone: action.timezone } : state.user,
        settings: {
          ...state.settings,
          schedule: { ...state.settings.schedule, ...action.schedule },
          notifications: { ...state.settings.notifications, ...action.notifications },
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

    case 'billing/loaded':
      return { ...state, billing: action.billing }

    default:
      return state
  }
}

export function titleCase(value: string): string {
  const clean = value.trim()
  return clean.length ? clean.slice(0, 1).toUpperCase() + clean.slice(1) : 'Something new'
}

/** Rebuilds the setup answers a path was created from (enough to regenerate content). */
export function setupFromPath(path: LearningPath): SetupAnswers {
  return {
    subject: path.subject,
    experience: path.experience,
    reason: path.reason,
    outcome: path.goal,
    weeklyHours: path.weeklyHours,
    days: [],
    timeWindow: null,
    formats: path.formats,
    intensity: path.intensity,
    targetDate: path.targetDate,
  }
}

/* ------------------------------- context ------------------------------- */

export interface Store {
  state: AppState
  activePath: LearningPath | null
  unreadCount: number
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  verifyEmail: (code: string) => Promise<User>
  resendVerificationCode: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshSession: () => Promise<void>
  signOut: () => void
  reloadData: () => Promise<void>
  patchSetup: (patch: Partial<SetupAnswers>) => void
  resetSetup: () => void
  activatePath: (id: string) => void
  createPath: (subject: string, answers: SetupAnswers) => Promise<LearningPath>
  retryPathBuild: (id: string) => Promise<LearningPath>
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
  /** Loads a section's content from the server (generating it once), caching in state. */
  ensureSessionContent: (sectionId: string, force?: boolean) => Promise<void>
  sessionContentError: (sectionId: string) => string | null
  isSessionContentLoading: (sectionId: string) => boolean
  updatePreferences: (patch: Partial<Settings['preferences']>) => void
  updateSchedule: (patch: Partial<Settings['schedule']>) => void
  updateNotificationSettings: (patch: Partial<Settings['notifications']>) => void
  updateAi: (patch: Partial<Settings['ai']>) => void
  updateProfile: (patch: Partial<User>) => void
  toast: (text: string, variant?: AlertVariant) => void
  sessionContentFor: (sectionId: string) => SessionContent | null
  refreshBilling: () => Promise<void>
}

export const AppContext = createContext<Store | null>(null)

export function useApp(): Store {
  const store = useContext(AppContext)
  if (!store) throw new Error('useApp must be used inside AppProvider')
  return store
}

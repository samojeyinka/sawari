import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  ActivityKind,
  LearningPath,
  PathSection,
  Project,
  SessionContent,
  SetupAnswers,
  User,
} from '../types'
import type { AlertVariant } from '../components/ui/Alert'
import { baseSessionContent, findTemplateMatch, sectionsForSubject } from '../data'
import {
  ApiError,
  authApi,
  learningPathsApi,
  mapApiLearningPath,
  mapApiProject,
  projectsApi,
  type ApiUser,
  type RegisterInput,
  type UpdateLearningPathInput,
} from '../lib/api'
import { useAlert } from './alertContext'
import type { Store } from './store'
import { AppContext, contentForPath, initialState, reducer, titleCase } from './store'

/** Builds the section list for a newly generated path (client-owned section ids). */
function buildSections(
  subject: string,
  templates: ReturnType<typeof sectionsForSubject>,
): PathSection[] {
  const slug =
    subject
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 16) || 'path'
  const stamp = Date.now().toString(36)
  return templates.map((template, i) => ({
    id: `${slug}-${stamp}-s${i + 1}`,
    order: i + 1,
    title: template.title,
    description: template.description,
    minutes: template.minutes,
    status: i === 0 ? 'current' : i === 1 ? 'upcoming' : 'locked',
    doneMinutes: 0,
    note:
      i === 0
        ? undefined
        : i === 1
          ? `Starts after ${templates[0].title}.`
          : `Unlocks after ${templates[i - 1].title}.`,
  }))
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

/** Shapes the backend user into the frontend `User` type. */
function mapApiUser(apiUser: ApiUser): User {
  const fullName = [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ').trim()
  return {
    id: apiUser.id,
    name: fullName || apiUser.email,
    firstName: apiUser.firstName,
    email: apiUser.email,
    joined: apiUser.createdAt.slice(0, 10),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const alert = useAlert()

  // Mirrors the latest state so event handlers can compute the next state
  // (for optimistic updates) without waiting for a re-render.
  const stateRef = useRef(state)
  stateRef.current = state

  /** Reduces + dispatches an action, returning the resulting state. */
  const dispatchNext = useCallback((action: Parameters<typeof reducer>[1]) => {
    const next = reducer(stateRef.current, action)
    stateRef.current = next
    dispatch(action)
    return next
  }, [])

  const reloadData = useCallback(async () => {
    const [apiPaths, apiProjects] = await Promise.all([
      learningPathsApi.list(),
      projectsApi.list(),
    ])
    const paths = apiPaths.map(mapApiLearningPath)
    const content = paths.reduce<Record<string, SessionContent>>(
      (acc, path) => Object.assign(acc, contentForPath(path)),
      {},
    )
    dispatchNext({
      type: 'data/loaded',
      paths,
      projects: apiProjects.map(mapApiProject),
      content,
    })
  }, [dispatchNext])

  const handleSyncError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        dispatchNext({ type: 'auth/signOut' })
        return
      }
      alert.fromError(error, 'Could not save your changes.')
      void reloadData().catch(() => undefined)
    },
    [alert, dispatchNext, reloadData],
  )

  // Restore the session from the httpOnly cookie on first load.
  useEffect(() => {
    const controller = new AbortController()
    authApi
      .me(controller.signal)
      .then((apiUser) => dispatch({ type: 'auth/setUser', user: mapApiUser(apiUser) }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        dispatch({ type: 'auth/sessionGuest' })
      })
    return () => controller.abort()
  }, [])

  // Load the user's paths + projects once they are authenticated.
  useEffect(() => {
    if (state.authStatus !== 'authenticated') return
    let cancelled = false
    dispatch({ type: 'data/loading' })

    void (async () => {
      try {
        const [apiPaths, apiProjects] = await Promise.all([
          learningPathsApi.list(),
          projectsApi.list(),
        ])
        if (cancelled) return
        const paths = apiPaths.map(mapApiLearningPath)
        const content = paths.reduce<Record<string, SessionContent>>(
          (acc, path) => Object.assign(acc, contentForPath(path)),
          {},
        )
        dispatch({
          type: 'data/loaded',
          paths,
          projects: apiProjects.map(mapApiProject),
          content,
        })
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.isUnauthorized) {
          dispatch({ type: 'auth/signOut' })
          return
        }
        alert.fromError(error, 'Could not load your learning data.')
        dispatch({ type: 'data/loaded', paths: [], projects: [], content: {} })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.authStatus, alert])

  const login = useCallback(async (email: string, password: string) => {
    const user = mapApiUser(await authApi.login({ email, password }))
    dispatch({ type: 'auth/setUser', user })
    return user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const user = mapApiUser(await authApi.register(input))
    dispatch({ type: 'auth/setUser', user })
    return user
  }, [])

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'auth/setUser', user: mapApiUser(await authApi.me()) })
  }, [])

  const signOut = useCallback(() => {
    dispatch({ type: 'auth/signOut' })
    // Best-effort cookie clear; the local session is gone either way.
    void authApi.logout().catch(() => undefined)
  }, [])

  const toast = useCallback(
    (text: string, variant: AlertVariant = 'info') => {
      alert.show(text, { variant })
    },
    [alert],
  )

  /** Persists a path's progress fields (sections + stats + activity bookkeeping). */
  const pushPathProgress = useCallback(
    (path: LearningPath) => {
      void learningPathsApi
        .update(path.id, {
          sections: path.sections,
          stats: path.stats,
          currentSectionId: path.currentSectionId || null,
          completedActivities: path.completedActivities,
          countedSessions: path.countedSessions,
          assessmentResults: path.assessmentResults,
          adaptationNote: path.adaptationNote,
        })
        .catch(handleSyncError)
    },
    [handleSyncError],
  )

  const pushProject = useCallback(
    (project: Project) => {
      void projectsApi
        .update(project.id, {
          completedTaskIds: project.completedTaskIds,
          submitted: project.submitted,
          reviewed: project.reviewed,
          status: project.status,
          submittedAt: project.submittedAt,
          feedback: project.feedback,
        })
        .catch(handleSyncError)
    },
    [handleSyncError],
  )

  const createPath = useCallback(
    async (subject: string, answers: SetupAnswers) => {
      // Reopening a subject that already has a path: update its goal, don't duplicate.
      const matchId = findTemplateMatch(subject, stateRef.current.paths)
      if (matchId) {
        const goal = answers.outcome.trim()
        if (goal) {
          const updated = mapApiLearningPath(await learningPathsApi.update(matchId, { goal }))
          dispatchNext({ type: 'path/replace', path: updated })
        }
        dispatchNext({ type: 'path/activate', id: matchId })
        dispatchNext({ type: 'setup/reset' })
        return
      }

      const templates = sectionsForSubject(subject)
      const sections = buildSections(subject, templates)
      const created = await learningPathsApi.create({
        subject: titleCase(subject),
        goal: answers.outcome.trim() || `Build real confidence with ${titleCase(subject)}.`,
        experience: answers.experience,
        reason: answers.reason,
        weeklyHours: answers.weeklyHours ?? '5',
        intensity: answers.intensity ?? 'balanced',
        formats: answers.formats.length ? answers.formats : ['articles', 'exercises'],
        targetDate: answers.targetDate || null,
        sections,
      })
      const path = mapApiLearningPath(created)
      dispatchNext({ type: 'path/add', path, content: contentForPath(path) })

      const scheduledDays = answers.days.map((d) => DAY_LABELS[d]).filter(Boolean)
      const scheduledTime = answers.timeWindow ? WINDOW_TIMES[answers.timeWindow] : undefined
      if (scheduledDays.length > 0 || scheduledTime) {
        dispatchNext({
          type: 'settings/schedule',
          patch: {
            ...(scheduledDays.length > 0 ? { days: scheduledDays } : {}),
            ...(scheduledTime ? { time: scheduledTime } : {}),
          },
        })
      }
    },
    [dispatchNext],
  )

  const deletePath = useCallback(
    (id: string) => {
      dispatchNext({ type: 'path/delete', id })
      void learningPathsApi.remove(id).catch(handleSyncError)
    },
    [dispatchNext, handleSyncError],
  )

  const updatePathPreferences = useCallback(
    (
      pathId: string,
      patch: Partial<Pick<LearningPath, 'weeklyHours' | 'intensity' | 'formats' | 'targetDate' | 'goal'>>,
    ) => {
      dispatchNext({ type: 'path/preferences', pathId, patch })
      const apiPatch: UpdateLearningPathInput = {}
      if (patch.goal !== undefined) apiPatch.goal = patch.goal
      if (patch.weeklyHours !== undefined) apiPatch.weeklyHours = patch.weeklyHours
      if (patch.intensity !== undefined) apiPatch.intensity = patch.intensity
      if (patch.formats !== undefined) apiPatch.formats = patch.formats
      if (patch.targetDate !== undefined) apiPatch.targetDate = patch.targetDate || null
      if (Object.keys(apiPatch).length === 0) return
      void learningPathsApi.update(pathId, apiPatch).catch(handleSyncError)
    },
    [dispatchNext, handleSyncError],
  )

  const completeActivity = useCallback(
    (pathId: string, sectionId: string, kind: ActivityKind, title: string, minutes: number) => {
      const before = stateRef.current
      const next = dispatchNext({
        type: 'path/activity',
        pathId,
        sectionId,
        kind,
        title,
        minutes,
      })
      if (next === before) return
      const path = next.paths.find((p) => p.id === pathId)
      if (path) pushPathProgress(path)
    },
    [dispatchNext, pushPathProgress],
  )

  const submitAssessment = useCallback(
    (
      pathId: string,
      sectionId: string,
      assessmentId: string,
      title: string,
      score: number,
      total: number,
      minutes: number,
    ) => {
      const before = stateRef.current
      const next = dispatchNext({
        type: 'path/assessment',
        pathId,
        sectionId,
        assessmentId,
        title,
        score,
        total,
        minutes,
      })
      if (next === before) return
      const path = next.paths.find((p) => p.id === pathId)
      if (path) pushPathProgress(path)
    },
    [dispatchNext, pushPathProgress],
  )

  const toggleTask = useCallback(
    (projectId: string, taskId: string) => {
      const before = stateRef.current
      const next = dispatchNext({ type: 'project/toggleTask', projectId, taskId })
      if (next === before) return
      const project = next.projects.find((p) => p.id === projectId)
      if (project) pushProject(project)
    },
    [dispatchNext, pushProject],
  )

  const submitProject = useCallback(
    (projectId: string) => {
      const next = dispatchNext({ type: 'project/submit', projectId })
      const project = next.projects.find((p) => p.id === projectId)
      if (project) pushProject(project)
    },
    [dispatchNext, pushProject],
  )

  const reviewProject = useCallback(
    (projectId: string) => {
      const next = dispatchNext({ type: 'project/review', projectId })
      const project = next.projects.find((p) => p.id === projectId)
      if (project) pushProject(project)
    },
    [dispatchNext, pushProject],
  )

  const activePath = useMemo(
    () => state.paths.find((p) => p.id === state.activePathId) ?? state.paths[0] ?? null,
    [state.paths, state.activePathId],
  )

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  )

  const store = useMemo<Store>(() => {
    return {
      state,
      activePath,
      unreadCount,
      login,
      register,
      refreshSession,
      signOut,
      reloadData,
      patchSetup: (patch) => dispatch({ type: 'setup/patch', patch }),
      resetSetup: () => dispatch({ type: 'setup/reset' }),
      activatePath: (id) => dispatch({ type: 'path/activate', id }),
      createPath,
      deletePath,
      updatePathPreferences,
      completeActivity,
      submitAssessment,
      toggleTask,
      submitProject,
      reviewProject,
      markRead: (id) => dispatch({ type: 'notif/read', id }),
      markAllRead: () => dispatch({ type: 'notif/readAll' }),
      updatePreferences: (patch) => dispatch({ type: 'settings/preferences', patch }),
      updateSchedule: (patch) => dispatch({ type: 'settings/schedule', patch }),
      updateNotificationSettings: (patch) =>
        dispatch({ type: 'settings/notifications', patch }),
      updateAi: (patch) => dispatch({ type: 'settings/ai', patch }),
      updateProfile: (patch) => dispatch({ type: 'profile/update', patch }),
      toast,
      sessionContentFor: (sectionId) =>
        state.customContent[sectionId] ??
        (baseSessionContent[sectionId] as SessionContent | undefined) ??
        null,
    }
  }, [
    state,
    activePath,
    unreadCount,
    login,
    register,
    refreshSession,
    signOut,
    reloadData,
    createPath,
    deletePath,
    updatePathPreferences,
    completeActivity,
    submitAssessment,
    toggleTask,
    submitProject,
    reviewProject,
    toast,
  ])

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

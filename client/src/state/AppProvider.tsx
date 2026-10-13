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
  Project,
  SetupAnswers,
  User,
} from '../types'
import type { AlertVariant } from '../components/ui/Alert'
import { findTemplateMatch } from '../data'
import {
  ApiError,
  authApi,
  billingApi,
  learningPathsApi,
  mapApiLearningPath,
  mapApiNotification,
  mapApiProject,
  notificationsApi,
  projectsApi,
  sessionsApi,
  settingsApi,
  type ApiUser,
  type RegisterInput,
  type UpdateLearningPathInput,
  type UpdateSettingsInput,
} from '../lib/api'
import { useAlert } from './alertContext'
import { saveLastAuth } from '../lib/lastAuth'
import type { Store } from './store'
import { AppContext, initialState, reducer, titleCase } from './store'

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
    emailVerified: Boolean(apiUser.emailVerified),
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
    const [apiPaths, apiProjects, apiNotifications, apiSettings, apiBilling] = await Promise.all([
      learningPathsApi.list(),
      projectsApi.list(),
      notificationsApi.list().catch(() => []),
      settingsApi.get().catch(() => null),
      billingApi.status().catch(() => null),
    ])
    dispatchNext({
      type: 'data/loaded',
      paths: apiPaths.map(mapApiLearningPath),
      projects: apiProjects.map(mapApiProject),
      content: {},
    })
    dispatchNext({ type: 'notif/loaded', notifications: apiNotifications.map(mapApiNotification) })
    dispatchNext({ type: 'billing/loaded', billing: apiBilling })
    if (apiSettings) {
      dispatchNext({
        type: 'settings/loaded',
        timezone: apiSettings.timezone,
        schedule: { days: apiSettings.reminderDays, time: apiSettings.reminderTime },
        notifications: {
          dailyReminder: apiSettings.dailyReminder,
          weeklySummary: apiSettings.weeklySummary,
        },
      })
    }
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
        const [apiPaths, apiProjects, apiNotifications, apiSettings] = await Promise.all([
          learningPathsApi.list(),
          projectsApi.list(),
          notificationsApi.list().catch(() => []),
          settingsApi.get().catch(() => null),
        ])
        if (cancelled) return
        dispatch({
          type: 'data/loaded',
          paths: apiPaths.map(mapApiLearningPath),
          projects: apiProjects.map(mapApiProject),
          content: {},
        })
        dispatch({
          type: 'notif/loaded',
          notifications: apiNotifications.map(mapApiNotification),
        })
        if (apiSettings) {
          dispatch({
            type: 'settings/loaded',
            timezone: apiSettings.timezone,
            schedule: { days: apiSettings.reminderDays, time: apiSettings.reminderTime },
            notifications: {
              dailyReminder: apiSettings.dailyReminder,
              weeklySummary: apiSettings.weeklySummary,
            },
          })
        }
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

  // Periodically refresh notifications in the background so reminders and path readiness appear live.
  useEffect(() => {
    if (state.authStatus !== 'authenticated') return

    const poll = async () => {
      try {
        const notifs = await notificationsApi.list()
        dispatchNext({ type: 'notif/loaded', notifications: notifs.map(mapApiNotification) })
      } catch {
        // Silently ignore background poll error
      }
    }

    const interval = window.setInterval(poll, 30_000)
    window.addEventListener('focus', poll)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', poll)
    }
  }, [state.authStatus, dispatchNext])

  // Paths still being designed by the AI worker. Poll each one until it
  // settles so every page (path, today, …) updates live instead of going
  // stale the moment the user leaves the generate screen.
  const buildingKey = useMemo(
    () =>
      state.paths
        .filter(
          (p) =>
            p.generationStatus === 'queued' ||
            p.generationStatus === 'generating' ||
            p.generationStatus === 'idle',
        )
        .map((p) => p.id)
        .sort()
        .join(','),
    [state.paths],
  )
  const watchedBuilds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (state.authStatus !== 'authenticated' || buildingKey === '') return
    const ids = buildingKey.split(',')
    for (const id of ids) watchedBuilds.current.add(id)
    let cancelled = false

    const refresh = async (id: string) => {
      try {
        const updated = mapApiLearningPath(await learningPathsApi.get(id))
        if (cancelled) return
        dispatchNext({ type: 'path/replace', path: updated })
        if (updated.generationStatus === 'ready' || updated.generationStatus === 'failed') {
          if (watchedBuilds.current.has(id)) {
            watchedBuilds.current.delete(id)
            if (updated.generationStatus === 'ready') {
              alert.success(`Your ${updated.subject} path is ready.`)
            }
          }
        }
      } catch (error) {
        // Vanished server-side (deleted elsewhere): drop it so we stop polling.
        if (!cancelled && error instanceof ApiError && error.status === 404) {
          watchedBuilds.current.delete(id)
          dispatchNext({ type: 'path/delete', id })
        }
        // Anything else is transient; the next tick retries silently.
      }
    }

    const tick = () => {
      for (const id of ids) void refresh(id)
    }
    tick()
    const timer = window.setInterval(tick, 2000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [state.authStatus, buildingKey, alert, dispatchNext])

  const login = useCallback(async (email: string, password: string) => {
    const user = mapApiUser(await authApi.login({ email, password }))
    saveLastAuth({ method: 'email', email })
    dispatch({ type: 'auth/setUser', user })
    return user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const user = mapApiUser(await authApi.register(input))
    saveLastAuth({ method: 'email', email: input.email })
    dispatch({ type: 'auth/setUser', user })
    return user
  }, [])

  const verifyEmail = useCallback(async (code: string) => {
    const user = mapApiUser(await authApi.verifyEmail(code))
    dispatch({ type: 'auth/setUser', user })
    return user
  }, [])

  const resendVerificationCode = useCallback(async () => {
    await authApi.resendVerificationCode()
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    await authApi.resetPassword(token, password)
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword)
  }, [])

  const refreshBilling = useCallback(async () => {
    const billing = await billingApi.status().catch(() => null)
    dispatch({ type: 'billing/loaded', billing })
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
          submissionNote: project.submissionNote,
          feedback: project.feedback,
        })
        .catch(handleSyncError)
    },
    [handleSyncError],
  )

  /** Persists reminder/notification preferences to the server (best-effort). */
  const persistSettings = useCallback(
    (patch: UpdateSettingsInput) => {
      if (Object.keys(patch).length === 0) return
      void settingsApi.update(patch).catch(handleSyncError)
    },
    [handleSyncError],
  )

  const createPath = useCallback(
    async (subject: string, answers: SetupAnswers): Promise<LearningPath> => {
      // Reopening a subject that already has a path: update its goal, don't duplicate.
      const matchId = findTemplateMatch(subject, stateRef.current.paths)
      if (matchId) {
        let current = stateRef.current.paths.find((p) => p.id === matchId)!
        const goal = answers.outcome.trim()
        if (goal) {
          current = mapApiLearningPath(await learningPathsApi.update(matchId, { goal }))
          dispatchNext({ type: 'path/replace', path: current })
        }
        dispatchNext({ type: 'path/activate', id: matchId })
        dispatchNext({ type: 'setup/reset' })
        return current
      }

      const created = await learningPathsApi.create({
        subject: titleCase(subject),
        goal: answers.outcome.trim() || `Build real confidence with ${titleCase(subject)}.`,
        experience: answers.experience,
        reason: answers.reason,
        weeklyHours: answers.weeklyHours ?? '5',
        intensity: answers.intensity ?? 'balanced',
        formats: answers.formats.length ? answers.formats : ['articles', 'exercises'],
        targetDate: answers.targetDate || null,
      })
      const path = mapApiLearningPath(created)
      dispatchNext({ type: 'path/add', path, content: {} })

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
      return path
    },
    [dispatchNext],
  )

  const retryPathBuild = useCallback(
    async (id: string): Promise<LearningPath> => {
      const updated = mapApiLearningPath(await learningPathsApi.retry(id))
      dispatchNext({ type: 'path/replace', path: updated })
      return updated
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
    (projectId: string, note: string) => {
      const next = dispatchNext({
        type: 'project/submit',
        projectId,
        submittedAt: new Date().toISOString(),
        note,
      })
      const project = next.projects.find((p) => p.id === projectId)
      if (project) pushProject(project)
    },
    [dispatchNext, pushProject],
  )

  const reviewProject = useCallback(
    async (projectId: string) => {
      const updated = mapApiProject(await projectsApi.review(projectId))
      dispatchNext({ type: 'project/replace', project: updated })
    },
    [dispatchNext],
  )

  const markRead = useCallback(
    (id: string) => {
      dispatchNext({ type: 'notif/read', id })
      void notificationsApi.markRead(id).catch(handleSyncError)
    },
    [dispatchNext, handleSyncError],
  )

  const markAllRead = useCallback(() => {
    dispatchNext({ type: 'notif/readAll' })
    void notificationsApi.markAllRead().catch(handleSyncError)
  }, [dispatchNext, handleSyncError])

  // Sections whose content request is already in flight (avoid duplicates).
  const contentInFlight = useRef<Set<string>>(new Set())

  const ensureSessionContent = useCallback(
    async (sectionId: string, force = false) => {
      const current = stateRef.current
      if (!force && current.customContent[sectionId]) return
      if (contentInFlight.current.has(sectionId)) return

      const path = current.paths.find((p) => p.sections.some((s) => s.id === sectionId))
      const section = path?.sections.find((s) => s.id === sectionId)
      if (!path || !section) return

      contentInFlight.current.add(sectionId)
      dispatchNext({ type: 'content/loading', sectionId })
      try {
        const content = await sessionsApi.getOrGenerate(path.id, sectionId, force)
        dispatchNext({ type: 'content/loaded', content: { [sectionId]: content } })
      } catch (error) {
        const message =
          error instanceof ApiError && error.message
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not generate session content.'
        dispatchNext({ type: 'content/error', sectionId, error: message })
      } finally {
        contentInFlight.current.delete(sectionId)
      }
    },
    [dispatchNext],
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
      verifyEmail,
      resendVerificationCode,
      forgotPassword,
      resetPassword,
      changePassword,
      refreshSession,
      signOut,
      reloadData,
      patchSetup: (patch) => dispatch({ type: 'setup/patch', patch }),
      resetSetup: () => dispatch({ type: 'setup/reset' }),
      activatePath: (id) => dispatch({ type: 'path/activate', id }),
      createPath,
      retryPathBuild,
      deletePath,
      updatePathPreferences,
      completeActivity,
      submitAssessment,
      toggleTask,
      submitProject,
      reviewProject,
      markRead,
      markAllRead,
      ensureSessionContent,
      sessionContentError: (sectionId) => state.contentErrors[sectionId] || null,
      isSessionContentLoading: (sectionId) => Boolean(state.contentLoading[sectionId]),
      updatePreferences: (patch) => dispatch({ type: 'settings/preferences', patch }),
      updateSchedule: (patch) => {
        dispatch({ type: 'settings/schedule', patch })
        const apiPatch: UpdateSettingsInput = {}
        if (patch.days) apiPatch.reminderDays = patch.days
        if (patch.time) apiPatch.reminderTime = patch.time
        persistSettings(apiPatch)
      },
      updateNotificationSettings: (patch) => {
        dispatch({ type: 'settings/notifications', patch })
        const apiPatch: UpdateSettingsInput = {}
        if (patch.dailyReminder !== undefined) apiPatch.dailyReminder = patch.dailyReminder
        if (patch.weeklySummary !== undefined) apiPatch.weeklySummary = patch.weeklySummary
        persistSettings(apiPatch)
      },
      updateAi: (patch) => dispatch({ type: 'settings/ai', patch }),
      updateProfile: (patch) => {
        dispatch({ type: 'profile/update', patch })
        if (patch.timezone !== undefined) persistSettings({ timezone: patch.timezone })
      },
      toast,
      sessionContentFor: (sectionId) => state.customContent[sectionId] ?? null,
      refreshBilling,
    }
  }, [
    state,
    activePath,
    unreadCount,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshSession,
    signOut,
    reloadData,
    createPath,
    retryPathBuild,
    deletePath,
    updatePathPreferences,
    completeActivity,
    submitAssessment,
    toggleTask,
    submitProject,
    reviewProject,
    markRead,
    markAllRead,
    ensureSessionContent,
    persistSettings,
    refreshBilling,
    toast,
  ])

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

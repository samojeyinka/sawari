import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { SessionContent, User } from '../types'
import { baseSessionContent } from '../data'
import type { AlertVariant } from '../components/ui/Alert'
import { authApi, type ApiUser, type RegisterInput } from '../lib/api'
import { useAlert } from './alertContext'
import type { Store } from './store'
import { AppContext, initialState, reducer } from './store'

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
      signOut,
      patchSetup: (patch) => dispatch({ type: 'setup/patch', patch }),
      resetSetup: () => dispatch({ type: 'setup/reset' }),
      activatePath: (id) => dispatch({ type: 'path/activate', id }),
      createPath: (subj, answers) =>
        dispatch({
          type: 'path/create',
          pathId: `path-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
          subject: subj,
          setup: answers,
        }),
      deletePath: (id) => dispatch({ type: 'path/delete', id }),
      updatePathPreferences: (pathId, patch) =>
        dispatch({ type: 'path/preferences', pathId, patch }),
      completeActivity: (pathId, sectionId, kind, title, minutes) =>
        dispatch({ type: 'path/activity', pathId, sectionId, kind, title, minutes }),
      submitAssessment: (pathId, sectionId, assessmentId, title, score, total, minutes) =>
        dispatch({
          type: 'path/assessment',
          pathId,
          sectionId,
          assessmentId,
          title,
          score,
          total,
          minutes,
        }),
      toggleTask: (projectId, taskId) =>
        dispatch({ type: 'project/toggleTask', projectId, taskId }),
      submitProject: (projectId) => dispatch({ type: 'project/submit', projectId }),
      reviewProject: (projectId) => dispatch({ type: 'project/review', projectId }),
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
  }, [state, activePath, unreadCount, login, register, signOut, toast])

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

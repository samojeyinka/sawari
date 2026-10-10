import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Alert, type AlertVariant } from '../components/ui/Alert'
import { ApiError } from '../lib/api'
import { AlertContext, type AlertApi, type AlertOptions } from './alertContext'

/* ------------------------------------------------------------------ */
/*  Global alert system.                                               */
/*  One component handles every API result / notification, so call     */
/*  sites never hand-write alert markup:                               */
/*    const alert = useAlert()                                         */
/*    alert.success('Profile saved')                                   */
/*    alert.fromError(err)         // maps any thrown error to an alert */
/* ------------------------------------------------------------------ */

interface AlertRecord {
  id: number
  variant: AlertVariant
  message: ReactNode
  title?: ReactNode
  action?: ReactNode
}

const DEFAULT_DURATION = 5000

/** Turns any thrown value into a readable, user-facing message. */
function messageFromError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const fields = (error.details as { fields?: Record<string, string[]> } | undefined)?.fields
    if (fields) {
      const parts = Object.values(fields).flat().filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setAlerts((current) => current.filter((alert) => alert.id !== id))
  }, [])

  const show = useCallback(
    (message: ReactNode, options: AlertOptions = {}) => {
      const id = ++nextId.current
      const { variant = 'info', title, action, duration = DEFAULT_DURATION } = options
      setAlerts((current) => [...current, { id, variant, message, title, action }])
      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss],
  )

  const api = useMemo<AlertApi>(() => {
    const withVariant =
      (variant: AlertVariant) =>
      (message: ReactNode, options: AlertOptions = {}) =>
        show(message, { ...options, variant })

    return {
      show,
      success: withVariant('success'),
      error: withVariant('error'),
      warning: withVariant('warning'),
      info: withVariant('info'),
      fromError: (error, fallback = 'Something went wrong. Please try again.') =>
        withVariant('error')(messageFromError(error, fallback), { duration: 6500 }),
      dismiss,
      clear: () => setAlerts([]),
    }
  }, [show, dismiss])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
      pending.clear()
    }
  }, [])

  return (
    <AlertContext.Provider value={api}>
      {children}
      <AlertViewport alerts={alerts} onDismiss={dismiss} />
    </AlertContext.Provider>
  )
}

function AlertViewport({
  alerts,
  onDismiss,
}: {
  alerts: AlertRecord[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-4 sm:items-end sm:px-0"
    >
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto w-full max-w-sm animate-rise">
          <Alert
            variant={alert.variant}
            title={alert.title}
            action={alert.action}
            onClose={() => onDismiss(alert.id)}
          >
            {alert.message}
          </Alert>
        </div>
      ))}
    </div>
  )
}

import { createContext, useContext, type ReactNode } from 'react'
import type { AlertVariant } from '../components/ui/Alert'

/* ------------------------------------------------------------------ */
/*  Global alert context. Kept separate from AlertProvider so the       */
/*  provider file only exports a component (React fast-refresh).        */
/* ------------------------------------------------------------------ */

export interface AlertOptions {
  variant?: AlertVariant
  title?: ReactNode
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number
  action?: ReactNode
}

export interface AlertApi {
  show: (message: ReactNode, options?: AlertOptions) => number
  success: (message: ReactNode, options?: AlertOptions) => number
  error: (message: ReactNode, options?: AlertOptions) => number
  warning: (message: ReactNode, options?: AlertOptions) => number
  info: (message: ReactNode, options?: AlertOptions) => number
  fromError: (error: unknown, fallback?: string) => number
  dismiss: (id: number) => void
  clear: () => void
}

export const AlertContext = createContext<AlertApi | null>(null)

export function useAlert(): AlertApi {
  const context = useContext(AlertContext)
  if (!context) throw new Error('useAlert must be used inside AlertProvider')
  return context
}

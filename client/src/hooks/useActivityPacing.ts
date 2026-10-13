import { useCallback, useEffect, useRef, useState } from 'react'

export interface PacingState {
  elapsedSeconds: number
  targetSeconds: number
  remainingSeconds: number
  progressPercent: number
  isUnlocked: boolean
  status: 'active' | 'paused_tab' | 'paused_idle' | 'unlocked'
  fastForward: () => void
}

const STORAGE_PREFIX = 'sawari_pacing_'
const IDLE_TIMEOUT_MS = 180_000 // 3 minutes of zero input pauses the timer

export function useActivityPacing({
  activityId,
  baseMinutes,
  multiplier = 2,
  done,
  disabled = false,
  onUnlocked,
}: {
  activityId: string
  baseMinutes: number
  multiplier?: number
  done: boolean
  /** Preview mode: no timer, no persistence, never unlocks. */
  disabled?: boolean
  onUnlocked?: () => void
}): PacingState {
  const targetSeconds = Math.max(60, Math.round(baseMinutes * 60 * multiplier))
  const storageKey = `${STORAGE_PREFIX}${activityId}`

  const loadSavedState = (): { elapsed: number; unlocked: boolean } => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { elapsed?: number; unlocked?: boolean }
        return {
          elapsed: typeof parsed.elapsed === 'number' ? parsed.elapsed : 0,
          unlocked: Boolean(parsed.unlocked),
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return { elapsed: 0, unlocked: false }
  }

  const [saved] = useState(loadSavedState)
  const [elapsedSeconds, setElapsedSeconds] = useState(saved.elapsed)
  const [isUnlocked, setIsUnlocked] = useState(done || saved.unlocked || saved.elapsed >= targetSeconds)
  const [isTabVisible, setIsTabVisible] = useState(() => !document.hidden)
  const [isIdle, setIsIdle] = useState(false)

  const lastActivityRef = useRef<number>(Date.now())
  const onUnlockedRef = useRef(onUnlocked)
  onUnlockedRef.current = onUnlocked

  // Save progress to localStorage
  const saveProgress = useCallback(
    (elapsed: number, unlocked: boolean) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ elapsed, unlocked, updatedAt: Date.now() }),
        )
      } catch {
        // Ignore localStorage quota errors
      }
    },
    [storageKey],
  )

  // Track tab visibility and window focus
  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden
      setIsTabVisible(visible)
      if (visible) {
        lastActivityRef.current = Date.now()
        setIsIdle(false)
      }
    }

    const handleFocus = () => {
      setIsTabVisible(true)
      lastActivityRef.current = Date.now()
      setIsIdle(false)
    }

    const handleBlur = () => {
      // Don't mark hidden immediately on blur unless document is hidden or focus is completely lost
      if (document.hidden) {
        setIsTabVisible(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Track user activity (mouse, keyboard, scroll) to pause when idle
  useEffect(() => {
    let throttleTimeout: number | undefined

    const onUserActivity = () => {
      if (throttleTimeout) return
      throttleTimeout = window.setTimeout(() => {
        throttleTimeout = undefined
        lastActivityRef.current = Date.now()
        setIsIdle(false)
      }, 500)
    }

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    for (const event of events) {
      window.addEventListener(event, onUserActivity, { passive: true })
    }

    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout)
      for (const event of events) {
        window.removeEventListener(event, onUserActivity)
      }
    }
  }, [])

  // Timer interval
  useEffect(() => {
    if (disabled || done || isUnlocked) return

    const interval = window.setInterval(() => {
      // Check idle status
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        setIsIdle(true)
        return
      }

      // Only tick when tab is visible and user is not idle
      if (!isTabVisible || isIdle) return

      setElapsedSeconds((prev) => {
        const next = prev + 1
        saveProgress(next, next >= targetSeconds)

        if (next >= targetSeconds && !isUnlocked) {
          setIsUnlocked(true)
          onUnlockedRef.current?.()
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [disabled, done, isUnlocked, isTabVisible, isIdle, targetSeconds, saveProgress])

  // If activity was already completed from backend/state
  useEffect(() => {
    if (done && !isUnlocked) {
      setIsUnlocked(true)
    }
  }, [done, isUnlocked])

  const fastForward = useCallback(() => {
    setElapsedSeconds(targetSeconds)
    setIsUnlocked(true)
    saveProgress(targetSeconds, true)
    onUnlockedRef.current?.()
  }, [targetSeconds, saveProgress])

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100))

  let status: PacingState['status'] = 'active'
  if (isUnlocked || done) {
    status = 'unlocked'
  } else if (!isTabVisible) {
    status = 'paused_tab'
  } else if (isIdle) {
    status = 'paused_idle'
  }

  return {
    elapsedSeconds,
    targetSeconds,
    remainingSeconds,
    progressPercent,
    isUnlocked,
    status,
    fastForward,
  }
}

export function formatPacingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

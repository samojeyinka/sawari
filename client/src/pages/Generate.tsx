import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  LuArrowRight,
  LuBell,
  LuCheck,
  LuLoaderCircle,
  LuRefreshCw,
  LuSparkles,
  LuTriangleAlert,
} from 'react-icons/lu'
import { useApp } from '../state/store'
import { aiApi, learningPathsApi, mapApiLearningPath } from '../lib/api'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { cx } from '../lib/utils'
import type { GenerationStatus } from '../types'

const PHASES = [
  'Sending your brief',
  'Designing your path',
  'Ready',
]

export function GeneratePage() {
  const { state, createPath, retryPathBuild } = useApp()
  const navigate = useNavigate()
  const setup = state.setup

  const [preflightStatus, setPreflightStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [preflightError, setPreflightError] = useState<string | null>(null)

  const [activePathId, setActivePathId] = useState<string | null>(null)
  const [pathStatus, setPathStatus] = useState<GenerationStatus | null>(null)
  const [pathError, setPathError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const creationTriggered = useRef(false)

  const runPreflightAndCreate = useCallback(async () => {
    setPreflightStatus('checking')
    setPreflightError(null)

    try {
      const health = await aiApi.health()
      if (!health.available) {
        setPreflightStatus('unavailable')
        setPreflightError(health.error || 'AI generation service is currently unreachable.')
        return
      }

      setPreflightStatus('available')

      // Call createPath with the brief (no sections).
      const path = await createPath(setup.subject, setup)
      setActivePathId(path.id)
      setPathStatus(path.generationStatus ?? 'queued')

      if (path.generationStatus === 'ready' && path.sections.length > 0) {
        navigate('/app/path', { replace: true })
      }
    } catch (err) {
      setPreflightStatus('unavailable')
      const message = err instanceof Error ? err.message : 'Could not contact the AI service.'
      setPreflightError(message)
    }
  }, [createPath, navigate, setup])

  // Run preflight and create path once authenticated
  useEffect(() => {
    if (state.authStatus !== 'authenticated') return
    if (!setup.subject.trim()) return
    if (creationTriggered.current) return
    creationTriggered.current = true

    void runPreflightAndCreate()
  }, [state.authStatus, setup.subject, runPreflightAndCreate])

  // Poll for path generation completion
  useEffect(() => {
    if (!activePathId) return
    if (pathStatus === 'ready' || pathStatus === 'failed') return

    const poll = async () => {
      try {
        const apiPath = await learningPathsApi.get(activePathId)
        const updated = mapApiLearningPath(apiPath)
        setPathStatus(updated.generationStatus ?? 'ready')

        if (updated.generationStatus === 'failed') {
          setPathError(updated.generationError || 'Failed to design your path.')
        }
      } catch {
        // Transient network failure during polling; keep waiting
      }
    }

    const timer = window.setInterval(() => {
      void poll()
    }, 1500)

    return () => window.clearInterval(timer)
  }, [activePathId, pathStatus])

  const handleRetryPreflight = () => {
    creationTriggered.current = false
    void runPreflightAndCreate()
  }

  const handleRetryPathBuild = async () => {
    if (!activePathId) return
    setIsRetrying(true)
    setPathError(null)
    try {
      const path = await retryPathBuild(activePathId)
      setPathStatus(path.generationStatus ?? 'queued')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Retry failed.'
      setPathError(message)
    } finally {
      setIsRetrying(false)
    }
  }

  if (state.authStatus === 'guest') {
    const returnTarget = encodeURIComponent('/generate')
    const subjectParam = setup.subject ? `&subject=${encodeURIComponent(setup.subject)}` : ''
    return <Navigate to={`/login?returnTo=${returnTarget}${subjectParam}`} replace />
  }

  if (!setup.subject.trim() && !activePathId) {
    return <Navigate to="/setup" replace />
  }

  const weekly = setup.weeklyHours === '15+' ? '15+' : (setup.weeklyHours ?? '5')

  // Calculate real phase indices
  let activePhaseIndex = 0
  let progressPercent = 15

  if (preflightStatus === 'checking') {
    activePhaseIndex = 0
    progressPercent = 10
  } else if (pathStatus === 'queued') {
    activePhaseIndex = 0
    progressPercent = 33
  } else if (pathStatus === 'generating') {
    activePhaseIndex = 1
    progressPercent = 66
  } else if (pathStatus === 'ready') {
    activePhaseIndex = 2
    progressPercent = 100
  }

  return (
    <div className="app-theme flex min-h-screen flex-col bg-band">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" aria-label="Sawari home">
            <Logo size="sm" />
          </Link>
          <span className="text-[13px] text-muted">Building your path</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        {preflightStatus === 'unavailable' ? (
          <div className="animate-rise text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <LuTriangleAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-ink">AI is unavailable right now</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
              Sawari builds tailored paths using DeepSeek AI. The service cannot be reached at the moment.
            </p>
            {preflightError && (
              <p className="mx-auto mt-3 max-w-md rounded-lg border border-line bg-canvas/60 px-4 py-2.5 text-xs text-muted">
                {preflightError}
              </p>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" onClick={handleRetryPreflight}>
                <LuRefreshCw className="mr-2 h-4 w-4" />
                Retry connection
              </Button>
            </div>
            <Link
              to="/setup"
              className="mt-4 inline-block text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Change my answers
            </Link>
          </div>
        ) : pathStatus === 'failed' ? (
          <div className="animate-rise text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
              <LuTriangleAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-ink">Could not design your path</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
              We encountered an issue while generating topic-specific sections for {setup.subject}.
            </p>
            {pathError && (
              <p className="mx-auto mt-3 max-w-md rounded-lg border border-line bg-canvas/60 px-4 py-2.5 text-xs text-muted">
                {pathError}
              </p>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" onClick={handleRetryPathBuild} loading={isRetrying}>
                <LuRefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
            <Link
              to="/setup"
              className="mt-4 inline-block text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Change my answers
            </Link>
          </div>
        ) : pathStatus === 'ready' ? (
          <div className="animate-rise text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success shadow-[0_0_24px_rgba(34,197,94,0.18)]">
              <LuCheck className="h-7 w-7" strokeWidth={3} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-ink">Your path is ready!</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
              DeepSeek AI has tailored a complete curriculum for{' '}
              <span className="font-semibold text-ink">{setup.subject}</span> with domain-specific lessons,
              worked examples, exercises, and curated resources.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/app/path')}>
                Open Learning Path
                <LuArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/app/today')}>
                Go to Today
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-rise">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft/40 px-3 py-1 text-xs font-medium text-accent-strong">
                <LuSparkles className="h-3.5 w-3.5" />
                AI Curriculum Engine
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-ink">Designing {setup.subject}…</h1>
            <p className="mt-1.5 text-[15px] text-muted">
              Shaping it around {weekly} hours a week and a {setup.intensity ?? 'balanced'} pace.
            </p>

            <ProgressBar value={progressPercent} className="mt-7" />

            <ol className="mt-7 space-y-3.5">
              {PHASES.map((label, i) => {
                const done = i < activePhaseIndex
                const active = i === activePhaseIndex
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className={cx(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                        done && 'border-success bg-success text-band',
                        active && 'border-accent text-accent',
                        !done && !active && 'border-line bg-panel text-faint',
                      )}
                    >
                      {done ? (
                        <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : active ? (
                        <LuLoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                      )}
                    </span>
                    <span
                      className={cx(
                        'text-[15px] transition-colors',
                        done && 'text-muted',
                        active && 'font-medium text-ink',
                        !done && !active && 'text-faint',
                      )}
                    >
                      {label}
                    </span>
                  </li>
                )
              })}
            </ol>

            {/* Background notification and multitasking notice */}
            <div className="mt-8 rounded-xl border border-line bg-canvas/70 p-4.5 sm:p-5">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <LuBell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink">Building in the background</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                    DeepSeek AI is generating topic-specific sections tailored to your chosen formats. You will receive an in-app notification the moment your path is ready.
                  </p>
                  <p className="mt-2 text-[13px] text-muted">
                    You can stay on this page to follow progress, or feel free to explore your dashboard — your path will continue building in the background.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/app/today')}>
                      Browse Dashboard
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/app/path')}>
                      View Path Overview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

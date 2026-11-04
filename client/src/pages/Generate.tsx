import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  LuArrowRight,
  LuCheck,
  LuLoaderCircle,
  LuRefreshCw,
  LuSparkles,
  LuTriangleAlert,
} from 'react-icons/lu'
import { useApp } from '../state/store'
import {
  aiApi,
  billingApi,
  learningPathsApi,
  mapApiLearningPath,
  type ApiBillingStatus,
} from '../lib/api'
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
  const [limit, setLimit] = useState<ApiBillingStatus | null>(null)

  const creationTriggered = useRef(false)

  const runPreflightAndCreate = useCallback(async () => {
    setPreflightStatus('checking')
    setPreflightError(null)
    setLimit(null)

    try {
      const health = await aiApi.health()
      if (!health.available) {
        setPreflightStatus('unavailable')
        setPreflightError('The path-building service is temporarily unavailable. Please try again shortly.')
        return
      }

      // Free accounts hold 1 path; Pro / own-key accounts hold more.
      const billing = await billingApi.status()
      if (!billing.canCreateMore) {
        setLimit(billing)
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
    } catch {
      setPreflightStatus('unavailable')
      console.warn('[generate] Unable to start path generation.')
      setPreflightError('We could not start path generation. Please try again shortly.')
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
          setPathError('We could not finish building this path. Please try again shortly.')
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
    } catch {
      console.warn('[generate] Unable to retry path generation.')
      setPathError('We could not restart the build. Please try again shortly.')
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
    <div className="flex min-h-screen flex-col bg-band text-on-band-muted [--color-band:#faf9f7] [--color-band-soft:#f3f0f8] [--color-band-deep:#f3f2ee] [--color-panel:#fff] [--color-panel-soft:#fcfbfd] [--color-ink:#211b2a] [--color-ink-soft:#514a58] [--color-body:#514a58] [--color-muted:#77717e] [--color-faint:#a5a0aa] [--color-line:#e8e4ec] [--color-line-strong:#d7d0df] [--color-on-band:#211b2a] [--color-on-band-muted:#514a58] [--color-on-band-dim:#77717e] [--color-canvas:#faf9f7] [--color-canvas-deep:#f3f2ee] [--color-accent:#713bd1] [--color-accent-strong:#51249c] [--color-accent-soft:#f3f0f8] [--color-accent-bright:#713bd1] [--color-success:#157f5f] [--color-success-soft:#e9f4ef] [--color-success-bright:#157f5f] [--color-danger:#b42318] [--color-danger-soft:#fbeceb] [--color-danger-bright:#b42318]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" aria-label="Sawari home">
            <Logo size="sm" />
          </Link>
          <span className="rounded-full bg-band-soft px-3.5 py-2 text-[11px] font-bold text-on-band-muted">
            Building your path
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-8 sm:px-8 sm:py-12">
        <section className="w-full rounded-[24px] border border-line bg-white p-5 shadow-[0_16px_54px_rgba(33,27,42,.07)] sm:rounded-[28px] sm:p-8 lg:p-10">
          {limit ? (
            <div className="animate-rise mx-auto max-w-xl text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-bright">Path limit reached</p>
              <h1 className="mt-3 text-[28px] font-extrabold leading-[1.08] tracking-[-0.045em] text-ink sm:text-[38px]">
                You hold {limit.pathsUsed} of {limit.pathLimit} paths.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-body">
                {limit.plan === 'free' && !limit.hasOwnKey
                  ? 'Free accounts hold one learning path. See your options or connect your own AI key to create more.'
                  : 'Delete a path you no longer need, then build this one.'}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {limit.plan === 'free' && !limit.hasOwnKey ? (
                  <>
                    <Button variant="accent" size="lg" className="!rounded-full !bg-[#51249c] !text-white hover:!bg-[#6130ae]" onClick={() => navigate('/app/settings')}>
                      See options
                    </Button>
                    <Button variant="secondary" size="lg" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/app/path')}>
                      View paths
                    </Button>
                  </>
                ) : (
                  <Button variant="accent" size="lg" className="!rounded-full !bg-[#51249c] !text-white hover:!bg-[#6130ae]" onClick={() => navigate('/app/path')}>
                    Open my paths
                  </Button>
                )}
              </div>
            </div>
          ) : preflightStatus === 'unavailable' ? (
            <div className="animate-rise mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
                <LuTriangleAlert className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-[25px] font-extrabold tracking-[-0.04em] text-ink sm:text-[32px]">AI is unavailable right now</h1>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-body">
                We cannot reach the path-building service at the moment. Your answers are saved, so you can try again shortly.
              </p>
              {preflightError && (
                <p className="mx-auto mt-4 max-w-md rounded-xl border border-line bg-canvas px-4 py-3 text-left text-[12px] leading-relaxed text-muted">
                  {preflightError}
                </p>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button variant="accent" size="lg" className="!rounded-full !bg-[#51249c] !text-white hover:!bg-[#6130ae]" onClick={handleRetryPreflight}>
                  <LuRefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button variant="secondary" size="lg" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/setup')}>
                  Change answers
                </Button>
              </div>
            </div>
          ) : pathStatus === 'failed' ? (
            <div className="animate-rise mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
                <LuTriangleAlert className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-[25px] font-extrabold tracking-[-0.04em] text-ink sm:text-[32px]">Could not finish your path</h1>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-body">
                We hit a problem while building the sections for {setup.subject}. Your brief is still saved.
              </p>
              {pathError && (
                <p className="mx-auto mt-4 max-w-md rounded-xl border border-line bg-canvas px-4 py-3 text-left text-[12px] leading-relaxed text-muted">
                  {pathError}
                </p>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button variant="accent" size="lg" className="!rounded-full !bg-[#51249c] !text-white hover:!bg-[#6130ae]" onClick={handleRetryPathBuild} loading={isRetrying}>
                  <LuRefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button variant="secondary" size="lg" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/setup')}>
                  Change answers
                </Button>
              </div>
            </div>
          ) : pathStatus === 'ready' ? (
            <div className="animate-rise mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                <LuCheck className="h-5 w-5" strokeWidth={3} />
              </div>
              <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-success">Ready to go</p>
              <h1 className="mt-2 text-[27px] font-extrabold tracking-[-0.045em] text-ink sm:text-[36px]">Your {setup.subject} path is ready.</h1>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-body">
                Your lessons, examples, exercises, and resources are organized into a plan that fits your time.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button variant="accent" size="lg" className="!rounded-full !bg-[#51249c] !text-white hover:!bg-[#6130ae]" onClick={() => navigate('/app/path')}>
                  Open learning path
                  <LuArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="secondary" size="lg" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/app/today')}>
                  Go to today
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-rise">
              <div className="flex items-center gap-2 text-accent-bright">
                <LuSparkles className="h-4 w-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em]">Building your path</span>
              </div>

              <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.045em] text-ink sm:text-[34px]">Your {setup.subject} plan is taking shape.</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-body sm:text-[14px]">
                Tailored to {weekly} hours a week and a {setup.intensity ?? 'balanced'} pace.
              </p>

              <ProgressBar value={progressPercent} className="mt-7 h-2 rounded-full" />

              <ol className="mt-7 space-y-2.5">
                {PHASES.map((label, i) => {
                  const done = i < activePhaseIndex
                  const active = i === activePhaseIndex
                  return (
                    <li key={label} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors', active && 'bg-band-soft')}>
                      <span
                        className={cx(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                          done && 'border-success bg-success text-white',
                          active && 'border-accent-bright bg-white text-accent-bright',
                          !done && !active && 'border-line bg-white text-faint',
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
                          'text-[13px] transition-colors',
                          done && 'text-muted',
                          active && 'font-bold text-ink',
                          !done && !active && 'text-faint',
                        )}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-6 rounded-2xl border border-line bg-band-soft/70 p-4 sm:p-5">
                <h2 className="text-[13px] font-bold text-ink">You can keep using Sawari.</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-body">
                  We will notify you when the path is ready. You can follow progress here or go to your dashboard.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/app/today')}>
                    Go to dashboard
                  </Button>
                  <Button variant="secondary" size="sm" className="!rounded-full !border-line-strong !bg-white !text-on-band hover:!border-accent-bright/50" onClick={() => navigate('/app/path')}>
                    Path overview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

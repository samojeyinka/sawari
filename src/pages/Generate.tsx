import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LuCheck, LuLoaderCircle } from 'react-icons/lu'
import { useApp } from '../state/store'
import { findTemplateMatch, sectionsForSubject } from '../data'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { cx } from '../lib/utils'

const phases = [
  'Understanding your goal',
  'Building your path',
  'Organizing topics',
  'Selecting learning activities',
  'Preparing your first session',
]

export function GeneratePage() {
  const { state, createPath, signIn } = useApp()
  const navigate = useNavigate()
  const setup = state.setup
  const [phase, setPhase] = useState(0)
  const [ready, setReady] = useState(false)
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    if (ready) return
    const timer = window.setTimeout(() => {
      if (phase < phases.length) setPhase(phase + 1)
      else setReady(true)
    }, 750)
    return () => window.clearTimeout(timer)
  }, [phase, ready])

  if (!setup.subject.trim() && !launching) return <Navigate to="/setup" replace />

  const matchId = findTemplateMatch(setup.subject, state.paths)
  const existing = state.paths.find((p) => p.id === matchId)
  const sectionCount = existing ? existing.sections.length : sectionsForSubject(setup.subject).length
  const firstSession = existing
    ? existing.sections[0].title
    : sectionsForSubject(setup.subject)[0].title
  const weekly = setup.weeklyHours === '15+' ? '15+' : (setup.weeklyHours ?? '5')

  const viewPath = () => {
    setLaunching(true)
    signIn()
    createPath(setup.subject, setup)
    navigate('/app/path')
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
        {!ready ? (
          <div className="animate-rise">
            <h1 className="text-2xl font-semibold text-ink">Working on {setup.subject}…</h1>
            <p className="mt-1.5 text-[15px] text-muted">
              Shaping it around {weekly} hours a week and a {setup.intensity ?? 'balanced'} pace.
            </p>

            <ProgressBar
              value={(phase / phases.length) * 100}
              className="mt-7"
            />

            <ol className="mt-7 space-y-3.5">
              {phases.map((label, i) => {
                const done = i < phase
                const active = i === phase
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
          </div>
        ) : (
          <div className="animate-rise text-center">
            <h1 className="mt-5 text-3xl font-semibold text-ink">Your path is ready.</h1>
            <p className="mx-auto mt-2 max-w-md text-[15.5px] leading-relaxed text-muted">
              {sectionCount} sections, built around {weekly} hours a week. Your first session is{' '}
              {firstSession}.
            </p>

            <div className="mx-auto mt-8 max-w-md divide-y divide-line rounded-xl border border-line text-left">
              <SummaryRow label="Subject" value={setup.subject} />
              <SummaryRow
                label="Goal"
                value={setup.outcome.trim() || 'Build real confidence, step by step'}
              />
              <SummaryRow label="Pace" value={`${setup.intensity ?? 'balanced'} · ${weekly}h a week`} />
              <SummaryRow
                label="First session"
                value={`${firstSession} · ${setup.targetDate || 'no deadline'}`}
              />
            </div>

            <div className="mt-8">
              <Button size="lg" onClick={viewPath}>
                View my path
              </Button>
            </div>
            <Link
              to="/setup"
              className="mt-4 inline-block text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Change my answers
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LuCheck,
  LuChevronDown,
  LuEllipsis,
  LuLock,
} from 'react-icons/lu'
import type { Resource } from '../types'
import { useApp } from '../state/store'
import {
  formatHours,
  getSessionActivities,
  pathMinutesLeft,
  pathPercent,
} from '../data'
import { kindLabels } from '../components/learn/kinds'
import { Page } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatusBadge } from '../components/ui/Choice'
import { ResourcePreviewModal } from '../components/modals/ResourcePreviewModal'
import { EditPreferencesModal } from '../components/modals/EditPreferencesModal'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { cx } from '../lib/utils'

export function PathPage() {
  const { activePath, sessionContentFor, deletePath, toast } = useApp()
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [preview, setPreview] = useState<Resource | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  if (!activePath) {
    return (
      <Page width="narrow">
        <div className="rounded-xl border border-line bg-canvas px-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-ink">No learning paths</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            You have removed every path. Build a new one and we will pick up with a fresh plan.
          </p>
          <Link to="/setup" className="mt-6 inline-block">
            <Button>Build my learning path</Button>
          </Link>
        </div>
      </Page>
    )
  }

  const percent = pathPercent(activePath)
  const minutesLeft = pathMinutesLeft(activePath)
  const hoursLeft = Math.round(minutesLeft / 60)
  const completedSections = activePath.sections.filter((s) => s.status === 'completed').length
  const isOpen = (id: string) => openId === id

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id))

  const handleDelete = () => {
    deletePath(activePath.id)
    toast('Learning path deleted')
    setDeleteOpen(false)
    navigate('/app/today')
  }

  return (
    <Page width="wide">
      {/* header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
              Learning path
            </div>
            <h1 className="text-2xl font-semibold text-ink sm:text-[32px]">{activePath.subject}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                navigate(`/app/session/${activePath.currentSectionId}`)
              }
              className="hidden sm:inline-flex"
            >
              Continue learning
            </Button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Path options"
                className="rounded-lg border border-line p-2.5 text-body transition-colors hover:bg-canvas"
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-52 animate-rise rounded-lg border border-line bg-panel p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setEditOpen(true)
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-sm text-body transition-colors hover:bg-canvas hover:text-ink"
                  >
                    Edit preferences
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setDeleteOpen(true)
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger-soft"
                  >
                    Delete path
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-canvas/70 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Your goal</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{activePath.goal}</p>
        </div>
      </header>

      {/* stats */}
      <div className="mb-8 grid grid-cols-1 gap-y-5 border-y border-line py-5 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">
        <Stat label="Progress" value={`${percent}%`}>
          <ProgressBar value={percent} size="sm" className="mt-2" />
        </Stat>
        <Stat label="Estimated remaining time" value={`${hoursLeft} hours`} />
        <Stat
          label="Sections"
          value={`${completedSections} of ${activePath.sections.length} complete`}
        />
        <Stat label="Time each week" value={`${activePath.weeklyHours} hours`} />
      </div>

      {/* sections */}
      <div className="space-y-3">
        {activePath.sections.map((section, index) => {
          const content = sessionContentFor(section.id)
          const activities = content
            ? getSessionActivities(activePath.id, section.id, content)
            : []
          const doneCount = activities.filter((a) =>
            activePath.completedActivities.includes(a.id),
          ).length
          const allDone = activities.length > 0 && doneCount === activities.length
          const locked = section.status === 'locked'
          const upcoming = section.status === 'upcoming'
          const prevSection = activePath.sections[index - 1]

          return (
            <article
              key={section.id}
              className={cx(
                'overflow-hidden rounded-xl border bg-panel transition-all duration-200',
                section.status === 'current'
                  ? 'border-accent/40 shadow-[0_2px_12px_rgba(15,118,110,0.08)]'
                  : 'border-line',
                locked && 'bg-canvas/50',
              )}
            >
              <button
                onClick={() => toggle(section.id)}
                aria-expanded={isOpen(section.id)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
              >
                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                    section.status === 'completed' && 'border-success/30 bg-success-soft text-success',
                    section.status === 'current' && 'border-accent bg-accent text-band',
                    section.status === 'upcoming' && 'border-line bg-canvas text-muted',
                    locked && 'border-line bg-canvas-deep text-faint',
                  )}
                >
                  {section.status === 'completed' ? (
                    <LuCheck className="h-4 w-4" strokeWidth={3} />
                  ) : locked ? (
                    <LuLock className="h-4 w-4" />
                  ) : (
                    String(section.order).padStart(2, '0')
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={cx(
                        'text-[15px] font-semibold',
                        locked ? 'text-faint' : 'text-ink',
                      )}
                    >
                      {section.title}
                    </span>
                    <StatusBadge status={section.status} />
                  </span>
                  <span
                    className={cx(
                      'mt-0.5 line-clamp-1 block text-[13px]',
                      locked ? 'text-faint' : 'text-muted',
                    )}
                  >
                    {section.description}
                  </span>
                </span>

                <span className="hidden shrink-0 text-sm text-muted sm:block">
                  {formatHours(section.minutes)}
                </span>
                <LuChevronDown
                  className={cx(
                    'h-4 w-4 shrink-0 text-muted transition-transform duration-300',
                    isOpen(section.id) && 'rotate-180',
                  )}
                />
              </button>

              <div className={cx('reveal', isOpen(section.id) && 'open')}>
                <div>
                  <div className="border-t border-line bg-canvas/40 px-4 py-5 sm:px-5">
                    <p className="max-w-3xl text-sm leading-relaxed text-body">
                      {section.description}
                    </p>

                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Detail label="Estimated time" value={formatHours(section.minutes)} />
                      <Detail
                        label="Status"
                        value={
                          section.status === 'completed'
                            ? 'Complete'
                            : section.status === 'current'
                              ? `${Math.round((section.doneMinutes / section.minutes) * 100)}% done`
                              : section.status === 'upcoming'
                                ? 'Not started'
                                : 'Locked'
                        }
                      />
                    </dl>

                    {content ? (
                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                            Activities
                          </h4>
                          <ul className="space-y-2">
                            {activities.map((a) => {
                              const done = activePath.completedActivities.includes(a.id)
                              return (
                                <li
                                  key={a.id}
                                  className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2.5"
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="text-[13px] font-medium uppercase tracking-wide text-faint">
                                      {kindLabels[a.kind]}
                                    </span>
                                    <span className="ml-2 text-sm text-ink">{a.title}</span>
                                  </span>
                                  <span className="shrink-0 text-xs text-muted">
                                    {a.minutes} min
                                  </span>
                                  {done && <LuCheck className="h-3.5 w-3.5 text-success" />}
                                </li>
                              )
                            })}
                          </ul>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                              Resources
                            </h4>
                            <button
                              onClick={() => setPreview(content.resource)}
                              className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-canvas"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ink">
                                  {content.resource.title}
                                </span>
                                <span className="block text-xs text-muted">
                                  {content.resource.kind} · {content.resource.minutes} min
                                </span>
                              </span>
                            </button>
                          </div>

                          <div>
                            <h4 className="mb-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                              Practice
                            </h4>
                            <div className="rounded-lg border border-line bg-panel px-3 py-2.5">
                              <p className="text-sm font-medium text-ink">{content.practice.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">
                                {content.practice.brief}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2.5 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                              Assessment
                            </h4>
                            <div className="rounded-lg border border-line bg-panel px-3 py-2.5">
                              <p className="text-sm font-medium text-ink">
                                {content.assessment.questions.length} questions
                              </p>
                              <p className="mt-0.5 text-[13px] text-muted">
                                {content.assessment.intro}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-lg border border-dashed border-line-strong bg-panel/60 px-4 py-5">
                        <p className="text-sm text-muted">
                          {section.note ??
                            'Activities, resources and the assessment open when this section starts.'}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {section.status === 'current' && (
                        <Button onClick={() => navigate(`/app/session/${section.id}`)}>
                          {doneCount > 0 && !allDone ? 'Continue session' : 'Start session'}
                        </Button>
                      )}
                      {section.status === 'completed' && (
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/app/session/${section.id}`)}
                        >
                          Review session
                        </Button>
                      )}
                      {upcoming && (
                        <Button variant="secondary" disabled>
                          Starts after {prevSection ? prevSection.title : 'the current section'}
                        </Button>
                      )}
                      {locked && (
                        <Button variant="secondary" disabled>
                          <LuLock className="h-4 w-4" />
                          {section.note ?? 'Locked'}
                        </Button>
                      )}
                      {allDone && section.status === 'completed' && (
                        <span className="flex items-center gap-1.5 text-[13px] text-success">
                          <LuCheck className="h-4 w-4" /> Session complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {activePath.subject === 'Project Management' && (
        <p className="mt-6 text-[13px] text-muted">
          Your path adapts as you go. Finishing a check updates what comes next.
        </p>
      )}

      <div className="mt-6 sm:hidden">
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate(`/app/session/${activePath.currentSectionId}`)}
        >
          Continue learning
        </Button>
      </div>

      <ResourcePreviewModal
        open={Boolean(preview)}
        resource={preview}
        onClose={() => setPreview(null)}
      />
      <EditPreferencesModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${activePath.subject}?`}
        body="This permanently removes the path and its progress. Your other paths are untouched."
        confirmLabel="Delete path"
        danger
      />
    </Page>
  )
}

function Stat({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children?: ReactNode
}) {
  return (
    <div>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-ink">{value}</p>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

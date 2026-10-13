import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Resource } from '../types'
import { useApp } from '../state/store'
import {
  contentResources,
  formatHours,
  getSessionActivities,
  pathMinutesLeft,
  pathPercent,
} from '../data'
import { kindLabels } from '../components/learn/kinds'
import { Page } from '../components/layout/PageHeader'
import { monoLabel } from '../components/layout/nav'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatusBadge } from '../components/ui/Choice'
import { ResourcePreviewModal } from '../components/modals/ResourcePreviewModal'
import { PathBuilding, PathBuildFailed } from '../components/path/PathBuildStatus'
import { EditPreferencesModal } from '../components/modals/EditPreferencesModal'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { cx } from '../lib/utils'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors'
const primaryBtnSm =
  'group relative inline-flex h-11 items-center justify-center overflow-hidden bg-on-band px-5 ' +
  'text-[13.5px] font-medium text-band transition-colors'
const ghostBtnSm =
  'inline-flex h-11 items-center justify-center border border-on-band/20 px-4 text-[13.5px] ' +
  'text-on-band transition-colors hover:border-on-band/45'

/** The number cell that stands in for a status icon. */
const markerStyles = {
  completed: 'border-success-bright/40 bg-success-bright/10 text-success-bright',
  current: 'border-accent-bright bg-accent-bright text-band',
  upcoming: 'border-on-band/20 text-on-band-dim',
  locked: 'border-on-band/12 text-on-band-dim/70',
}

export function PathPage() {
  const { activePath, sessionContentFor, deletePath, retryPathBuild, toast } = useApp()
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [preview, setPreview] = useState<Resource | null>(null)
  const [retrying, setRetrying] = useState(false)
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
        <div className="border border-on-band/15 bg-panel px-8 py-16 text-center">
          <p className={monoLabel}>no paths</p>
          <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
            You have no paths left.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
            You have removed every path. Build a new one and we will pick up with a fresh plan.
          </p>
          <Link to="/setup" className={cx(primaryBtn, 'mt-7')}>
            Build my learning path
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

  const building =
    activePath.generationStatus === 'queued' ||
    activePath.generationStatus === 'generating' ||
    activePath.generationStatus === 'idle'
  if (building) {
    return <PathBuilding subject={activePath.subject} status={activePath.generationStatus} />
  }

  if (activePath.generationStatus === 'failed') {
    return (
      <PathBuildFailed
        subject={activePath.subject}
        error={activePath.generationError}
        retrying={retrying}
        onRetry={() => {
          setRetrying(true)
          retryPathBuild(activePath.id)
            .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Retry failed.'))
            .finally(() => setRetrying(false))
        }}
      />
    )
  }

  return (
    <Page width="wide">
      {/* header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={monoLabel}>learning path</p>
            <h1 className="mt-3 font-display text-[30px] font-light leading-[1.12] tracking-[-0.025em] text-on-band sm:text-[38px]">
              {activePath.subject}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/app/session/${activePath.currentSectionId}`)}
              className={cx(primaryBtnSm, 'hidden sm:inline-flex')}
            >
              <span className="relative">Continue learning</span>
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                className={cx(ghostBtnSm, 'font-mono text-[10.5px] uppercase tracking-[0.08em]')}
              >
                Options
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-52 animate-rise border border-on-band/20 bg-panel">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setEditOpen(true)
                    }}
                    className="w-full border-b border-on-band/10 px-4 py-3 text-left text-[13.5px] text-on-band-muted transition-colors hover:bg-on-band/[0.04] hover:text-on-band"
                  >
                    Edit preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setDeleteOpen(true)
                    }}
                    className="w-full px-4 py-3 text-left text-[13.5px] text-danger-bright transition-colors hover:bg-danger-bright/10"
                  >
                    Delete path
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7 border border-on-band/15 bg-panel px-5 py-4">
          <p className={monoLabel}>your goal</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-on-band-muted">{activePath.goal}</p>
        </div>
      </header>

      {/* stats */}
      <div className="mb-8 grid border border-on-band/15 bg-panel lg:grid-cols-4">
        <Stat label="progress" value={`${percent}%`}>
          <ProgressBar value={percent} size="sm" className="mt-3" />
        </Stat>
        <Stat label="estimated remaining" value={`${hoursLeft} hours`} />
        <Stat
          label="sections"
          value={`${completedSections} of ${activePath.sections.length}`}
        />
        <Stat label="time each week" value={`${activePath.weeklyHours} hours`} />
      </div>

      {/* sections */}
      <div className="border-t border-on-band/15">
        {activePath.sections.map((section, index) => {
          const content = sessionContentFor(section.id)
          const activities = content ? getSessionActivities(activePath.id, section.id, content) : []
          const doneCount = activities.filter((a) =>
            activePath.completedActivities.includes(a.id),
          ).length
          const allDone = activities.length > 0 && doneCount === activities.length
          const locked = section.status === 'locked'
          const upcoming = section.status === 'upcoming'
          const prevSection = activePath.sections[index - 1]
          const open = isOpen(section.id)

          return (
            <article
              key={section.id}
              className={cx(
                'border-b border-on-band/15 transition-colors',
                section.status === 'current' ? 'border-l-2 border-l-accent-bright' : 'border-l-2 border-l-transparent',
                locked ? 'bg-band-deep/60' : 'bg-panel',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-on-band/[0.03] sm:gap-5 sm:px-5"
              >
                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-[11px]',
                    markerStyles[section.status],
                  )}
                >
                  {String(section.order).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-3">
                    <span
                      className={cx(
                        'text-[15px]',
                        locked ? 'text-on-band-dim' : 'text-on-band',
                      )}
                    >
                      {section.title}
                    </span>
                    <StatusBadge status={section.status} />
                  </span>
                  <span
                    className={cx(
                      'mt-1.5 line-clamp-1 block text-[13.5px] leading-relaxed',
                      locked ? 'text-on-band-dim' : 'text-on-band-muted',
                    )}
                  >
                    {section.description}
                  </span>
                </span>

                <span className={cx(monoLabel, 'hidden shrink-0 sm:block')}>
                  {formatHours(section.minutes)}
                </span>
                <span className={cx(monoLabel, 'w-12 shrink-0 text-right')}>
                  {open ? 'Close' : 'Open'}
                </span>
              </button>

              <div className={cx('reveal', open && 'open')}>
                <div>
                  <div className="border-t border-on-band/10 bg-band-deep/40 px-4 py-6 sm:px-5">
                    <p className="max-w-3xl text-[14px] leading-relaxed text-on-band-muted">
                      {section.description}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-6 sm:max-w-md">
                      <Detail label="estimated time" value={formatHours(section.minutes)} />
                      <Detail
                        label="status"
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
                      <div className="mt-7 grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className={cx(monoLabel, 'mb-3')}>activities</h4>
                          <ul className="space-y-2">
                            {activities.map((a) => {
                              const done = activePath.completedActivities.includes(a.id)
                              return (
                                <li
                                  key={a.id}
                                  className="flex items-center gap-4 border border-on-band/12 px-3.5 py-3"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cx(
                                      'h-2.5 w-2.5 shrink-0 border',
                                      done
                                        ? 'border-success-bright bg-success-bright'
                                        : 'border-on-band/30',
                                    )}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className={cx(monoLabel, 'block')}>
                                      {kindLabels[a.kind]}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[13.5px] text-on-band">
                                      {a.title}
                                    </span>
                                  </span>
                                  <span className={cx(monoLabel, 'shrink-0')}>{a.minutes} min</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className={cx(monoLabel, 'mb-3')}>resources</h4>
                            <div className="space-y-2">
                              {contentResources(content).map((resource) => (
                                <button
                                  key={resource.id}
                                  type="button"
                                  onClick={() => setPreview(resource)}
                                  className="block w-full border border-on-band/12 px-3.5 py-3 text-left transition-colors hover:border-on-band/35"
                                >
                                  <span className="block truncate text-[13.5px] text-on-band">
                                    {resource.title}
                                  </span>
                                  <span className={cx(monoLabel, 'mt-1 block')}>
                                    {resource.kind} · {resource.minutes} min
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className={cx(monoLabel, 'mb-3')}>practice</h4>
                            <div className="border border-on-band/12 px-3.5 py-3">
                              <p className="text-[13.5px] text-on-band">{content.practice.title}</p>
                              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-on-band-dim">
                                {content.practice.brief}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className={cx(monoLabel, 'mb-3')}>assessment</h4>
                            <div className="border border-on-band/12 px-3.5 py-3">
                              <p className="text-[13.5px] text-on-band">
                                {content.assessment.questions.length} questions
                              </p>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-on-band-dim">
                                {content.assessment.intro}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 border border-dashed border-on-band/20 px-4 py-5">
                        <p className="text-[13.5px] leading-relaxed text-on-band-dim">
                          {locked
                            ? 'Open the session preview to see the full lesson, resources and practice. Activities unlock once the previous sections are complete.'
                            : (section.note ??
                              'Activities, resources and the assessment open when this section starts.')}
                        </p>
                      </div>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-4">
                      {section.status === 'current' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/session/${section.id}`)}
                          className={primaryBtnSm}
                        >
                          {doneCount > 0 && !allDone ? 'Continue session' : 'Start session'}
                        </button>
                      )}
                      {section.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/session/${section.id}`)}
                          className={ghostBtnSm}
                        >
                          Review session
                        </button>
                      )}
                      {upcoming && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/app/session/${section.id}`)}
                            className={ghostBtnSm}
                          >
                            Preview session
                          </button>
                          <span className="text-[13px] text-on-band-dim">
                            Starts after {prevSection ? prevSection.title : 'the current section'}
                          </span>
                        </>
                      )}
                      {locked && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate(`/app/session/${section.id}`)}
                            className={ghostBtnSm}
                          >
                            Preview session
                          </button>
                          <span className="text-[13px] text-on-band-dim">
                            {section.note ?? 'Complete the previous sections to unlock'}
                          </span>
                        </>
                      )}
                      {allDone && section.status === 'completed' && (
                        <span className={cx(monoLabel, 'text-success-bright')}>
                          session complete
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

      <p className="mt-6 text-[13px] leading-relaxed text-on-band-dim">
        Your path adapts as you go. Finishing a check updates what comes next.
      </p>

      <div className="mt-6 sm:hidden">
        <button
          type="button"
          onClick={() => navigate(`/app/session/${activePath.currentSectionId}`)}
          className={cx(primaryBtn, 'w-full')}
        >
          Continue learning
        </button>
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
    <div
      className={cx(
        'border-b border-on-band/10 px-5 py-5',
        'last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0',
      )}
    >
      <p className={monoLabel}>{label}</p>
      <p className="mt-2 font-display text-[24px] font-light text-on-band">{value}</p>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={monoLabel}>{label}</dt>
      <dd className="mt-1.5 text-[13.5px] text-on-band">{value}</dd>
    </div>
  )
}

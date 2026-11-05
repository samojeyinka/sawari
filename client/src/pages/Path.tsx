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
  'group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#51249c] px-6 ' +
  'text-[13px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] transition-[transform,box-shadow] ' +
  'hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.25)]'
const primaryBtnSm =
  'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-[#51249c] px-5 ' +
  'text-[12px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,.18)] transition-[transform,box-shadow] ' +
  'hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.24)]'
const ghostBtnSm =
  'inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-white px-4 text-[12px] ' +
  'font-bold text-on-band-muted transition-colors hover:border-accent-bright/50 hover:text-accent-bright'

/** The number cell that stands in for a status icon. */
const markerStyles = {
  completed: 'border-success/15 bg-success-soft text-success',
  current: 'border-accent-bright bg-accent-bright text-white',
  upcoming: 'border-line-strong bg-white text-on-band-dim',
  locked: 'border-line bg-canvas-deep text-on-band-dim',
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
        <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
          <p className={cx(monoLabel, 'text-accent-bright')}>no paths</p>
          <h1 className="mt-3 font-display text-[25px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
            You have no paths left.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
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
        retrying={retrying}
        onRetry={() => {
          setRetrying(true)
          retryPathBuild(activePath.id)
            .catch(() => toast('We could not restart the build. Please try again shortly.'))
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
          <div className="flex min-w-0 items-center gap-4">
            {activePath.thumbnailUrl && (
              <img
                src={activePath.thumbnailUrl}
                alt=""
                className="h-20 w-28 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-36"
              />
            )}
            <div className="min-w-0">
              <p className={cx(monoLabel, 'text-accent-bright uppercase tracking-[0.1em]')}>{activePath.category || 'learning path'}</p>
              <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.06] tracking-[-0.045em] text-on-band sm:text-[38px]">
                {activePath.subject}
              </h1>
            </div>
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
                className={cx(ghostBtnSm, 'uppercase tracking-[0.08em]')}
              >
                Options
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-52 animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_rgba(33,27,42,.14)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setEditOpen(true)
                    }}
                    className="w-full border-b border-line px-4 py-3 text-left text-[12px] font-bold text-on-band-muted transition-colors hover:bg-band-soft hover:text-on-band"
                  >
                    Edit preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setDeleteOpen(true)
                    }}
                    className="w-full px-4 py-3 text-left text-[12px] font-bold text-danger-bright transition-colors hover:bg-danger-soft"
                  >
                    Delete path
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_8px_28px_rgba(33,27,42,.04)]">
          <p className={monoLabel}>your goal</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-band-muted">{activePath.goal}</p>
        </div>
      </header>

      {/* stats */}
      <div className="mb-8 grid overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_28px_rgba(33,27,42,.04)] lg:grid-cols-4">
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
      <div className="space-y-3">
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
                'overflow-hidden rounded-2xl border bg-white transition-colors',
                section.status === 'current'
                  ? 'border-accent-bright/40 shadow-[0_10px_30px_rgba(113,59,209,.08)]'
                  : 'border-line shadow-[0_8px_28px_rgba(33,27,42,.04)]',
                locked && 'bg-canvas-deep/40',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-band-soft/50 sm:gap-5 sm:px-5"
              >
                <span
                  className={cx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold',
                    markerStyles[section.status],
                  )}
                >
                  {String(section.order).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-3">
                    <span
                      className={cx(
                        'text-[13px] font-bold sm:text-[14px]',
                        locked ? 'text-on-band-dim' : 'text-on-band',
                      )}
                    >
                      {section.title}
                    </span>
                    <StatusBadge status={section.status} />
                  </span>
                  <span
                    className={cx(
                      'mt-1 line-clamp-1 block text-[11px] leading-relaxed',
                      locked ? 'text-on-band-dim' : 'text-on-band-muted',
                    )}
                  >
                    {section.description}
                  </span>
                </span>

                <span className={cx(monoLabel, 'hidden shrink-0 sm:block')}>
                  {formatHours(section.minutes)}
                </span>
                <span className={cx(monoLabel, 'w-12 shrink-0 text-right font-bold text-accent-bright')}>
                  {open ? 'Close' : 'Open'}
                </span>
              </button>

              <div className={cx('reveal', open && 'open')}>
                <div>
                  <div className="border-t border-line bg-band-soft/40 px-4 py-6 sm:px-5">
                    <p className="max-w-3xl text-[13px] leading-relaxed text-on-band-muted">
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
                                  className="flex items-center gap-4 rounded-xl border border-line bg-white px-3.5 py-3"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cx(
                                      'h-2.5 w-2.5 shrink-0 rounded-full border',
                                      done
                                        ? 'border-success bg-success'
                                        : 'border-line-strong',
                                    )}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className={cx(monoLabel, 'block')}>
                                      {kindLabels[a.kind]}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[12.5px] font-bold text-on-band">
                                      {a.title}
                                    </span>
                                  </span>
                                  <span className={cx(monoLabel, 'shrink-0')}>{formatHours(a.minutes)}</span>
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
                                  className="block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-left transition-colors hover:border-accent-bright/40 hover:bg-band-soft/40"
                                >
                                  <span className="block truncate text-[12.5px] font-bold text-on-band">
                                    {resource.title}
                                  </span>
                                  <span className={cx(monoLabel, 'mt-1 block')}>
                                    {resource.kind} · {formatHours(resource.minutes)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className={cx(monoLabel, 'mb-3')}>practice</h4>
                            <div className="rounded-xl border border-line bg-white px-3.5 py-3">
                              <p className="text-[12.5px] font-bold text-on-band">{content.practice.title}</p>
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-on-band-dim">
                                {content.practice.brief}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className={cx(monoLabel, 'mb-3')}>assessment</h4>
                            <div className="rounded-xl border border-line bg-white px-3.5 py-3">
                              <p className="text-[12.5px] font-bold text-on-band">
                                {content.assessment.questions.length} questions
                              </p>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-on-band-dim">
                                {content.assessment.intro}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-white/60 px-4 py-5">
                        <p className="text-[12px] leading-relaxed text-on-band-dim">
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

      <p className="mt-6 text-[12px] leading-relaxed text-on-band-dim">
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
        'border-b border-line px-5 py-5',
        'last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0',
      )}
    >
      <p className={monoLabel}>{label}</p>
      <p className="mt-2 font-display text-[22px] font-extrabold tracking-[-0.03em] text-on-band">{value}</p>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={monoLabel}>{label}</dt>
      <dd className="mt-1.5 text-[12.5px] font-bold text-on-band">{value}</dd>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { RouteFallback } from '../components/ui/RouteFallback'
import { monoLabel } from '../components/layout/nav'
import { catalogApi, type ApiCatalogPath } from '../lib/api'
import { LevelTag, RatingSummary } from '../components/catalog/shared'
import { useAlert } from '../state/alertContext'
import { cx } from '../lib/utils'

function SavedCard({ path, onRemove }: { path: ApiCatalogPath; onRemove: () => void }) {
  const [busy, setBusy] = useState(false)
  const alert = useAlert()

  const remove = async () => {
    setBusy(true)
    try {
      await catalogApi.unsave(path.slug)
      onRemove()
    } catch (error) {
      alert.fromError(error, 'Could not remove this course.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_8px_28px_rgba(33,27,42,.04)] transition-shadow hover:shadow-[0_14px_40px_rgba(33,27,42,.08)]">
      {path.thumbnailUrl && (
        <img src={path.thumbnailUrl} alt="" className="-mx-5 -mt-5 mb-4 h-40 object-cover" />
      )}
      <div className="flex items-center justify-between gap-3">
        <span className={monoLabel}>
          {path.category || 'Course'} · {path.sections.length} {path.sections.length === 1 ? 'section' : 'sections'}
        </span>
        <LevelTag level={path.level} />
      </div>
      <a href={`/courses/${encodeURIComponent(path.slug)}`} className="mt-3 group">
        <h3 className="font-display text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-on-band group-hover:text-accent-bright">
          {path.subject}
        </h3>
        {path.summary && (
          <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-on-band-muted">
            {path.summary}
          </p>
        )}
      </a>
      {path.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {path.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-semibold text-on-band-dim"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <RatingSummary avg={path.reviewsAvg} count={path.reviewsCount} />
        <Button size="sm" variant="secondary" loading={busy} onClick={remove}>
          Remove
        </Button>
      </div>
    </div>
  )
}

export function SavedCoursesPage() {
  const alert = useAlert()
  const [paths, setPaths] = useState<ApiCatalogPath[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    catalogApi
      .saved()
      .then((data) => setPaths(data))
      .catch((error) => {
        alert.fromError(error, 'Could not load your saved courses.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Saved"
        title="Saved courses"
        subtitle="Courses you bookmarked. Enroll or remove them anytime."
      />
      {loading && paths.length === 0 ? (
        <RouteFallback />
      ) : paths.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
          <p className={cx(monoLabel, 'text-accent-bright')}>nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-on-band-dim">
            Nothing saved yet. Browse courses and save the ones you want to come back to.
          </p>
          <a
            href="/courses"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-line-strong bg-white px-4 text-[12px] font-bold text-on-band-muted transition-colors duration-150 hover:border-accent-bright/50 hover:text-accent-bright"
          >
            Browse courses
          </a>
        </div>
      ) : (
        <div className={cx('grid gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
          {paths.map((path) => (
            <SavedCard key={path.id} path={path} onRemove={() => setPaths((prev) => prev.filter((p) => p.id !== path.id))} />
          ))}
        </div>
      )}
    </Page>
  )
}

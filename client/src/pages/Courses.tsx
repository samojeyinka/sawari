import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { RouteFallback } from '../components/ui/RouteFallback'
import { monoLabel } from '../components/layout/nav'
import { catalogApi, type ApiCatalogPath, type CatalogListParams } from '../lib/api'
import { levelOptions, catalogSortOptions, LevelTag, RatingSummary } from '../components/catalog/shared'
import { useAlert } from '../state/alertContext'
import { cx } from '../lib/utils'

const PAGE_LIMIT = 12

function CatalogCard({ path }: { path: ApiCatalogPath }) {
  const sections = path.sections.length
  return (
    <Link
      to={`/app/courses/${path.slug}`}
      className="group flex min-w-0 flex-col border border-on-band/15 bg-panel p-5 transition-colors duration-200 hover:border-on-band/35"
    >
      <div className="flex items-center justify-between gap-3">
        <span className={monoLabel}>
          {sections} {sections === 1 ? 'section' : 'sections'}
        </span>
        <LevelTag level={path.level} />
      </div>

      <h3 className="mt-3 text-[17px] font-medium leading-snug text-on-band group-hover:text-accent-bright">
        {path.subject}
      </h3>
      {path.summary && (
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-on-band-muted">
          {path.summary}
        </p>
      )}

      {path.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {path.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="border border-on-band/12 px-2 py-0.5 text-[11.5px] text-on-band-dim"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-on-band/10 pt-4">
        <RatingSummary avg={path.reviewsAvg} count={path.reviewsCount} />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
          {path.enrollments} enrolled
        </span>
      </div>
    </Link>
  )
}

export function CoursesPage() {
  const alert = useAlert()
  const [paths, setPaths] = useState<ApiCatalogPath[]>([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')
  const [sort, setSort] = useState('-createdAt')

  // Debounce the search box so we do not fire a request on every keystroke.
  const debounce = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(debounce.current)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params: CatalogListParams = { sort, page, limit: PAGE_LIMIT }
    if (query) params.q = query
    if (level) params.level = level as CatalogListParams['level']

    catalogApi
      .list(params, controller.signal)
      .then(({ items, meta: pageMeta }) => {
        setPaths(items)
        setMeta({ page: pageMeta.page, pages: pageMeta.pages, total: pageMeta.total })
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        alert.fromError(error, 'Could not load the courses.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [query, level, sort, page, alert])

  const hasFilters = Boolean(query || level)

  const emptyCopy = useMemo(
    () =>
      hasFilters
        ? 'Nothing matches that search yet. Try a different word or clear the filters.'
        : 'No published courses yet. Check back soon.',
    [hasFilters],
  )

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Courses"
        title="Published courses"
        subtitle="Curated courses you can start today. Enroll and it lands in your own path, ready to edit and track."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects and tags"
            className="w-full border border-on-band/20 bg-panel px-3.5 py-2.5 text-[14px] text-on-band placeholder:text-on-band-dim focus:border-on-band/45 focus:outline-none"
          />
        </div>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value)
            setPage(1)
          }}
          className="border border-on-band/20 bg-panel px-3 py-2.5 text-[14px] text-on-band focus:border-on-band/45 focus:outline-none"
        >
          <option value="">All levels</option>
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
          className="border border-on-band/20 bg-panel px-3 py-2.5 text-[14px] text-on-band focus:border-on-band/45 focus:outline-none"
        >
          {catalogSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading && paths.length === 0 ? (
        <RouteFallback />
      ) : paths.length === 0 ? (
        <div className="border border-dashed border-on-band/20 bg-panel px-6 py-14 text-center">
          <p className={monoLabel}>{hasFilters ? 'no matches' : 'catalog is empty'}</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-on-band-dim">
            {emptyCopy}
          </p>
        </div>
      ) : (
        <>
          <div className={cx('grid gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
            {paths.map((path) => (
              <CatalogCard key={path.id} path={path} />
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
                Page {meta.page} of {meta.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={meta.page >= meta.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Page>
  )
}

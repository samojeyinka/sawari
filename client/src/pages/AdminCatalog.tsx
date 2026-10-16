import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { RouteFallback } from '../components/ui/RouteFallback'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { monoLabel } from '../components/layout/nav'
import { adminCatalogApi, type AdminCatalogListParams, type ApiCatalogPath } from '../lib/api'
import { LevelTag, Stars } from '../components/catalog/shared'
import { useAlert } from '../state/alertContext'
import { cx } from '../lib/utils'

const PAGE_LIMIT = 20

type Tab = 'all' | 'published' | 'draft'

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={cx(
        'border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em]',
        published
          ? 'border-success-bright/40 bg-success-bright/10 text-success-bright'
          : 'border-on-band/20 text-on-band-dim',
      )}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export function AdminCatalogPage() {
  const alert = useAlert()
  const [items, setItems] = useState<ApiCatalogPath[]>([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<ApiCatalogPath | null>(null)

  const debounce = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(debounce.current)
  }, [search])

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      const params: AdminCatalogListParams = { sort: '-updatedAt', page, limit: PAGE_LIMIT }
      if (query) params.q = query
      if (tab === 'published') params.published = true
      if (tab === 'draft') params.published = false
      try {
        const { items: rows, meta: pageMeta } = await adminCatalogApi.list(params, signal)
        setItems(rows)
        setMeta({ page: pageMeta.page, pages: pageMeta.pages, total: pageMeta.total })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        alert.fromError(error, 'Could not load the catalog.')
      } finally {
        setLoading(false)
      }
    },
    [query, tab, page, alert],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const togglePublished = async (path: ApiCatalogPath) => {
    setBusyId(path.id)
    try {
      const updated = await adminCatalogApi.setPublished(
        path.id,
        path.published ? 'unpublish' : 'publish',
      )
      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, published: updated.published } : item,
        ),
      )
      alert.success(updated.published ? 'Path published.' : 'Path moved back to draft.')
    } catch (error) {
      alert.fromError(error, 'Could not change the publish state.')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!confirming) return
    setBusyId(confirming.id)
    try {
      await adminCatalogApi.remove(confirming.id)
      alert.success('Path deleted.')
      setConfirming(null)
      await load()
    } catch (error) {
      alert.fromError(error, 'Could not delete this path.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Admin"
        title="Catalog paths"
        subtitle="Author and publish the public learning paths learners can enroll in."
        actions={
          <Link to="/app/admin/new">
            <Button>New path</Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          items={[
            { id: 'all', label: 'All' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
          ]}
          active={tab}
          onChange={(id) => {
            setTab(id as Tab)
            setPage(1)
          }}
          className="sm:border-b-0"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject"
          className="w-full border border-on-band/20 bg-panel px-3.5 py-2.5 text-[14px] text-on-band placeholder:text-on-band-dim focus:border-on-band/45 focus:outline-none sm:w-72"
        />
      </div>

      {loading && items.length === 0 ? (
        <RouteFallback />
      ) : items.length === 0 ? (
        <div className="border border-dashed border-on-band/20 bg-panel px-6 py-16 text-center">
          <p className={monoLabel}>nothing here</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-on-band-dim">
            No catalog paths match. Create one to start building your public catalog.
          </p>
        </div>
      ) : (
        <>
          <div className={cx('divide-y divide-on-band/10 border border-on-band/15', loading && 'opacity-60')}>
            {items.map((path) => (
              <div key={path.id} className="flex flex-col gap-4 bg-panel px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/app/admin/${path.id}`}
                      className="text-[15px] font-medium text-on-band hover:text-accent-bright"
                    >
                      {path.subject}
                    </Link>
                    <StatusPill published={Boolean(path.published)} />
                    <LevelTag level={path.level} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={monoLabel}>/{path.slug}</span>
                    <span className={monoLabel}>
                      {path.sections.length} {path.sections.length === 1 ? 'section' : 'sections'}
                    </span>
                    <span className={monoLabel}>{path.enrollments} enrolled</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Stars value={path.reviewsAvg} />
                      <span className={monoLabel}>{path.reviewsCount}</span>
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === path.id}
                    onClick={() => togglePublished(path)}
                  >
                    {path.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Link to={`/app/admin/${path.id}`}>
                    <Button size="sm" variant="secondary">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === path.id}
                    onClick={() => setConfirming(path)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <span className={monoLabel}>
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

      <ConfirmModal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete this path?"
        body={`“${confirming?.subject ?? ''}” and its reviews will be removed. Anyone already enrolled keeps their copy.`}
        confirmLabel="Delete"
        danger
        busy={busyId === confirming?.id}
      />
    </Page>
  )
}

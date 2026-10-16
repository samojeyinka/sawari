import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { RouteFallback } from '../components/ui/RouteFallback'
import { monoLabel } from '../components/layout/nav'
import { adminCatalogApi, ApiError, type CatalogPathInput } from '../lib/api'
import {
  CatalogForm,
  emptyDraft,
  sectionToDraft,
  type FormDraft,
} from '../components/admin/CatalogForm'
import { useAlert } from '../state/alertContext'
import { cx } from '../lib/utils'

export function AdminCatalogEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()
  const [draft, setDraft] = useState<FormDraft | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) {
      setDraft(emptyDraft())
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    adminCatalogApi
      .get(id)
      .then((detail) => {
        if (cancelled) return
        setDraft({
          subject: detail.subject,
          slug: detail.slug,
          summary: detail.summary,
          goal: detail.goal ?? '',
          level: detail.level ?? '',
          tagsText: detail.tags.join(', '),
          weeklyHours: detail.weeklyHours,
          intensity: detail.intensity,
          formats: detail.formats,
          expectedWeeks: detail.expectedWeeks,
          expectedHours: detail.expectedHours,
          ogImage: detail.ogImage ?? '',
          published: Boolean(detail.published),
          sections: detail.sections.map(sectionToDraft),
        })
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) {
          alert.error('That path no longer exists.')
          navigate('/app/admin', { replace: true })
          return
        }
        alert.fromError(error, 'Could not load this path.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, alert, navigate])

  const submit = async (input: CatalogPathInput) => {
    setSaving(true)
    try {
      if (id) {
        await adminCatalogApi.update(id, input)
        alert.success('Path saved.')
      } else {
        await adminCatalogApi.create(input)
        alert.success('Path created.')
      }
      navigate('/app/admin')
    } catch (error) {
      alert.fromError(error, 'Could not save this path.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page width="wide">
      <Link to="/app/admin" className={cx(monoLabel, 'transition-colors hover:text-on-band')}>
        ← Catalog
      </Link>
      <PageHeader
        eyebrow="Admin"
        title={id ? 'Edit catalog path' : 'New catalog path'}
        subtitle="Author the full session content for each section, then publish when it is ready."
      />
      {loading || !draft ? (
        <RouteFallback />
      ) : (
        <CatalogForm
          key={id ?? 'new'}
          initial={draft}
          submitting={saving}
          submitLabel={id ? 'Save changes' : 'Create path'}
          onSubmit={(input) => void submit(input)}
          onCancel={() => navigate('/app/admin')}
        />
      )}
    </Page>
  )
}

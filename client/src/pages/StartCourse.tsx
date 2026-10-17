import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { catalogApi } from '../lib/api'
import { RouteFallback } from '../components/ui/RouteFallback'

export function StartCoursePage() {
  const { slug = '' } = useParams()
  const { reloadData, activatePath } = useApp()
  const alert = useAlert()
  const [error, setError] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    catalogApi
      .enroll(slug)
      .then(async (created) => {
        await reloadData()
        activatePath(created.id)
        alert.success('Added to your paths. You can edit it and track progress like any other.')
        window.location.assign('/app/path')
      })
      .catch((err) => {
        alert.fromError(err, 'Could not start this course.')
        setError(true)
      })
  }, [slug, reloadData, activatePath, alert])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-band text-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">Something went wrong</p>
        <p className="text-[13.5px] text-on-band-muted">We could not start this course. It may be unpublished or require verification.</p>
        <a href={`/courses/${encodeURIComponent(slug)}`} className="inline-flex h-[38px] items-center border border-on-band/25 px-5 text-[13.5px] text-on-band">
          Back to the course
        </a>
      </div>
    )
  }

  return <RouteFallback />
}

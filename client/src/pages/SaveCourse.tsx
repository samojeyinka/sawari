import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAlert } from '../state/alertContext'
import { catalogApi } from '../lib/api'
import { RouteFallback } from '../components/ui/RouteFallback'

export function SaveCoursePage() {
  const { slug = '' } = useParams()
  const alert = useAlert()
  const [error, setError] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    catalogApi
      .save(slug)
      .then(() => {
        window.location.assign(`/courses/${encodeURIComponent(slug)}`)
      })
      .catch((err) => {
        alert.fromError(err, 'Could not save this course.')
        setError(true)
      })
  }, [slug, alert])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-band text-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">Could not save</p>
        <p className="text-[13.5px] text-on-band-muted">You may need to be signed in and verify your email.</p>
        <a href={`/courses/${encodeURIComponent(slug)}`} className="inline-flex h-[38px] items-center border border-on-band/25 px-5 text-[13.5px] text-on-band">
          Back to the course
        </a>
      </div>
    )
  }

  return <RouteFallback />
}

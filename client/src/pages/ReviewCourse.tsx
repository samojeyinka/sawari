import { useParams } from 'react-router-dom'
import { ReviewComposer } from '../components/catalog/ReviewComposer'

export function ReviewCoursePage() {
  const { slug = '' } = useParams()
  return (
    <div className="min-h-screen bg-band py-10">
      <div className="mx-auto w-full max-w-[720px] px-6">
        <h1 className="font-display text-[28px] font-light text-on-band">Write a review</h1>
        <p className="mt-2 text-[13.5px] text-on-band-dim">
          Share what you thought about this course to help others.
        </p>
        <div className="mt-6">
          <ReviewComposer
            slug={slug}
            onSaved={() => window.location.assign(`/courses/${encodeURIComponent(slug)}`)}
          />
        </div>
        <div className="mt-6">
          <a
            href={`/courses/${encodeURIComponent(slug)}`}
            className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim transition-colors hover:text-on-band"
          >
            ← Back to the course
          </a>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuStar } from 'react-icons/lu'
import { Page, PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { RouteFallback } from '../components/ui/RouteFallback'
import { monoLabel } from '../components/layout/nav'
import {
  catalogApi,
  ApiError,
  type ApiCatalogPathDetail,
  type ApiCatalogReview,
} from '../lib/api'
import { LevelTag, Stars } from '../components/catalog/shared'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { cx, formatClock } from '../lib/utils'

function ReviewComposer({
  slug,
  existing,
  onSaved,
}: {
  slug: string
  existing: ApiCatalogReview | null
  onSaved: () => void
}) {
  const alert = useAlert()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [text, setText] = useState(existing?.text ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRating(existing?.rating ?? 0)
    setText(existing?.text ?? '')
  }, [existing])

  const submit = async () => {
    if (rating < 1) {
      alert.error('Pick a rating from one to five stars.')
      return
    }
    setBusy(true)
    try {
      await catalogApi.addReview(slug, { rating, text: text.trim() })
      alert.success(existing ? 'Your review was updated.' : 'Thanks for the review.')
      onSaved()
    } catch (error) {
      alert.fromError(error, 'Could not save your review.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-on-band/15 bg-panel p-5">
      <p className={monoLabel}>{existing ? 'your review' : 'leave a review'}</p>
      <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
            aria-checked={rating === value}
            role="radio"
            onClick={() => setRating(value)}
            className="transition-transform hover:scale-110"
          >
            <LuStar
              className={cx(
                'h-6 w-6',
                value <= rating ? 'text-accent-bright' : 'text-on-band/20',
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What did you think? Optional, but it helps others."
        className="mt-4 w-full resize-y border border-on-band/20 bg-band px-3.5 py-2.5 text-[14px] leading-relaxed text-on-band placeholder:text-on-band-dim focus:border-on-band/45 focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <Button size="sm" loading={busy} onClick={submit}>
          {existing ? 'Update review' : 'Post review'}
        </Button>
      </div>
    </div>
  )
}

export function CourseDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()
  const { state, reloadData, activatePath } = useApp()

  const [path, setPath] = useState<ApiCatalogPathDetail | null>(null)
  const [reviews, setReviews] = useState<ApiCatalogReview[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [enrolling, setEnrolling] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [detail, reviewPage] = await Promise.all([
          catalogApi.get(slug, signal),
          catalogApi.reviews(slug, { limit: 20 }, signal).catch(() => ({ items: [], meta: null })),
        ])
        setPath(detail)
        setReviews(reviewPage.items)
        setStatus('ready')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiError && error.status === 404) {
          setStatus('missing')
          return
        }
        alert.fromError(error, 'Could not load this course.')
        setStatus('missing')
      }
    },
    [slug, alert],
  )

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const enroll = async () => {
    if (!path) return
    setEnrolling(true)
    try {
      const created = await catalogApi.enroll(path.slug)
      await reloadData()
      activatePath(created.id)
      alert.success('Added to your paths. You can edit it and track progress like any other.')
      navigate('/app/path')
    } catch (error) {
      alert.fromError(error, 'Could not enroll in this course.')
    } finally {
      setEnrolling(false)
    }
  }

  if (status === 'loading') return <RouteFallback />

  if (status === 'missing' || !path) {
    return (
      <Page width="narrow">
        <div className="border border-dashed border-on-band/20 bg-panel px-6 py-16 text-center">
          <p className={monoLabel}>not found</p>
          <p className="mt-2 text-[14px] text-on-band-muted">
            This course is not published, or it has been removed.
          </p>
          <Link to="/app/courses" className="mt-6 inline-block">
            <Button variant="secondary" size="sm">
              Back to Courses
            </Button>
          </Link>
        </div>
      </Page>
    )
  }

  const totalMinutes = path.sections.reduce((sum, section) => sum + section.minutes, 0)

  return (
    <Page width="default">
      <Link
        to="/app/courses"
        className={cx(monoLabel, 'transition-colors hover:text-on-band')}
      >
        ← Courses
      </Link>

      <PageHeader
        eyebrow="Course"
        title={path.subject}
        subtitle={path.summary || undefined}
        actions={
          <Button loading={enrolling} onClick={enroll}>
            Start this course
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-on-band/10 py-4">
        <LevelTag level={path.level} />
        <span className="inline-flex items-center gap-2">
          <Stars value={path.reviewsAvg} />
          <span className="text-[13px] text-on-band-muted">
            {path.reviewsCount > 0
              ? `${path.reviewsAvg.toFixed(1)} · ${path.reviewsCount} ${path.reviewsCount === 1 ? 'review' : 'reviews'}`
              : 'No reviews yet'}
          </span>
        </span>
        <span className={monoLabel}>{path.enrollments} enrolled</span>
        <span className={monoLabel}>
          {path.sections.length} {path.sections.length === 1 ? 'section' : 'sections'}
        </span>
        {totalMinutes > 0 && <span className={monoLabel}>{formatClock(totalMinutes)} total</span>}
        {path.expectedWeeks > 0 && <span className={monoLabel}>{path.expectedWeeks} weeks</span>}
      </div>

      {path.goal && (
        <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-on-band-muted">{path.goal}</p>
      )}

      {path.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {path.tags.map((tag) => (
            <span
              key={tag}
              className="border border-on-band/12 px-2 py-0.5 text-[11.5px] text-on-band-dim"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-[20px] font-light text-on-band">What you will cover</h2>
      <ol className="mt-4 divide-y divide-on-band/10 border border-on-band/15">
        {path.sections.map((section, index) => (
          <li key={section.id} className="flex items-start gap-4 bg-panel px-5 py-4">
            <span className="mt-0.5 font-mono text-[11px] text-on-band-dim">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-medium text-on-band">{section.title}</h3>
                {section.minutes > 0 && (
                  <span className={monoLabel}>{formatClock(section.minutes)}</span>
                )}
              </div>
              {section.description && (
                <p className="mt-1 text-[13.5px] leading-relaxed text-on-band-muted">
                  {section.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <span className={monoLabel}>{section.content.lesson.minutes} min lesson</span>
                <span className={monoLabel}>
                  {section.content.resources.length}{' '}
                  {section.content.resources.length === 1 ? 'resource' : 'resources'}
                </span>
                <span className={monoLabel}>
                  {section.content.practice.kind === 'written' ? 'written task' : 'classify task'}
                </span>
                <span className={monoLabel}>
                  {section.content.assessment.questions.length} questions
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 font-display text-[20px] font-light text-on-band">Reviews</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="border border-dashed border-on-band/20 bg-panel px-5 py-10 text-center">
              <p className="text-[13.5px] text-on-band-dim">
                No reviews yet. Be the first to say what you think.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="border border-on-band/15 bg-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] font-medium text-on-band">{review.author}</span>
                  <Stars value={review.rating} />
                </div>
                {review.text && (
                  <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-on-band-muted">
                    {review.text}
                  </p>
                )}
              </article>
            ))
          )}
        </div>

        {state.authStatus === 'authenticated' && (
          <ReviewComposer slug={path.slug} existing={null} onSaved={() => void load()} />
        )}
      </div>
    </Page>
  )
}

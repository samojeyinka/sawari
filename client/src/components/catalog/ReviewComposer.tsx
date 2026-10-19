import { useEffect, useState } from 'react'
import { LuCheck, LuLock, LuStar } from 'react-icons/lu'
import { Button } from '../ui/Button'
import { monoLabel } from '../layout/nav'
import { catalogApi, type CourseProgressInfo } from '../../lib/api'
import { useAlert } from '../../state/alertContext'
import { cx } from '../../lib/utils'

export function ReviewComposer({
  slug,
  onSaved,
}: {
  slug: string
  onSaved: () => void
}) {
  const alert = useAlert()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [progress, setProgress] = useState<CourseProgressInfo | null>(null)

  useEffect(() => {
    let active = true
    setLoadingProgress(true)
    catalogApi
      .progress(slug)
      .then((res) => {
        if (active) setProgress(res)
      })
      .catch((err) => {
        console.error('Failed to load course progress:', err)
      })
      .finally(() => {
        if (active) setLoadingProgress(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  const submit = async () => {
    if (rating < 1) {
      alert.error('Pick a rating from one to five stars.')
      return
    }
    setBusy(true)
    try {
      await catalogApi.addReview(slug, { rating, text: text.trim() })
      alert.success('Thanks for the review.')
      onSaved()
    } catch (error) {
      alert.fromError(error, 'Could not save your review.')
    } finally {
      setBusy(false)
    }
  }

  if (loadingProgress) {
    return (
      <div className="border border-on-band/15 bg-panel p-6">
        <p className={monoLabel}>checking review eligibility</p>
        <p className="mt-2 text-[13px] text-on-band-dim">Loading your course progress...</p>
      </div>
    )
  }

  if (progress && !progress.canReview) {
    const percent = progress.progressPercent
    const remaining = Math.max(0, 70 - percent)
    return (
      <div className="border border-on-band/15 bg-panel p-6">
        <div className="flex items-center gap-2 text-on-band-muted">
          <LuLock className="h-4 w-4 text-on-band-dim" />
          <p className={monoLabel}>reviews unlock at 70% completion</p>
        </div>

        <h2 className="mt-2 text-[18px] font-medium text-on-band">
          {progress.enrolled
            ? `You have completed ${percent}% of this course`
            : 'Enroll and begin learning to unlock reviews'}
        </h2>

        <p className="mt-1 text-[13.5px] leading-relaxed text-on-band-muted">
          Reviews are reserved for learners who have experienced at least 70% of the material.
          {progress.enrolled
            ? ` Complete ${remaining}% more of the course sections to leave your review.`
            : ' Start this course to track your progress and share your thoughts.'}
        </p>

        <div className="mt-4">
          <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-on-band-dim mb-1.5">
            <span>Progress: {percent}%</span>
            <span>Target: 70%</span>
          </div>
          <div className="h-2 w-full overflow-hidden bg-on-band/10">
            <div
              className="h-full bg-accent-bright transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((percent / 70) * 100))}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {progress.enrolled ? (
            <a
              href="/app/path"
              className="inline-flex h-[38px] items-center bg-on-band px-4 text-[13px] font-medium text-band transition-opacity hover:opacity-90"
            >
              Continue course
            </a>
          ) : (
            <a
              href={`/start/${encodeURIComponent(slug)}`}
              className="inline-flex h-[38px] items-center bg-on-band px-4 text-[13px] font-medium text-band transition-opacity hover:opacity-90"
            >
              Start course
            </a>
          )}
          <a
            href={`/courses/${encodeURIComponent(slug)}`}
            className="inline-flex h-[38px] items-center border border-on-band/20 px-4 text-[13px] text-on-band-muted hover:text-on-band"
          >
            Course outline
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-on-band/15 bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className={monoLabel}>leave a review</p>
        {progress && (
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wider text-accent-bright">
            <LuCheck className="h-3.5 w-3.5" /> {progress.progressPercent}% completed
          </span>
        )}
      </div>

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
              className={cx('h-6 w-6', value <= rating ? 'text-accent-bright' : 'text-on-band/20')}
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
          Post review
        </Button>
      </div>
    </div>
  )
}

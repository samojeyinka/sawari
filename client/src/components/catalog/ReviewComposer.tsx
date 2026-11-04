import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuCheck, LuLoaderCircle, LuLock, LuStar } from 'react-icons/lu'
import { Button } from '../ui/Button'
import { catalogApi, type CourseProgressInfo } from '../../lib/api'
import { useAlert } from '../../state/alertContext'

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
      <div className="rounded-2xl border border-[#e8e4ec] bg-white p-6 shadow-[0_10px_30px_rgba(33,27,42,0.05)]" role="status">
        <div className="flex items-center gap-3">
          <LuLoaderCircle className="h-5 w-5 animate-spin text-[#713bd1]" />
          <div><p className="text-[12px] font-extrabold text-[#30283b]">Checking your course progress</p><p className="mt-1 text-[11px] text-[#77717e]">Getting your review eligibility ready…</p></div>
        </div>
      </div>
    )
  }

  if (progress && !progress.canReview) {
    const percent = progress.progressPercent
    const remaining = Math.max(0, 70 - percent)
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e8e4ec] bg-white shadow-[0_10px_30px_rgba(33,27,42,0.05)]">
        <div className="flex items-center gap-3 border-b border-[#eeeaf1] bg-[#faf7fd] px-5 py-4 sm:px-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#713bd1] shadow-sm"><LuLock className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#713bd1]">Review eligibility</p><p className="mt-0.5 text-[11px] font-semibold text-[#6f6876]">Unlocks at 70% course completion</p></div>
        </div>

        <div className="p-5 sm:p-6">
        <h2 className="text-[18px] font-extrabold leading-snug tracking-[-0.02em] text-[#211b2a]">
          {progress.enrolled
            ? `You have completed ${percent}% of this course`
            : 'Enroll and begin learning to unlock reviews'}
        </h2>

        <p className="mt-2 text-[13px] leading-6 text-[#625c67]">
          Reviews are reserved for learners who have experienced at least 70% of the material.
          {progress.enrolled
            ? ` Complete ${remaining}% more of the course sections to leave your review.`
            : ' Start this course to track your progress and share your thoughts.'}
        </p>

        <div className="mt-4">
          <div className="mb-2 flex justify-between text-[10px] font-bold text-[#77717e]">
            <span>Progress: {percent}%</span>
            <span>Target: 70%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eeeaf1]">
            <div
              className="h-full rounded-full bg-[#713bd1] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((percent / 70) * 100))}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {progress.enrolled ? (
            <Link
              to="/app/path"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#713bd1] px-5 text-[12px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5e2eb3]"
            >
              Continue course
            </Link>
          ) : (
            <Link
              to={`/start/${encodeURIComponent(slug)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#713bd1] px-5 text-[12px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5e2eb3]"
            >
              Start course
            </Link>
          )}
          <Link
            to={`/courses/${encodeURIComponent(slug)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e3d9ee] bg-white px-5 text-[12px] font-bold text-[#6130ae] transition hover:bg-[#f8f3fc]"
          >
            Course outline
          </Link>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#e8e4ec] bg-white p-5 shadow-[0_10px_30px_rgba(33,27,42,0.05)] sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#77717e]">Leave a review</p>
        {progress && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3eef9] px-3 py-1.5 text-[10px] font-extrabold text-[#6130ae]">
            <LuCheck className="h-3.5 w-3.5" /> {progress.progressPercent}% completed
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
            aria-checked={rating === value}
            role="radio"
            onClick={() => setRating(value)}
            className="grid h-11 w-11 place-items-center rounded-xl transition hover:scale-105 hover:bg-[#f7f2fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#713bd1]"
          >
            <LuStar
              className={`h-6 w-6 ${value <= rating ? 'fill-[#f5bc48] text-[#e6a12b]' : 'text-[#d5cfda]'}`}
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
        className="mt-3 w-full resize-y rounded-xl border border-[#e5e0e9] bg-[#fcfbfd] px-4 py-3 text-[13px] leading-6 text-[#30283b] placeholder:text-[#9a93a0] focus:border-[#a77be0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#713bd1]/10"
      />
      <div className="mt-3 flex justify-end">
        <Button variant="accent" size="md" className="rounded-xl px-5 font-extrabold shadow-[0_5px_14px_rgba(113,59,209,0.18)] hover:-translate-y-0.5" loading={busy} onClick={submit}>
          Post review
        </Button>
      </div>
    </div>
  )
}

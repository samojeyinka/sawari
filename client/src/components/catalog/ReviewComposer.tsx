import { useState } from 'react'
import { LuStar } from 'react-icons/lu'
import { Button } from '../ui/Button'
import { monoLabel } from '../layout/nav'
import { catalogApi } from '../../lib/api'
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

  return (
    <div className="border border-on-band/15 bg-panel p-5">
      <p className={monoLabel}>leave a review</p>
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

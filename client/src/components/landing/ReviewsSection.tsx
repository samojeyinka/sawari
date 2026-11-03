import { useEffect, useState } from 'react'
import { catalogApi, type ApiCatalogReview } from '../../lib/api'
import { cx } from '../../lib/utils'
import type { LandingReview } from './landing.types'
import { heading, eyebrow, inset } from './landing.constants'
import { useLandingCatalog } from './useLandingCatalog'

export function ReviewsSection() {
  const { courses } = useLandingCatalog()
  const [reviews, setReviews] = useState<LandingReview[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const reviewedCourses = courses.filter((course) => course.reviewsCount > 0).slice(0, 4)
    if (reviewedCourses.length === 0) {
      setReviews([])
      return () => controller.abort()
    }
    Promise.all(reviewedCourses.map((course) =>
      catalogApi.reviews(course.slug, { limit: 2 }, controller.signal)
        .then((page) => page.items.map((review: ApiCatalogReview) => ({
          ...review,
          courseSubject: course.subject,
          courseSlug: course.slug,
        })))
        .catch(() => [] as LandingReview[]),
    )).then((pages) => setReviews(pages.flat().slice(0, 6)))
    return () => controller.abort()
  }, [courses])

  if (!reviews.length) return null
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return (
    <section className="landing-reviews-section">
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="landing-reviews-heading">
          <div>
            <p className={eyebrow}>Learner feedback</p>
            <h2 className={cx(heading, 'mt-3 text-[30px] sm:text-[42px]')}>Real notes from people learning with Sawari.</h2>
          </div>
          <div className="landing-reviews-average" aria-label={`Average rating ${average.toFixed(1)} out of 5`}>
            <strong>{average.toFixed(1)}</strong><span>★★★★★</span><small>from {reviews.length} recent {reviews.length === 1 ? 'review' : 'reviews'}</small>
          </div>
        </div>
        <div className="landing-reviews-list" aria-label="Learner reviews">
          {reviews.map((review) => (
            <article className="landing-review-card" key={review.id}>
              <div className="landing-review-top"><span aria-hidden="true">“</span><span className="landing-review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
              <p className="landing-review-quote">{review.text || 'This learner left a rating without a written comment.'}</p>
              <div className="landing-review-byline">
                <span className="landing-review-avatar" aria-hidden="true">{review.author.trim().charAt(0).toUpperCase()}</span>
                <div><strong>{review.author}</strong><small>Course learner</small></div>
              </div>
              <a className="landing-review-course" href={`/courses/${encodeURIComponent(review.courseSlug)}`}>{review.courseSubject}<span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

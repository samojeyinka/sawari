import { Link, useSearchParams } from 'react-router-dom'
import type { ApiCatalogPath } from '../../lib/api'

export function CourseCard({ course, view = 'grid' }: { course: ApiCatalogPath; view?: 'grid' | 'list' }) {
  const [searchParams] = useSearchParams()
  const rating = course.reviewsCount > 0 ? course.reviewsAvg : 0
  const level = course.level ? course.level.replace('-', ' ') : 'All levels'
  const filterHref = (key: 'category' | 'tag', value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    next.delete('page')
    return `/courses?${next.toString()}`
  }

  return (
    <article className={`catalog-course-card catalog-course-card-${view}`}>
      <div className="catalog-course-media">
        <Link className="catalog-course-image" to={`/courses/${encodeURIComponent(course.slug)}`} aria-label={`View ${course.subject}`}>
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt="" loading="lazy" />
          ) : (
            <span aria-hidden="true">{course.subject.slice(0, 1)}</span>
          )}
        </Link>
        {course.category && <Link className="catalog-course-category" to={filterHref('category', course.category)}>{course.category}</Link>}
      </div>
      <div className="catalog-course-copy">
        <div className="catalog-course-topline">
          <span>{level}</span>
          <span>{course.expectedWeeks > 0 ? `${course.expectedWeeks} weeks` : 'Self-paced'}</span>
        </div>
        <Link className="catalog-course-title" to={`/courses/${encodeURIComponent(course.slug)}`}>{course.subject}</Link>
        <p className="catalog-course-summary">{course.summary || course.goal || 'A structured course with a clear path from the basics to real practice.'}</p>
        <div className="catalog-course-rating">
          <span className={rating ? 'catalog-course-stars' : 'catalog-course-stars is-new'} aria-label={rating ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}>{rating ? '★★★★★' : '☆☆☆☆☆'}</span>
          <span>{rating ? rating.toFixed(1) : 'New'}</span>
          <span>({course.reviewsCount} {course.reviewsCount === 1 ? 'review' : 'reviews'})</span>
        </div>
        <div className="catalog-course-meta">
          {course.expectedHours > 0 && <span>{course.expectedHours} hours</span>}
          <span>{course.enrollments.toLocaleString()} learners</span>
        </div>
        {course.tags.length > 0 && (
          <div className="catalog-course-tags">
            {course.tags.slice(0, 3).map((tag) => <Link key={tag} to={filterHref('tag', tag)}>{tag}</Link>)}
          </div>
        )}
      </div>
    </article>
  )
}

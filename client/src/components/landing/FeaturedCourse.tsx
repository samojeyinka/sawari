import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'
import { heading, eyebrow, inset } from './landing.constants'
import { useLandingCatalog } from './useLandingCatalog'

export function FeaturedCourse() {
  const { courses, isLoading } = useLandingCatalog()
  const course = courses[0] ?? null
  return (
    <section className="landing-featured-section">
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
          <div>
            <p className={eyebrow}>Learners are starting here</p>
            <h2 className={cx(heading, 'mt-3 max-w-[720px] text-[30px] sm:text-[42px]')}>The course people are choosing most.</h2>
          </div>
          <Link className="landing-text-link" to="/courses">See every free course <span aria-hidden="true">→</span></Link>
        </div>
        {isLoading ? (
          <p className="landing-facets-message" role="status">Loading the most-enrolled free course…</p>
        ) : course ? (
          <article className="landing-featured-card">
            <a className="landing-featured-image-wrap" href={`/courses/${encodeURIComponent(course.slug)}`} aria-label={`View ${course.subject}`}>
              {course.thumbnailUrl ? (
                <img className="landing-featured-image" src={course.thumbnailUrl} alt={`${course.subject} course`} loading="lazy" />
              ) : (
                <div className="landing-image-placeholder" aria-hidden="true" />
              )}
              <span className="landing-image-label">Most enrolled</span>
            </a>
            <div className="landing-featured-copy">
              <p className="landing-category-label">{course.category || 'Free course'}</p>
              <h3>{course.subject}</h3>
              <p className="landing-featured-summary">{course.summary || course.goal || 'A structured course with a clear path from the basics to real practice.'}</p>
              <div className="landing-course-meta">
                {course.level && <span>{course.level}</span>}
                {course.expectedWeeks > 0 && <span>{course.expectedWeeks} weeks</span>}
                {course.expectedHours > 0 && <span>{course.expectedHours} learning hours</span>}
                <span>{course.enrollments.toLocaleString()} learners</span>
              </div>
              {course.tags.length > 0 && (
                <div className="landing-course-tags" aria-label="Related topics">
                  {course.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              )}
              <div className="landing-featured-actions">
                <a href={`/courses/${encodeURIComponent(course.slug)}`} className="landing-hero-cta">View this free course</a>
                <Link to="/setup" className="landing-hero-secondary">Make me a learning plan</Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="landing-course-empty"><p>New free courses are on the way.</p><a href="/courses">Browse the catalog</a></div>
        )}
      </div>
    </section>
  )
}

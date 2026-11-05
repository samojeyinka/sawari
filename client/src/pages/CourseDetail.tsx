import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Footer, Header } from '../components/landing'
import { catalogApi, type ApiCatalogPathDetail, type ApiCatalogReview } from '../lib/api'
import { formatDuration } from '../lib/utils'
import './CourseDetail.css'

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  some: 'Some experience',
  comfortable: 'Comfortable',
  advanced: 'Advanced',
}

function youtubeEmbedUrl(rawUrl?: string) {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    let videoId = ''
    if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] ?? ''
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      videoId = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ?? ''
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
      : null
  } catch {
    return null
  }
}

function safeResourceUrl(rawUrl?: string) {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function CourseDetailLoading() {
  return (
    <div className="course-detail-loading" role="status" aria-label="Loading course">
      <div className="course-detail-skeleton-main">
        <div className="course-detail-skeleton-line course-detail-skeleton-title" />
        <div className="course-detail-skeleton-line course-detail-skeleton-copy" />
        <div className="course-detail-skeleton-player" />
      </div>
      <div className="course-detail-skeleton-outline" />
    </div>
  )
}

export function CourseDetailPage() {
  const { slug = '' } = useParams()
  const [course, setCourse] = useState<ApiCatalogPathDetail | null>(null)
  const [reviews, setReviews] = useState<ApiCatalogReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    Promise.allSettled([
      catalogApi.get(slug, controller.signal),
      catalogApi.reviews(slug, { page: 1, limit: 6 }, controller.signal),
    ]).then(([courseResult, reviewResult]) => {
      if (controller.signal.aborted) return
      if (courseResult.status === 'rejected') {
        setError('We could not load this course right now. Please try again.')
        return
      }
      setCourse(courseResult.value)
      setReviews(reviewResult.status === 'fulfilled' ? reviewResult.value.items : [])
    }).catch(() => {
      if (!controller.signal.aborted) setError('We could not load this course right now. Please try again.')
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false)
    })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    document.title = course ? `${course.subject} | Sawari` : 'Courses | Sawari'
  }, [course?.subject])

  const orderedSections = useMemo(
    () => [...(course?.sections ?? [])].sort((a, b) => a.order - b.order),
    [course?.sections],
  )
  const video = orderedSections.flatMap((section) => {
    const resources = section.content.resources ?? (section.content.resource ? [section.content.resource] : [])
    return resources.filter((resource) => resource.kind === 'video').map((resource) => ({ section, resource }))
  })[0]
  const embedUrl = youtubeEmbedUrl(video?.resource.url)
  const previewUrl = safeResourceUrl(video?.resource.url)
  const totalMinutes = orderedSections.reduce((total, section) => total + section.minutes, 0)
  const detailUrl = typeof window === 'undefined' ? '' : window.location.href

  const shareCourse = async () => {
    const shareData = { title: course?.subject ?? 'Sawari course', text: course?.summary ?? 'Explore this free course on Sawari.', url: detailUrl }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(detailUrl)
        setShareMessage('Course link copied')
        window.setTimeout(() => setShareMessage(''), 2200)
      }
    } catch {
      setShareMessage('Could not share this link')
      window.setTimeout(() => setShareMessage(''), 2200)
    }
  }

  return (
    <div className="landing-page course-detail-page min-h-screen">
      <Header />
      <main className="course-detail-content">
        <div className="course-detail-breadcrumb"><Link to="/courses">Courses</Link><span aria-hidden="true">/</span><span>{course?.subject ?? 'Course'}</span></div>
        {isLoading ? <CourseDetailLoading /> : error ? (
          <section className="course-detail-message" role="alert"><h1>Course unavailable</h1><p>{error}</p><Link to="/courses">Back to all courses</Link></section>
        ) : course ? (
          <>
            <div className="course-detail-layout">
              <section className="course-detail-main">
                <header className="course-detail-heading">
                  <div className="course-detail-taxonomy">
                    {course.category && <Link to={`/courses?category=${encodeURIComponent(course.category)}`}>{course.category}</Link>}
                    {course.tags.map((tag) => <Link key={tag} to={`/courses?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}
                  </div>
                  <h1>{course.subject}</h1>
                  {course.summary && <p className="course-detail-summary">{course.summary}</p>}
                  <div className="course-detail-stats">
                    <span className="course-detail-rating"><span aria-hidden="true">★</span> {course.reviewsCount ? course.reviewsAvg.toFixed(1) : 'New'}</span>
                    {course.reviewsCount > 0 && <span>{course.reviewsCount.toLocaleString()} reviews</span>}
                    <span>{course.enrollments.toLocaleString()} learners</span>
                    <span>{course.expectedHours ? `${course.expectedHours} hours` : totalMinutes ? formatDuration(totalMinutes) : 'Self-paced'}</span>
                    <span>{course.level ? levelLabel[course.level] ?? course.level : 'All levels'}</span>
                  </div>
                </header>

                <div className="course-detail-player">
                  {embedUrl ? (
                    <iframe src={embedUrl} title={video?.resource.title ?? `${course.subject} preview`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
                  ) : course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={`${course.subject} course preview`} />
                  ) : (
                    <div className="course-detail-player-fallback">Course preview will be available soon.</div>
                  )}
                  {!embedUrl && previewUrl && <a className="course-detail-preview-link" href={previewUrl} target="_blank" rel="noreferrer">▶ <span>Watch lesson preview</span></a>}
                </div>

                <div className="course-detail-actions">
                  <Link className="course-detail-primary" to={`/start/${encodeURIComponent(course.slug)}`}>Start this course</Link>
                  <Link className="course-detail-secondary" to={`/save/${encodeURIComponent(course.slug)}`}>Save for later</Link>
                  <button className="course-detail-secondary" type="button" onClick={() => void shareCourse()}>Share</button>
                  {shareMessage && <span className="course-detail-share-message" role="status">{shareMessage}</span>}
                </div>

              </section>

              <aside className="course-detail-outline" aria-label="Course content">
                <div className="course-detail-outline-heading"><div><span>YOUR LEARNING PLAN</span><h2>Course content</h2></div><span className="course-detail-module-count">{orderedSections.length}</span></div>
                <p className="course-detail-outline-meta">{orderedSections.length} modules <span>·</span> {totalMinutes ? `${formatDuration(totalMinutes)} total` : 'Self-paced'}</p>
                <div className="course-detail-facts">
                  <div><span>Level</span><strong>{course.level ? levelLabel[course.level] ?? course.level : 'All levels'}</strong></div>
                  <div><span>Category</span><strong>{course.category || 'General'}</strong></div>
                  <div><span>Finish in</span><strong>{course.expectedWeeks ? `${course.expectedWeeks} weeks` : 'Self-paced'}</strong></div>
                  <div><span>Formats</span><strong>{course.formats.join(', ') || 'Self-paced'}</strong></div>
                </div>
                <div className="course-detail-modules">
                  {orderedSections.length ? orderedSections.map((section, index) => {
                    const resources = section.content.resources ?? (section.content.resource ? [section.content.resource] : [])
                    return <details className="course-detail-module" key={section.id} open={index === 0}>
                      <summary><span className="course-detail-module-number">{String(index + 1).padStart(2, '0')}</span><span className="course-detail-module-title">{section.title}</span><span className="course-detail-module-duration">{section.minutes ? formatDuration(section.minutes) : ''}</span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7 5 5 5-5" /></svg></summary>
                      <div className="course-detail-module-body"><strong>{section.content.lesson?.title || section.title}</strong>{section.description && <p>{section.description}</p>}{section.content.lesson?.intro && <p>{section.content.lesson.intro}</p>}
                        {resources.map((resource) => safeResourceUrl(resource.url)
                          ? <a className="course-detail-resource" key={resource.id} href={safeResourceUrl(resource.url)!} target="_blank" rel="noreferrer"><span><span className="course-detail-resource-kind">{resource.kind}</span>{resource.title}</span><small>{formatDuration(resource.minutes)} ↗</small></a>
                          : <div className="course-detail-resource" key={resource.id}><span><span className="course-detail-resource-kind">{resource.kind}</span>{resource.title}</span><small>{formatDuration(resource.minutes)}</small></div>)}
                      </div>
                    </details>
                  }) : <div className="course-detail-no-modules">Course content is being prepared.</div>}
                </div>
              </aside>
            </div>
            <section className="course-detail-about">
              {course.goal && <><h2>What you’ll be able to do</h2><p>{course.goal}</p></>}
              <h2>About this course</h2><p>{course.summary || `Learn ${course.subject} with a practical, step-by-step course.`}</p>
            </section>
            {reviews.length > 0 && <section className="course-detail-reviews">
              <div className="course-detail-section-heading"><div><span>LEARNER FEEDBACK</span><h2>Reviews</h2></div><strong>★ {course.reviewsAvg.toFixed(1)} <small>({course.reviewsCount})</small></strong></div>
              <div className="course-review-list">{reviews.map((review) => <article className="course-review-card" key={review.id}><div className="course-review-card-head"><strong>{review.author || 'A learner'}</strong><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></span></div><p>{review.text || 'Rated this course.'}</p></article>)}</div>
            </section>}
            <div className="course-detail-bottom-actions"><Link to={`/review/${encodeURIComponent(course.slug)}`}>Write a review</Link><Link to={`/certificate/${encodeURIComponent(course.slug)}`}>View certificate</Link></div>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}

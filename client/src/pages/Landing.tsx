import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarMenu } from '../components/ui/AvatarMenu'
import { Logo } from '../components/ui/Logo'
import { Modal } from '../components/ui/Modal'
import { catalogApi, type ApiCatalogCategories, type ApiCatalogPath, type ApiCatalogReview } from '../lib/api'
import { cx } from '../lib/utils'
import { useApp } from '../state/store'

const inset = 'mx-auto w-full max-w-[1880px] px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-[118px]'
const sectionBand = 'border-b border-on-band/10'
const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.12em] text-on-band-dim'
const heading = 'font-display font-extrabold leading-[1.04] tracking-[-0.04em] text-on-band'
const paragraph = 'text-[15.5px] leading-relaxed text-on-band-muted'

function Header({ categories, categoriesLoading }: { categories: ApiCatalogCategories['categories']; categoriesLoading: boolean }) {
  const { state, signOut } = useApp()
  const [exploreOpen, setExploreOpen] = useState(false)
  const topCategories = categories.slice(0, 5)

  return (
    <header className="landing-header sticky top-0 z-40">
      <div className="landing-topline">
        <div className={cx(inset, 'flex h-9 items-center justify-between gap-4')}>
          <span className="hidden sm:block">Free courses. A plan built around your week.</span>
          <span className="sm:hidden">Free learning, on your time.</span>
          <span className="hidden items-center gap-3 md:flex">
            <a href="/courses">Explore courses</a><span aria-hidden="true">·</span><a href="#how">How Sawari works</a>
          </span>
        </div>
      </div>
      <div className="landing-mainnav">
        <div className={cx(inset, 'flex min-h-[76px] items-center gap-5 lg:gap-8')}>
          <Link to="/" aria-label="Sawari home" className="shrink-0"><Logo /></Link>
          <form action="/courses" method="get" className="landing-search hidden min-w-0 flex-1 items-center sm:flex">
            <span aria-hidden="true">⌕</span>
            <input name="q" aria-label="Search courses" placeholder="What do you want to learn?" />
            <button type="submit">Search</button>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:ml-0 sm:gap-5">
            {state.user ? (
              <AvatarMenu name={state.user.name} onSignOut={signOut} />
            ) : (
              <>
                <Link to="/login" className="landing-login">Log in</Link>
                <Link to="/setup" className="landing-join"><span aria-hidden="true">♙</span> Join for free</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <nav className="landing-category-nav" aria-label="Course categories">
        <div className={cx(inset, 'flex h-[46px] items-center gap-7 overflow-x-auto')}>
          <button type="button" className="landing-explore-trigger" onClick={() => setExploreOpen(true)} aria-haspopup="dialog" aria-expanded={exploreOpen}>
            Explore
            <svg aria-hidden="true" viewBox="0 0 12 8" width="12" height="8"><path d="m2 2 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          </button>
          {topCategories.map((category) => (
            <a key={category.name} href={`/courses?category=${encodeURIComponent(category.name)}`}>{category.name}</a>
          ))}
          <a className="landing-how-link" href="#how">How it works</a>
          <form action="/courses" method="get" className="landing-search landing-mobile-search items-center">
            <span aria-hidden="true">⌕</span>
            <input name="q" aria-label="Search courses" placeholder="Search courses" />
            <button type="submit">Search</button>
          </form>
        </div>
      </nav>
      <Modal
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        title="Explore course categories"
        description="Browse categories from the published catalog. Counts show how many courses are available."
        size="lg"
        className="landing-topics-modal"
      >
        {categoriesLoading ? (
          <div className="landing-facets-message" role="status">Loading categories…</div>
        ) : categories.length ? (
          <div className="landing-topic-list">
            {categories.map((category) => (
              <a className="landing-topic-link" key={category.name} href={`/courses?category=${encodeURIComponent(category.name)}`}>
                <span>{category.name}</span><small>{category.count} {category.count === 1 ? 'course' : 'courses'}</small>
              </a>
            ))}
          </div>
        ) : (
          <div className="landing-facets-message">No published categories yet. <a href="/courses">Browse the course catalog</a></div>
        )}
      </Modal>
    </header>
  )
}

function FeaturedCourse({ course }: { course: ApiCatalogPath | null }) {
  return (
    <section className="landing-featured-section">
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
          <div>
            <p className={eyebrow}>Learners are starting here</p>
            <h2 className={cx(heading, 'mt-3 max-w-[720px] text-[30px] sm:text-[42px]')}>The course people are choosing most.</h2>
          </div>
          <a className="landing-text-link" href="/courses">See every free course <span aria-hidden="true">→</span></a>
        </div>
        {course ? (
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

function CategorySection({
  categories,
  courses,
  categoriesLoading,
}: {
  categories: ApiCatalogCategories['categories']
  courses: ApiCatalogPath[]
  categoriesLoading: boolean
}) {
  const visibleCategories = categories.slice(0, 6)

  return (
    <section className={cx(sectionBand, 'landing-category-section')}>
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="mb-8 max-w-[700px]">
          <p className={eyebrow}>Find your subject</p>
          <h2 className={cx(heading, 'mt-3 text-[30px] sm:text-[42px]')}>Start with what you want to learn.</h2>
          <p className={cx(paragraph, 'mt-4 max-w-[590px]')}>Browse real course categories. Keep the tags as useful details; the category tells you what each course is about.</p>
        </div>
        {categoriesLoading ? (
          <p className="landing-facets-empty" role="status">Loading course categories…</p>
        ) : visibleCategories.length ? (
          <div className="landing-category-grid">
            {visibleCategories.map((category, index) => {
              const match = courses.find((course) => course.category === category.name && course.thumbnailUrl)
              return (
                <a className="landing-category-card" href={`/courses?category=${encodeURIComponent(category.name)}`} key={category.name}>
                  {match?.thumbnailUrl ? (
                    <img src={match.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <div className={`landing-category-art tone-${index % 3}`} aria-hidden="true" />
                  )}
                  <span className="landing-category-overlay" />
                  <span className="landing-category-copy">
                    <strong>{category.name}</strong>
                    <small>{category.count} {category.count === 1 ? 'course' : 'courses'} <span aria-hidden="true">→</span></small>
                  </span>
                </a>
              )
            })}
          </div>
        ) : (
          <p className="landing-facets-empty">Categories will appear here as courses are published.</p>
        )}
      </div>
    </section>
  )
}

type LandingReview = ApiCatalogReview & { courseSubject: string; courseSlug: string }

function ReviewsSection({ reviews }: { reviews: LandingReview[] }) {
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

function TimeFitSection() {
  return (
    <section className={cx(sectionBand, 'landing-time-section')}>
      <div className={cx(inset, 'grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20')}>
        <div className="landing-time-image">
          <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85" alt="A learner studying at a laptop at home" loading="lazy" />
          <div className="landing-time-note"><span>YOUR WEEK</span><strong>3 hours available</strong><small>Sawari builds around that.</small></div>
        </div>
        <div className="max-w-[540px]">
          <p className={eyebrow}>Built around your time</p>
          <h2 className={cx(heading, 'mt-3 text-[32px] sm:text-[46px]')}>A plan that fits the week you actually have.</h2>
          <p className={cx(paragraph, 'mt-5')}>Tell Sawari what you want to learn and how much time you can give it. Your path is broken into manageable sessions, so you always know what to do next.</p>
          <div className="landing-time-points">
            <p><span>01</span> Set your weekly time</p>
            <p><span>02</span> Follow one clear next step</p>
            <p><span>03</span> Adjust the pace when life changes</p>
          </div>
          <Link to="/setup" className="landing-hero-cta mt-7">Build my free learning plan</Link>
        </div>
      </div>
    </section>
  )
}

const steps = [
  ['01', 'Choose a goal', 'Pick a course or tell Sawari what skill you want to build.'],
  ['02', 'Set your available time', 'Choose a pace that fits the hours you can give each week.'],
  ['03', 'Learn, practise, continue', 'Follow the next session, practise what you learned, and keep moving.'],
]

function HowItWorks() {
  return (
    <section id="how" className={cx(sectionBand, 'scroll-mt-[155px] bg-white')}>
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="max-w-[760px]">
          <p className={eyebrow}>How Sawari works</p>
          <h2 className={cx(heading, 'mt-3 text-[30px] sm:text-[42px]')}>Less searching. More learning.</h2>
        </div>
        <div className="landing-steps-grid">
          {steps.map(([number, title, copy]) => (
            <article className="landing-step-card" key={number}>
              <span>{number}</span><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClosingCallToAction() {
  return (
    <section className="landing-closing">
      <div className={cx(inset, 'py-16 text-center sm:py-24')}>
        <p className={eyebrow}>Start free today</p>
        <h2 className={cx(heading, 'mx-auto mt-3 max-w-[780px] text-[34px] sm:text-[52px]')}>You don’t need more time. You need a plan for the time you have.</h2>
        <p className="mx-auto mt-5 max-w-[590px] text-[15px] leading-relaxed text-white/75">Choose a goal, set your pace, and start learning with free courses and resources.</p>
        <Link to="/setup" className="landing-closing-cta mt-7">Build my free learning plan</Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className={cx(inset, 'grid gap-8 py-10 sm:grid-cols-[1.5fr_1fr_1fr]')}>
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-on-band-dim">Free learning resources organized into a path that fits your time.</p>
        </div>
        <div className="landing-footer-links"><strong>Explore</strong><a href="/courses">All courses</a><a href="#how">How it works</a></div>
        <div className="landing-footer-links"><strong>Account</strong><Link to="/setup">Build a learning plan</Link><Link to="/login">Log in</Link></div>
      </div>
      <div className={cx(inset, 'flex flex-wrap justify-between gap-3 border-t border-on-band/10 py-4')}>
        <span className="text-[11px] text-on-band-dim">© 2026 Sawari</span>
        <div className="flex gap-5"><Link to="/privacy" className="text-[11px] text-on-band-dim">Privacy</Link><Link to="/terms" className="text-[11px] text-on-band-dim">Terms</Link></div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const [categories, setCategories] = useState<ApiCatalogCategories['categories']>([])
  const [courses, setCourses] = useState<ApiCatalogPath[]>([])
  const [reviews, setReviews] = useState<LandingReview[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    catalogApi.categories(controller.signal)
      .then((data) => setCategories(data.categories))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false))
    catalogApi.list({ sort: '-enrollments', limit: 100 }, controller.signal)
      .then(async (data) => {
        setCourses(data.items)
        const reviewedCourses = data.items.filter((course) => course.reviewsCount > 0).slice(0, 4)
        const reviewPages = await Promise.all(reviewedCourses.map((course) =>
          catalogApi.reviews(course.slug, { limit: 2 }, controller.signal)
            .then((page) => page.items.map((review) => ({ ...review, courseSubject: course.subject, courseSlug: course.slug })))
            .catch(() => [] as LandingReview[]),
        ))
        setReviews(reviewPages.flat().slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false))
    return () => controller.abort()
  }, [])

  const featuredCourse = courses[0] ?? null

  return (
    <div className="landing-page min-h-screen bg-band text-on-band-muted">
      <Header categories={categories} categoriesLoading={categoriesLoading} />
      <main>
        <section className={cx(sectionBand, 'landing-hero')}>
          <img className="landing-hero-photo" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=90" alt="Learners studying together around a laptop" />
          <div className="landing-purple-shape" aria-hidden="true" />
          <div className={cx(inset, 'landing-hero-inner relative')}>
            <div className="landing-hero-copy">
              <p className={eyebrow}>Free learning, built around you</p>
              <h1 className="mt-3 text-[38px] font-extrabold leading-[1.03] tracking-[-0.04em] text-[#211b2a] sm:text-[52px] xl:text-[62px]">Free courses.<br />Made for your actual schedule.</h1>
              <p className="mt-4 max-w-[470px] text-[16px] leading-relaxed text-[#514a58]">Learn from free courses and resources, organized into a plan that fits the time you have. No subscription. No guessing what to study next.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/setup" className="landing-hero-cta">Join for free</Link>
                <a href="/courses" className="landing-hero-secondary">Browse courses</a>
              </div>
            </div>
          </div>
        </section>
        <div className="landing-trust-band">
          <div className={cx(inset, 'grid gap-3 py-5 sm:grid-cols-3')}>
            <p>✓  Free learning resources</p><p>✓  A plan shaped around your week</p><p>✓  Start without a credit card</p>
          </div>
        </div>
        {coursesLoading ? (
          <section className="landing-featured-section"><div className={cx(inset, 'py-14 sm:py-20')}><p className="landing-facets-message" role="status">Loading the most-enrolled free course…</p></div></section>
        ) : <FeaturedCourse course={featuredCourse} />}
        <CategorySection categories={categories} courses={courses} categoriesLoading={categoriesLoading} />
        <ReviewsSection reviews={reviews} />
        <TimeFitSection />
        <HowItWorks />
        <ClosingCallToAction />
      </main>
      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Footer, Header } from '../components/landing'
import { ReviewComposer } from '../components/catalog/ReviewComposer'
import { catalogApi, type ApiCatalogPathDetail } from '../lib/api'

export function ReviewCoursePage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<ApiCatalogPathDetail | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    catalogApi.get(slug, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setCourse(result) })
      .catch(() => { if (!controller.signal.aborted) setCourse(null) })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    document.title = course ? `Review ${course.subject} | Sawari` : 'Write a course review | Sawari'
  }, [course?.subject])

  const returnToCourse = () => navigate(`/courses/${encodeURIComponent(slug)}`)

  return (
    <div className="landing-page min-h-screen bg-[#faf9f7] text-[#514a58]">
      <Header />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[11px] text-[#918a99]">
          <Link className="font-bold text-[#713bd1] no-underline hover:underline" to={`/courses/${encodeURIComponent(slug)}`}>Course</Link>
          <span aria-hidden="true">/</span><span>Write a review</span>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-9">
          <section className="overflow-hidden rounded-2xl border border-[#e8e4ec] bg-white shadow-[0_10px_30px_rgba(33,27,42,0.05)]">
            <div className="bg-gradient-to-br from-[#f4eaf9] via-[#f8f5fa] to-[#e6f2f4] p-6 sm:p-8">
              <span className="inline-flex rounded-full border border-[#ddc9ef] bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#713bd1]">Learner feedback</span>
              <h1 className="mt-4 text-[30px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#211b2a] sm:text-[38px]">Your experience can help someone choose their next step.</h1>
              <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-[#625c67]">Share what worked, what challenged you, and who you think this course is for.</p>
            </div>

            {course ? (
              <div className="flex items-center gap-4 p-5 sm:p-6">
                <div className="grid h-[72px] w-[96px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f1eaf7] text-[22px] font-extrabold text-[#713bd1]">
                  {course.thumbnailUrl ? <img className="h-full w-full object-cover" src={course.thumbnailUrl} alt="" /> : course.subject.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8b8195]">You’re reviewing</span>
                  <h2 className="mt-1 truncate text-[15px] font-extrabold text-[#30283b]">{course.subject}</h2>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#77717e]">{course.category || 'Free course'}{course.expectedHours ? ` · ${course.expectedHours} hours` : ''}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6"><div className="h-4 w-2/3 animate-pulse rounded-full bg-[#f0edf2]" /><div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-[#f0edf2]" /></div>
            )}

            <div className="border-t border-[#f0edf2] px-5 py-5 sm:px-6">
              <h3 className="text-[12px] font-extrabold text-[#352c40]">A useful review is honest and specific</h3>
              <ul className="mt-3 grid gap-2 text-[11px] leading-5 text-[#6f6876]">
                <li className="flex gap-2"><span className="text-[#713bd1]">✓</span><span>What did you learn or make progress on?</span></li>
                <li className="flex gap-2"><span className="text-[#713bd1]">✓</span><span>How did the lessons fit into your schedule?</span></li>
                <li className="flex gap-2"><span className="text-[#713bd1]">✓</span><span>Who would benefit most from this course?</span></li>
              </ul>
            </div>
          </section>

          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#8b8195]">Your review</p>
                <h2 className="mt-1 text-[21px] font-extrabold tracking-[-0.025em] text-[#211b2a]">How was the course?</h2>
                <p className="mt-1 text-[11px] leading-5 text-[#77717e]">Your rating and comments are shared with other learners.</p>
              </div>
              <Link className="text-[10px] font-bold text-[#713bd1] no-underline hover:underline" to={`/courses/${encodeURIComponent(slug)}`}>Back to course</Link>
            </div>
            <ReviewComposer slug={slug} onSaved={returnToCourse} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

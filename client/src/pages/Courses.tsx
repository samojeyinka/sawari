import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CourseCard } from '../components/catalog/CourseCard'
import { CourseFilters, type CatalogFilters } from '../components/catalog/CourseFilters'
import { CoursePagination } from '../components/catalog/CoursePagination'
import { Footer, Header } from '../components/landing'
import { catalogApi, type ApiCatalogPath } from '../lib/api'
import type { ExperienceLevel } from '../types'
import { useLandingCatalog } from '../components/landing/useLandingCatalog'
import './Courses.css'

const PAGE_SIZE = 9
const sortOptions = [
  { value: 'new', label: 'Newest' },
  { value: 'popular', label: 'Most enrolled' },
  { value: 'rated', label: 'Highest rated' },
  { value: 'az', label: 'A to Z' },
] as const

const apiSort: Record<(typeof sortOptions)[number]['value'], string> = {
  new: '-createdAt',
  popular: '-enrollments',
  rated: '-reviewsAvg',
  az: 'subject',
}

interface CatalogResults {
  items: ApiCatalogPath[]
  meta: { page: number; limit: number; total: number; pages: number }
}

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState<CatalogResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const { categories, courses: catalogCourses } = useLandingCatalog()

  const filters: CatalogFilters = {
    q: searchParams.get('q')?.trim() ?? '',
    category: searchParams.get('category') ?? '',
    tag: searchParams.get('tag') ?? '',
    level: (['beginner', 'some', 'comfortable', 'advanced'].includes(searchParams.get('level') ?? '')
      ? searchParams.get('level')
      : '') as ExperienceLevel | '',
  }
  const sortValue = (sortOptions.some((option) => option.value === searchParams.get('sort'))
    ? searchParams.get('sort')
    : 'new') as (typeof sortOptions)[number]['value']
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const requestKey = JSON.stringify({
    q: filters.q,
    category: filters.category,
    tag: filters.tag,
    level: filters.level,
    sort: apiSort[sortValue],
    page,
    limit: PAGE_SIZE,
  })

  const topics = useMemo(() => {
    const counts = new Map<string, number>()
    catalogCourses.forEach((course) => course.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [catalogCourses])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    catalogApi.list(JSON.parse(requestKey), controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setResults(data)
        if (data.meta.page !== page) {
          const next = new URLSearchParams(searchParams)
          if (data.meta.page > 1) next.set('page', String(data.meta.page))
          else next.delete('page')
          setSearchParams(next, { replace: true })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('We could not load the catalog right now. Please try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [page, requestKey, searchParams, setSearchParams])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const updateFilter = (key: keyof CatalogFilters, value: string) => updateParam(key, value)
  const changePage = (nextPage: number) => updateParam('page', String(nextPage))
  const clearFilters = () => setSearchParams(new URLSearchParams())

  return (
    <div className="landing-page courses-page min-h-screen bg-band text-on-band-muted">
      <Header />
      <main>
        <section className="catalog-intro">
          <div className="catalog-intro-inner">
            <p>Free learning, shaped around your time</p>
            <h1>Find your next course.</h1>
            <div className="catalog-breadcrumbs"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Courses</span></div>
          </div>
        </section>

        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Filter courses">
            <CourseFilters filters={filters} categories={categories} topics={topics} onChange={updateFilter} onClear={clearFilters} />
          </aside>

          <section className="catalog-results" aria-labelledby="catalog-results-title">
            <div className="catalog-results-toolbar">
              <div>
                <p className="catalog-results-kicker">Course catalog</p>
                <h2 id="catalog-results-title">{isLoading ? 'Finding courses for you…' : `We found ${results?.meta.total ?? 0} ${results?.meta.total === 1 ? 'course' : 'courses'} for you`}</h2>
              </div>
              <div className="catalog-results-controls">
                <label htmlFor="catalog-sort">Sort by</label>
                <select id="catalog-sort" value={sortValue} onChange={(event) => updateParam('sort', event.target.value)}>
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <div className="catalog-view-toggle" aria-label="Course layout">
                  <button type="button" className={view === 'grid' ? 'is-active' : ''} aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><span aria-hidden="true">▦</span></button>
                  <button type="button" className={view === 'list' ? 'is-active' : ''} aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><span aria-hidden="true">☰</span></button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="catalog-empty-state" role="alert"><p>{error}</p><button type="button" onClick={() => setSearchParams(new URLSearchParams(searchParams))}>Try again</button></div>
            ) : isLoading ? (
              <div className={`catalog-course-grid catalog-course-grid-${view} catalog-skeleton-grid`} role="status" aria-label="Loading courses" aria-busy="true">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <article className={`catalog-course-skeleton catalog-course-skeleton-${view}`} key={index} aria-hidden="true">
                    <div className="catalog-skeleton-image" />
                    <div className="catalog-skeleton-copy">
                      <div className="catalog-skeleton-line catalog-skeleton-pill" />
                      <div className="catalog-skeleton-line catalog-skeleton-title" />
                      <div className="catalog-skeleton-line catalog-skeleton-description" />
                      <div className="catalog-skeleton-line catalog-skeleton-description catalog-skeleton-description-short" />
                      <div className="catalog-skeleton-line catalog-skeleton-meta" />
                    </div>
                  </article>
                ))}
              </div>
            ) : results?.items.length ? (
              <div className={`catalog-course-grid catalog-course-grid-${view}`}>
                {results.items.map((course) => <CourseCard key={course.slug} course={course} view={view} />)}
              </div>
            ) : (
              <div className="catalog-empty-state"><span aria-hidden="true">⌕</span><h3>No courses match those filters.</h3><p>Try another category or topic, or clear your filters to browse everything.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>
            )}

            {results && !isLoading && <CoursePagination page={results.meta.page} pages={results.meta.pages} onPageChange={changePage} />}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

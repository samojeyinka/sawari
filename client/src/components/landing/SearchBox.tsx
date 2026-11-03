import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogApi, type ApiCatalogPath } from '../../lib/api'
import { useLandingCatalog } from './useLandingCatalog'

type SearchSuggestion = {
  id: string
  kind: 'category' | 'tag' | 'course'
  label: string
  href: string
  category?: string
  course?: ApiCatalogPath
}

export function SearchBox({
  className,
}: { className: string }) {
  const navigate = useNavigate()
  const { categories, courses } = useLandingCatalog()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [matchedCourses, setMatchedCourses] = useState<ApiCatalogPath[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const tags = useMemo(() => [...new Set(courses.flatMap((course) => course.tags))], [courses])
  const normalizedQuery = query.trim().toLocaleLowerCase()

  useEffect(() => {
    if (!isOpen || normalizedQuery.length < 2) {
      setMatchedCourses([])
      setIsLoading(false)
      setActiveIndex(-1)
      return
    }
    const controller = new AbortController()
    setMatchedCourses([])
    setIsLoading(false)
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      catalogApi.list({ q: query.trim(), limit: 100 }, controller.signal)
        .then((page) => setMatchedCourses(page.items.filter((course) => course.subject.toLocaleLowerCase().includes(normalizedQuery))))
        .catch(() => setMatchedCourses([]))
        .finally(() => setIsLoading(false))
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isOpen, normalizedQuery, query])

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (normalizedQuery.length < 2) return []
    const categorySuggestions = categories
      .filter((category) => category.name.toLocaleLowerCase().includes(normalizedQuery))
      .map((category): SearchSuggestion => ({
        id: `category-${category.name}`,
        kind: 'category',
        label: category.name,
        href: `/courses?category=${encodeURIComponent(category.name)}`,
        category: `${category.count} ${category.count === 1 ? 'course' : 'courses'}`,
      }))
    const tagSuggestions = tags
      .filter((tag) => tag.toLocaleLowerCase().includes(normalizedQuery))
      .map((tag): SearchSuggestion => ({ id: `tag-${tag}`, kind: 'tag', label: tag, href: `/courses?tag=${encodeURIComponent(tag)}` }))
    const courseSuggestions = matchedCourses
      .map((course): SearchSuggestion => ({
        id: `course-${course.slug}`,
        kind: 'course',
        label: course.subject,
        href: `/courses/${encodeURIComponent(course.slug)}`,
        course,
      }))
    return [...categorySuggestions, ...tagSuggestions, ...courseSuggestions]
  }, [categories, matchedCourses, normalizedQuery, tags])

  const chooseActive = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      window.location.assign(suggestions[activeIndex]!.href)
    }
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsOpen(false)
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    navigate(`/courses${params.size ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className={`landing-search-slot ${className}`}>
      <form action="/courses" method="get" className={`landing-search ${isOpen && normalizedQuery.length >= 2 ? 'is-active' : ''}`} role="search" onSubmit={submitSearch}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><circle cx="10.8" cy="10.8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>
        <input
          name="q"
          aria-label="Search courses, categories, or topics"
          aria-autocomplete="list"
          aria-expanded={isOpen && normalizedQuery.length >= 2}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          placeholder="Search courses, skills, or topics"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={chooseActive}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 140)}
        />
        {query && <button className="landing-search-clear" type="button" aria-label="Clear search" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(''); setIsOpen(true); setActiveIndex(-1) }}>×</button>}
        <button className="landing-search-submit" type="submit">Search</button>
      </form>
      {isOpen && normalizedQuery.length >= 2 && (
        <div className="landing-search-results" id={listId} role="listbox" aria-label="Search suggestions">
          {isLoading && <div className="landing-search-status" role="status"><span className="landing-search-spinner" />Searching the catalog…</div>}
          {!isLoading && suggestions.length === 0 && <div className="landing-search-status">No matching courses, categories, or topics. <span>Press Enter to search all courses.</span></div>}
          {suggestions.map((suggestion, index) => (
            <a
              className={`landing-search-result landing-search-result-${suggestion.kind}${index === activeIndex ? ' is-highlighted' : ''}`}
              href={suggestion.href}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              key={suggestion.id}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                setIsOpen(false)
                if (suggestion.kind !== 'course') {
                  event.preventDefault()
                  navigate(suggestion.href)
                }
              }}
            >
              {suggestion.kind === 'category' ? (
                <svg className="landing-search-kind-icon" aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><circle cx="10.8" cy="10.8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>
              ) : suggestion.kind === 'tag' ? (
                <span className="landing-search-hash" aria-hidden="true">#</span>
              ) : (
                <span className="landing-search-course-image">{suggestion.course?.thumbnailUrl ? <img src={suggestion.course.thumbnailUrl} alt="" loading="lazy"/> : <span aria-hidden="true">{suggestion.label.charAt(0)}</span>}</span>
              )}
              {suggestion.kind === 'course' ? (
                <span className="landing-search-course-copy">
                  <strong>{suggestion.label}</strong>
                  <small>
                    {suggestion.course?.expectedHours ? `${suggestion.course.expectedHours} hrs` : suggestion.course?.expectedWeeks ? `${suggestion.course.expectedWeeks} weeks` : 'Course'}
                    <span aria-hidden="true">·</span>{suggestion.course?.reviewsCount ?? 0} reviews
                    <span className="landing-search-stars" aria-label={`${suggestion.course?.reviewsAvg ?? 0} out of 5 stars`}>{suggestion.course?.reviewsAvg ? `★ ${suggestion.course.reviewsAvg.toFixed(1)}` : '☆ New'}</span>
                  </small>
                </span>
              ) : (
                <span className="landing-search-text"><strong>{suggestion.label}</strong>{suggestion.category && <small>{suggestion.category}</small>}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

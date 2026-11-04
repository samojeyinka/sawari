import { useEffect, useState, type FormEvent } from 'react'
import type { ApiCatalogFacet } from '../../lib/api'
import type { ExperienceLevel } from '../../types'

export interface CatalogFilters {
  q: string
  category: string
  tag: string
  level: ExperienceLevel | ''
}

interface CourseFiltersProps {
  filters: CatalogFilters
  categories: ApiCatalogFacet[]
  topics: ApiCatalogFacet[]
  onChange: (key: keyof CatalogFilters, value: string) => void
  onClear: () => void
}

const levels: { value: ExperienceLevel | ''; label: string }[] = [
  { value: '', label: 'Any level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'some', label: 'Some experience' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'advanced', label: 'Advanced' },
]

export function CourseFilters({ filters, categories, topics, onChange, onClear }: CourseFiltersProps) {
  const [search, setSearch] = useState(filters.q)
  const [filtersOpen, setFiltersOpen] = useState(() =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches,
  )
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showAllTopics, setShowAllTopics] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const syncOpenState = () => setFiltersOpen(desktop.matches)
    syncOpenState()
    desktop.addEventListener('change', syncOpenState)
    return () => desktop.removeEventListener('change', syncOpenState)
  }, [])

  useEffect(() => setSearch(filters.q), [filters.q])

  const visibleCategories = showAllCategories || (filters.category && !categories.slice(0, 7).some((item) => item.name === filters.category))
    ? categories
    : categories.slice(0, 7)
  const visibleTopics = showAllTopics || (filters.tag && !topics.slice(0, 7).some((item) => item.name === filters.tag))
    ? topics
    : topics.slice(0, 7)
  const hasActiveFilters = Boolean(filters.q || filters.category || filters.tag || filters.level)

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onChange('q', search.trim())
  }

  return (
    <>
    <details className="catalog-filters" open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
      <summary>
        <span>Filter courses</span>
        <svg className="catalog-filter-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="catalog-filters-body">
        <form className="catalog-filter-search" onSubmit={submitSearch} role="search">
          <label htmlFor="catalog-filter-query">Search</label>
          <div><input id="catalog-filter-query" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses…" /><button type="submit" aria-label="Search courses"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.2 4.2"/></svg></button></div>
        </form>

        <fieldset className="catalog-filter-group">
          <legend>Course categories</legend>
          <label className="catalog-filter-option"><input type="radio" name="catalog-category" checked={!filters.category} onChange={() => onChange('category', '')} /><span>All categories</span><small>{categories.reduce((sum, facet) => sum + facet.count, 0)}</small></label>
          {visibleCategories.map((category) => (
            <label className="catalog-filter-option" key={category.name}>
              <input type="radio" name="catalog-category" checked={filters.category === category.name} onChange={() => onChange('category', category.name)} />
              <span>{category.name}</span><small>{category.count}</small>
            </label>
          ))}
          {categories.length > 7 && (
            <button className="catalog-see-more" type="button" aria-expanded={showAllCategories} onClick={() => setShowAllCategories((expanded) => !expanded)}>
              {showAllCategories ? 'See fewer categories' : `See more categories (${categories.length})`}
            </button>
          )}
        </fieldset>

        <fieldset className="catalog-filter-group">
          <legend>Topics and tags</legend>
          <label className="catalog-filter-option"><input type="radio" name="catalog-topic" checked={!filters.tag} onChange={() => onChange('tag', '')} /><span>All topics</span></label>
          {visibleTopics.map((topic) => (
            <label className="catalog-filter-option" key={topic.name}>
              <input type="radio" name="catalog-topic" checked={filters.tag === topic.name} onChange={() => onChange('tag', topic.name)} />
              <span>{topic.name}</span><small>{topic.count}</small>
            </label>
          ))}
          {topics.length > 7 && (
            <button className="catalog-see-more" type="button" aria-expanded={showAllTopics} onClick={() => setShowAllTopics((expanded) => !expanded)}>
              {showAllTopics ? 'See fewer topics' : `See more topics (${topics.length})`}
            </button>
          )}
        </fieldset>

        <fieldset className="catalog-filter-group">
          <legend>Experience level</legend>
          {levels.map((level) => (
            <label className="catalog-filter-option" key={level.value || 'all'}>
              <input type="radio" name="catalog-level" checked={filters.level === level.value} onChange={() => onChange('level', level.value)} />
              <span>{level.label}</span>
            </label>
          ))}
        </fieldset>

      </div>
    </details>
    {hasActiveFilters && <button className="catalog-clear-filters" type="button" onClick={onClear}>Clear all filters</button>}
    </>
  )
}

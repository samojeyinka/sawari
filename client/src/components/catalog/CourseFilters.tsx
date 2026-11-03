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

  useEffect(() => setSearch(filters.q), [filters.q])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onChange('q', search.trim())
  }

  return (
    <details className="catalog-filters" open>
      <summary>Filter courses <span aria-hidden="true">⌄</span></summary>
      <div className="catalog-filters-body">
        <form className="catalog-filter-search" onSubmit={submitSearch} role="search">
          <label htmlFor="catalog-filter-query">Search</label>
          <div><input id="catalog-filter-query" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses…" /><button type="submit" aria-label="Search courses"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.2 4.2"/></svg></button></div>
        </form>

        <fieldset className="catalog-filter-group">
          <legend>Course categories</legend>
          <label className="catalog-filter-option"><input type="radio" name="catalog-category" checked={!filters.category} onChange={() => onChange('category', '')} /><span>All categories</span><small>{categories.reduce((sum, facet) => sum + facet.count, 0)}</small></label>
          {categories.map((category) => (
            <label className="catalog-filter-option" key={category.name}>
              <input type="radio" name="catalog-category" checked={filters.category === category.name} onChange={() => onChange('category', category.name)} />
              <span>{category.name}</span><small>{category.count}</small>
            </label>
          ))}
        </fieldset>

        <fieldset className="catalog-filter-group">
          <legend>Topics and tags</legend>
          <label className="catalog-filter-option"><input type="radio" name="catalog-topic" checked={!filters.tag} onChange={() => onChange('tag', '')} /><span>All topics</span></label>
          {topics.map((topic) => (
            <label className="catalog-filter-option" key={topic.name}>
              <input type="radio" name="catalog-topic" checked={filters.tag === topic.name} onChange={() => onChange('tag', topic.name)} />
              <span>#{topic.name}</span><small>{topic.count}</small>
            </label>
          ))}
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

        {(filters.q || filters.category || filters.tag || filters.level) && (
          <button className="catalog-clear-filters" type="button" onClick={onClear}>Clear all filters</button>
        )}
      </div>
    </details>
  )
}

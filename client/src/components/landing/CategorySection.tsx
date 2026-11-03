import { cx } from '../../lib/utils'
import { heading, eyebrow, paragraph, inset, sectionBand } from './landing.constants'
import { useLandingCatalog } from './useLandingCatalog'

export function CategorySection() {
  const { categories, courses, isLoading: categoriesLoading } = useLandingCatalog()
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

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarMenu } from '../ui/AvatarMenu'
import { Logo } from '../ui/Logo'
import { Modal } from '../ui/Modal'
import { cx } from '../../lib/utils'
import { useApp } from '../../state/store'
import { SearchBox } from './SearchBox'
import { inset } from './landing.constants'
import { useLandingCatalog } from './useLandingCatalog'

export function Header() {
  const { state, signOut } = useApp()
  const [exploreOpen, setExploreOpen] = useState(false)
  const { categories, isLoading: categoriesLoading } = useLandingCatalog()
  const topCategories = categories.slice(0, 5)

  return (
    <header className="landing-header sticky top-0 z-40">
      <div className="landing-topline">
        <div className={cx(inset, 'flex h-9 items-center justify-between gap-4')}>
          <span className="hidden sm:block">Free courses. A plan built around your week.</span>
          <span className="sm:hidden">Free learning, on your time.</span>
          <span className="hidden items-center gap-3 md:flex">
            <Link to="/courses">Explore courses</Link><span aria-hidden="true">·</span><Link to="/#how">How Sawari works</Link>
          </span>
        </div>
      </div>
      <div className="landing-mainnav">
        <div className={cx(inset, 'flex min-h-[76px] items-center gap-5 lg:gap-8')}>
          <Link to="/" aria-label="Sawari home" className="shrink-0"><Logo /></Link>
          <SearchBox className="hidden min-w-0 flex-1 sm:block" />
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
            <Link key={category.name} to={`/courses?category=${encodeURIComponent(category.name)}`}>{category.name}</Link>
          ))}
          <Link className="landing-how-link" to="/#how">How it works</Link>
          <SearchBox className="landing-mobile-search" />
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
              <Link className="landing-topic-link" key={category.name} to={`/courses?category=${encodeURIComponent(category.name)}`}>
                <span>{category.name}</span><small>{category.count} {category.count === 1 ? 'course' : 'courses'}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="landing-facets-message">No published categories yet. <a href="/courses">Browse the course catalog</a></div>
        )}
      </Modal>
    </header>
  )
}

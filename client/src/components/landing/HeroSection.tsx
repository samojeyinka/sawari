import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'
import { eyebrow, inset, sectionBand } from './landing.constants'

export function HeroSection() {
  return (
    <section className={cx(sectionBand, 'landing-hero')}>
      <img className="landing-hero-photo" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=90" alt="Learners studying together around a laptop" />
      <div className="landing-purple-shape" aria-hidden="true" />
      <div className={cx(inset, 'landing-hero-inner relative')}>
        <div className="landing-hero-copy">
          <p className={eyebrow}>Free learning, built around you</p>
          <h1 className="mt-3 text-[38px] font-extrabold leading-[1.03] tracking-[-0.04em] text-[#211b2a] sm:text-[52px] xl:text-[62px]">Free courses.<br />Made for your actual schedule.</h1>
          <p className="mt-4 max-w-[470px] text-[16px] leading-relaxed text-[#514a58]">Learn from free courses and resources, organized into a plan that fits the time you have. No subscription. No guessing what to study next.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/setup" className="landing-hero-cta">Build my learning path</Link>
            <Link to="/courses" className="landing-hero-secondary">Browse courses</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

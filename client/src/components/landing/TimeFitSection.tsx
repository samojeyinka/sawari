import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'
import { heading, eyebrow, paragraph, inset, sectionBand } from './landing.constants'

export function TimeFitSection() {
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

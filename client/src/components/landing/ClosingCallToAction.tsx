import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'
import { heading, eyebrow, inset } from './landing.constants'

export function ClosingCallToAction() {
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

import { cx } from '../../lib/utils'
import { heading, eyebrow, inset, sectionBand } from './landing.constants'

const steps = [
  ['01', 'Choose a goal', 'Pick a course or tell Sawari what skill you want to build.'],
  ['02', 'Set your available time', 'Choose a pace that fits the hours you can give each week.'],
  ['03', 'Learn, practise, continue', 'Follow the next session, practise what you learned, and keep moving.'],
]
export function HowItWorks() {
  return (
    <section id="how" className={cx(sectionBand, 'scroll-mt-[155px] bg-white')}>
      <div className={cx(inset, 'py-14 sm:py-20')}>
        <div className="max-w-[760px]">
          <p className={eyebrow}>How Sawari works</p>
          <h2 className={cx(heading, 'mt-3 text-[30px] sm:text-[42px]')}>Less searching. More learning.</h2>
        </div>
        <div className="landing-steps-grid">
          {steps.map(([number, title, copy]) => (
            <article className="landing-step-card" key={number}>
              <span>{number}</span><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

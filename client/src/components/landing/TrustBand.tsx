import { cx } from '../../lib/utils'
import { inset } from './landing.constants'

export function TrustBand() {
  return (
    <div className="landing-trust-band">
      <div className={cx(inset, 'grid gap-3 py-5 sm:grid-cols-3')}>
        <p>✓  Free learning resources</p><p>✓  A plan shaped around your week</p><p>✓  Start without a credit card</p>
      </div>
    </div>
  )
}

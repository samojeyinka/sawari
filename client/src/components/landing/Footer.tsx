import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { cx } from '../../lib/utils'
import { inset } from './landing.constants'

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className={cx(inset, 'grid gap-8 py-10 sm:grid-cols-[1.5fr_1fr_1fr]')}>
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-on-band-dim">Free learning resources organized into a path that fits your time.</p>
        </div>
        <div className="landing-footer-links"><strong>Explore</strong><Link to="/courses">All courses</Link><Link to="/#how">How it works</Link></div>
        <div className="landing-footer-links"><strong>Account</strong><Link to="/setup">Build a learning plan</Link><Link to="/login">Log in</Link></div>
      </div>
      <div className={cx(inset, 'flex flex-wrap justify-between gap-3 border-t border-on-band/10 py-4')}>
        <span className="text-[11px] text-on-band-dim">© 2026 Sawari</span>
        <div className="flex gap-5"><Link to="/privacy" className="text-[11px] text-on-band-dim">Privacy</Link><Link to="/terms" className="text-[11px] text-on-band-dim">Terms</Link></div>
      </div>
    </footer>
  )
}

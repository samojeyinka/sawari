import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'

type Tone = 'cream' | 'band' | 'ghost-on-band'

const tones: Record<Tone, string> = {
  cream: 'bg-cream text-band hover:bg-white',
  band: 'bg-band text-on-band hover:bg-ink',
  'ghost-on-band': 'border border-on-band/30 text-on-band hover:border-on-band/70',
}

const heights = {
  sm: 'h-8 text-[13px]',
  md: 'h-10 text-sm',
  lg: 'h-12 text-sm',
}

/**
 * Kinetic call-to-action. The label rolls up into a twin copy on hover.
 * The twin is drawn with CSS (attr(data-label)) so the accessible text
 * stays a single clean label.
 */
export function KineticLink({
  to,
  children,
  tone = 'band',
  size = 'md',
  uppercase = true,
  className,
}: {
  to: string
  children: string
  tone?: Tone
  size?: keyof typeof heights
  uppercase?: boolean
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cx(
        'kinetic justify-center px-5 font-bold tracking-wide transition-colors duration-150',
        uppercase && 'uppercase',
        heights[size],
        tones[tone],
        className,
      )}
    >
      <span className="kinetic-track">
        <span className={heights[size]}>{children}</span>
        <span
          className={cx('kinetic-ghost', heights[size])}
          data-label={children}
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}

import { cx } from '../../lib/utils'

/**
 * The block that wipes across a button from the left on hover, as on
 * render.com. The button needs `group relative overflow-hidden`; the label
 * needs `relative` so it stays above the wipe.
 */
export function Sweep({ tone = 'accent' }: { tone?: 'accent' | 'soft' }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'absolute inset-0 origin-left scale-x-0 transition-transform duration-[350ms] ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100',
        tone === 'accent' ? 'bg-accent-bright' : 'bg-on-band/10',
      )}
    />
  )
}

import { cx } from '../../lib/utils'

/** Sawari logo. Uses the brand mark from public/logo.png. */
export function Logo({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const heights = {
    sm: 'h-5',
    md: 'h-6',
    lg: 'h-8',
  }
  return <img src="/logo.png" alt="Sawari" className={cx('w-auto', heights[size], className)} />
}

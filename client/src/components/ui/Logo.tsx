import { cx } from '../../lib/utils'

/** Sawari wordmark. The mark is an open arc, drawn as a single stroke. */
export function Logo({
  size = 'md',
  tone = 'ink',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'ink' | 'on-band'
  className?: string
}) {
  const sizes = {
    sm: 'text-[15px] gap-1.5',
    md: 'text-[17px] gap-2',
    lg: 'text-xl gap-2.5',
  }
  const marks = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center font-semibold',
        tone === 'ink' ? 'text-ink' : 'text-on-band',
        sizes[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={marks[size]}
        aria-hidden="true"
      >
        <path
          d="M3.5 17.5a8.5 8.5 0 0 1 17 0"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17.5" r="2" fill="currentColor" />
      </svg>
      Sawari
    </span>
  )
}

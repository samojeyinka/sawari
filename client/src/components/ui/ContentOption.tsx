import type { ReactNode } from 'react'
import { cx } from '../../lib/utils'

/**
 * Pressable content option used inside the app: square, hairline, accent when
 * chosen. Shared by the preferences modal and anything else that needs the
 * same idiom without pulling in the setup flow's own primitives.
 */
export function ContentOption({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'flex items-center border px-3.5 py-2.5 text-[13.5px] transition-colors',
        selected
          ? 'border-accent-bright bg-accent-bright/10 text-on-band'
          : 'border-on-band/15 text-on-band-muted hover:border-on-band/35 hover:text-on-band',
        className,
      )}
    >
      {children}
    </button>
  )
}

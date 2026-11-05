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
        'flex items-center rounded-xl border px-3.5 py-2.5 text-[12.5px] font-bold transition-colors',
        selected
          ? 'border-accent-bright/45 bg-accent-soft text-accent-strong'
          : 'border-line-strong bg-white text-on-band-muted hover:border-accent-bright/50 hover:text-on-band',
        className,
      )}
    >
      {children}
    </button>
  )
}

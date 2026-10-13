import type { ReactNode } from 'react'
import type { SectionStatus } from '../../types'
import { cx } from '../../lib/utils'

/**
 * Selectable option used in the setup flow. Square-cornered with a hairline
 * border and a small cell as the selection mark — no glyphs, so it reads as
 * part of the same system as the public pages.
 */
export function ChoiceCard({
  selected,
  onClick,
  label,
  description,
  disabled = false,
}: {
  selected: boolean
  onClick: () => void
  label: ReactNode
  description?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-start gap-4 border px-4 py-4 text-left transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-60',
        selected
          ? 'border-accent-bright bg-accent-bright/10'
          : 'border-on-band/15 hover:border-on-band/35 hover:bg-on-band/[0.03]',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'mt-1 h-3.5 w-3.5 shrink-0 border transition-colors',
          selected ? 'border-accent-bright bg-accent-bright' : 'border-on-band/30',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] text-on-band">{label}</span>
        {description && (
          <span className="mt-1 block text-[13px] leading-relaxed text-on-band-dim">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}

const statusStyles: Record<SectionStatus, string> = {
  completed: 'text-success-bright',
  current: 'text-accent-bright',
  upcoming: 'text-on-band-dim',
  locked: 'text-on-band-dim',
}

const statusLabels: Record<SectionStatus, string> = {
  completed: 'Complete',
  current: 'Current',
  upcoming: 'Upcoming',
  locked: 'Locked',
}

/** The section's state as a word, in mono — a dot or a tick would be noise. */
export function StatusBadge({ status, className }: { status: SectionStatus; className?: string }) {
  return (
    <span
      className={cx(
        'font-mono text-[10.5px] uppercase tracking-[0.08em]',
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

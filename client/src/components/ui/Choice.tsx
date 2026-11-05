import type { ReactNode } from 'react'
import type { SectionStatus } from '../../types'
import { cx } from '../../lib/utils'

/**
 * Selectable option used in the setup flow. Soft corners and a quiet radio
 * mark keep the choices clear without making each step feel like a dashboard.
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
        'flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow] duration-150',
        'disabled:pointer-events-none disabled:opacity-60',
        selected
          ? 'border-accent-bright/45 bg-accent-bright/[0.05] shadow-[0_0_0_2px_rgba(113,59,209,.04)]'
          : 'border-line bg-white hover:border-accent-bright/30 hover:bg-band-soft/40',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors',
          selected ? 'border-accent-bright bg-accent-bright' : 'border-line-strong bg-white',
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-on-band">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-on-band-dim">
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
        'text-[10px] font-extrabold uppercase tracking-[0.09em]',
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

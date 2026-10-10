import type { ReactNode } from 'react'
import { LuCheck } from 'react-icons/lu'
import type { SectionStatus } from '../../types'
import { cx } from '../../lib/utils'

/** Selectable option used in the setup flow and practice exercises. */
export function ChoiceCard({
  selected,
  onClick,
  label,
  description,
  icon,
  disabled = false,
}: {
  selected: boolean
  onClick: () => void
  label: ReactNode
  description?: string
  icon?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-all duration-150',
        'disabled:opacity-60',
        selected
          ? 'border-accent bg-accent-soft/60 shadow-[0_0_0_1px_var(--color-accent)]'
          : 'border-line bg-panel hover:border-line-strong hover:bg-canvas',
      )}
    >
      {icon && (
        <span
          className={cx(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            selected ? 'bg-accent text-band' : 'bg-canvas-deep text-body',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </span>
      <span
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
          selected ? 'border-accent bg-accent text-band' : 'border-line-strong bg-panel',
        )}
      >
        {selected && <LuCheck className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  )
}

const statusStyles: Record<SectionStatus, { text: string; dot: string }> = {
  completed: { text: 'text-success', dot: 'bg-success' },
  current: { text: 'text-accent-strong', dot: 'bg-accent' },
  upcoming: { text: 'text-muted', dot: 'bg-line-strong' },
  locked: { text: 'text-faint', dot: 'bg-line-strong' },
}

const statusLabels: Record<SectionStatus, string> = {
  completed: 'Completed',
  current: 'Current',
  upcoming: 'Upcoming',
  locked: 'Locked',
}

export function StatusBadge({ status, className }: { status: SectionStatus; className?: string }) {
  const style = statusStyles[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        style.text,
        className,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {statusLabels[status]}
    </span>
  )
}

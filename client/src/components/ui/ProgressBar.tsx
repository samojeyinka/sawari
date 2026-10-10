import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/utils'

export function ProgressBar({
  value,
  tone = 'accent',
  size = 'md',
  className,
}: {
  value: number
  tone?: 'accent' | 'ink' | 'success'
  size?: 'sm' | 'md'
  className?: string
}) {
  const fill =
    tone === 'accent' ? 'bg-accent' : tone === 'success' ? 'bg-success' : 'bg-ink'
  return (
    <div
      className={cx(
        'w-full overflow-hidden rounded-full bg-canvas-deep',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx('bar-fill h-full rounded-full', fill)} style={{ width: `${value}%` }} />
    </div>
  )
}

export function Chip({
  selected = false,
  children,
  className,
  ...rest
}: {
  selected?: boolean
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'rounded-lg border px-3 py-2 text-sm transition-all duration-150',
        selected
          ? 'border-accent bg-accent-soft text-accent-strong font-medium'
          : 'border-line bg-panel text-body hover:border-line-strong hover:bg-canvas',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-line-strong',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-panel shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-muted">{hint}</p>}
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line bg-panel px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint ' +
  'transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 ' +
  'hover:border-line-strong'

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
        'rounded-full border px-3.5 py-2 text-[12px] font-bold transition-colors duration-150',
        selected
          ? 'border-accent-bright/40 bg-accent-soft text-accent-strong'
          : 'border-line-strong bg-white text-on-band-muted hover:border-accent-bright/50 hover:text-on-band',
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
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors duration-200',
        checked ? 'border-transparent bg-accent-bright' : 'border-line-strong bg-canvas-deep',
      )}
    >
      <span
        className={cx(
          'h-5 w-5 rounded-full transition-transform duration-200',
          checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white shadow-sm',
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
        className="block text-[12px] font-bold text-on-band"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-on-band-dim">{hint}</p>}
      {error && <p className="text-[13px] text-danger-bright">{error}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[13px] text-on-band placeholder:text-on-band-dim ' +
  'transition-colors hover:border-accent-bright/40 focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/15'

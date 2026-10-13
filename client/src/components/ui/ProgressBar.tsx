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
        'w-full overflow-hidden bg-canvas-deep',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx('bar-fill h-full', fill)} style={{ width: `${value}%` }} />
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
        'border px-3 py-2 text-sm transition-colors duration-150',
        selected
          ? 'border-accent-bright/60 bg-accent-bright/10 font-medium text-on-band'
          : 'border-on-band/20 text-on-band-muted hover:border-on-band/45 hover:text-on-band',
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
        'relative inline-flex h-6 w-11 shrink-0 items-center border px-0.5 transition-colors duration-200',
        checked ? 'border-transparent bg-accent-bright' : 'border-on-band/20 bg-transparent',
      )}
    >
      <span
        className={cx(
          'h-5 w-5 transition-transform duration-200',
          checked ? 'translate-x-5 bg-band' : 'translate-x-0 bg-on-band-dim',
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
        className="block text-sm font-medium text-on-band"
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
  'w-full border border-on-band/20 bg-band-soft px-4 py-3 text-[15px] text-on-band placeholder:text-on-band-dim ' +
  'transition-colors hover:border-on-band/35 focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/20'

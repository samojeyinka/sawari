import type { ReactNode } from 'react'
import { cx } from '../../lib/utils'

export function Page({
  children,
  className,
  width = 'default',
}: {
  children: ReactNode
  className?: string
  width?: 'default' | 'wide' | 'narrow'
}) {
  const widths = {
    default: 'max-w-5xl',
    wide: 'max-w-6xl',
    narrow: 'max-w-3xl',
  }
  return (
    <div
      className={cx(
        'mx-auto w-full px-5 pb-16 pt-8 sm:px-8 sm:pt-12',
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band sm:text-[32px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-on-band-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

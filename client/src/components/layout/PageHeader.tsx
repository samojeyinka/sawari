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
    <div className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent-bright">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.06] tracking-[-0.045em] text-on-band sm:text-[38px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-on-band-muted sm:text-[14px]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

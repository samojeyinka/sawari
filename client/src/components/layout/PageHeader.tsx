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
    <div className={cx('mx-auto w-full px-5 pb-16 pt-6 sm:px-8 sm:pt-10', widths[width], className)}>
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
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-accent">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

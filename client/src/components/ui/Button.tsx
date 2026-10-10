import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LuLoaderCircle } from 'react-icons/lu'
import { cx } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-band hover:bg-ink-soft border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  secondary: 'bg-panel text-ink border border-line hover:border-line-strong hover:bg-canvas',
  ghost: 'bg-transparent text-body border border-transparent hover:bg-canvas hover:text-ink',
  accent: 'bg-accent text-band border border-transparent hover:bg-accent-strong',
  danger: 'bg-panel text-danger border border-line hover:border-danger/40 hover:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <LuLoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

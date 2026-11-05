import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LuLoaderCircle } from 'react-icons/lu'
import { Sweep } from './Sweep'
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
    'group relative overflow-hidden rounded-full bg-[#51249c] text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] ' +
    'transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.25)]',
  secondary: 'rounded-full border border-line-strong bg-white text-on-band-muted hover:border-accent-bright/50 hover:text-accent-bright',
  ghost: 'rounded-full text-on-band-muted hover:bg-band-soft hover:text-on-band',
  accent:
    'rounded-full bg-[#51249c] text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] ' +
    'transition-[transform,box-shadow] hover:-translate-y-px hover:bg-[#6130ae] hover:shadow-[0_8px_20px_rgba(113,59,209,.25)]',
  danger: 'rounded-full border border-danger/25 bg-white text-danger hover:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[12px] gap-1.5',
  md: 'h-11 px-5 text-[13px] gap-2',
  lg: 'h-12 px-6 text-[13px] gap-2',
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
        'inline-flex items-center justify-center font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bright/20',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {variant === 'primary' && <Sweep />}
      {loading && <LuLoaderCircle className="relative h-4 w-4 animate-spin" />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

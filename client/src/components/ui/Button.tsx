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
  primary: 'group relative overflow-hidden bg-on-band text-band hover:bg-white',
  secondary: 'border border-on-band/20 text-on-band hover:border-on-band/45',
  ghost: 'text-on-band-dim hover:text-on-band',
  accent: 'bg-accent-bright text-band hover:bg-accent-bright/85',
  danger: 'border border-danger-bright/40 text-danger-bright hover:bg-danger-bright/10',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[14.5px] gap-2',
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
        'inline-flex items-center justify-center font-medium transition-colors duration-150',
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

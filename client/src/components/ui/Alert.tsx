import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert,
  LuX,
} from 'react-icons/lu'
import { cx } from '../../lib/utils'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface VariantStyle {
  icon: IconComponent
  container: string
  accent: string
}

const styles: Record<AlertVariant, VariantStyle> = {
  success: {
    icon: LuCircleCheck,
    container: 'border-success/35 bg-success-soft',
    accent: 'text-success',
  },
  error: {
    icon: LuCircleAlert,
    container: 'border-danger/35 bg-danger-soft',
    accent: 'text-danger',
  },
  warning: {
    icon: LuTriangleAlert,
    container: 'border-warn/35 bg-warn-soft',
    accent: 'text-warn',
  },
  info: {
    icon: LuInfo,
    container: 'border-accent/35 bg-accent-soft',
    accent: 'text-accent',
  },
}

export interface AlertProps {
  variant?: AlertVariant
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  onClose?: () => void
  className?: string
}

export function Alert({
  variant = 'info',
  title,
  children,
  action,
  onClose,
  className,
}: AlertProps) {
  const style = styles[variant]
  const Icon = style.icon

  return (
    <div
      role="alert"
      className={cx(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-[14px] leading-snug',
        'shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur',
        style.container,
        className,
      )}
    >
      <Icon className={cx('mt-px h-[18px] w-[18px] shrink-0', style.accent)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cx('text-body', title ? 'mt-0.5' : null)}>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className={cx('-mr-1 -mt-0.5 shrink-0 rounded-md p-1 transition-opacity hover:opacity-70', style.accent)}
        >
          <LuX className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

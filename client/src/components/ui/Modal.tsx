import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  hideClose?: boolean
  className?: string
}

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose = false,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade bg-band-deep/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'app-theme relative w-full animate-pop rounded-[24px] bg-panel',
          'max-h-[92vh] overflow-y-auto',
          'border border-line shadow-[0_24px_70px_rgba(29,19,40,.2)]',
          className,
          sizes[size],
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              {title && (
                <h2 className="font-display text-[18px] font-extrabold tracking-[-0.03em] text-on-band">{title}</h2>
              )}
              {description && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-on-band-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-line-strong bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-on-band-dim transition-colors hover:border-accent-bright/50 hover:text-accent-bright"
              >
                Close
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

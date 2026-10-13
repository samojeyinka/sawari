import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  title?: string
  children: ReactNode
}

export function Drawer({ open, onClose, side = 'right', title, children }: DrawerProps) {
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade bg-band-deep/70" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'app-theme absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-band-deep',
          side === 'right'
            ? 'right-0 animate-slide-right border-l'
            : 'left-0 animate-slide-left border-r',
          'border-on-band/15',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-on-band/10 px-5 py-4">
          <h2 className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim transition-colors hover:text-on-band"
          >
            Close
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

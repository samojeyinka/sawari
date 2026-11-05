import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LuX } from 'react-icons/lu'
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
      <div className="absolute inset-0 animate-fade bg-[#211b2a]/35" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-white text-body',
          side === 'right'
            ? 'right-0 animate-slide-right border-l border-line'
            : 'left-0 animate-slide-left border-r border-line',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-[14px] font-extrabold text-on-band">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-on-band-muted transition-colors hover:bg-band-soft hover:text-accent-bright"
          >
            <LuX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

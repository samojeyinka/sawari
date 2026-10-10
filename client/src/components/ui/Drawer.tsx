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
      <div className="absolute inset-0 animate-fade bg-ink/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'app-theme absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-panel',
          side === 'right' ? 'right-0 border-l animate-slide-right' : 'left-0 border-r animate-slide-left',
          'border-line shadow-[0_0_40px_rgba(0,0,0,0.12)]',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

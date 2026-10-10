import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuChevronDown, LuHouse, LuLogOut, LuSettings } from 'react-icons/lu'
import { cx, initials } from '../../lib/utils'

interface AvatarMenuProps {
  name: string
  onSignOut: () => void
}

export function AvatarMenu({ name, onSignOut }: AvatarMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const itemClass =
    'flex items-center gap-3 px-4 py-2.5 text-sm text-on-band-muted transition-colors hover:bg-panel-soft hover:text-on-band'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 text-on-band-muted transition-colors hover:text-on-band"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-on-band text-[11px] font-semibold text-band">
          {initials(name)}
        </span>
        <LuChevronDown className={cx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 animate-fade overflow-hidden border border-on-band/15 bg-panel py-1 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <Link to="/app/today" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <LuHouse className="h-4 w-4" />
            Open my app
          </Link>
          <Link
            to="/app/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <LuSettings className="h-4 w-4" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className={cx(itemClass, 'w-full border-t border-on-band/10')}
          >
            <LuLogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cx, initials } from '../../lib/utils'

interface AvatarMenuProps {
  name: string
  onSignOut: () => void
}

/**
 * The account menu in the public header. Signed-in visitors get one control
 * instead of loose "sign out" / "open my app" links: a square cell holding
 * their initials, matching the page's cell grid, opening onto the account's
 * own name and its three destinations. No icons.
 */
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
    'flex w-full items-center px-4 py-3 text-left text-[13.5px] text-on-band-muted transition-colors hover:bg-accent-bright/15 hover:text-on-band'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center bg-accent-bright font-mono text-[11px] uppercase text-band transition-colors hover:bg-accent-bright/85"
      >
        {initials(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[236px] animate-fade overflow-hidden border border-on-band/20 bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        >
          <p className="truncate border-b border-on-band/10 px-4 py-3 text-[13.5px] text-on-band">
            {name}
          </p>
          <Link to="/app/today" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            Open my app
          </Link>
          <Link
            to="/app/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className={cx(itemClass, 'border-t border-on-band/10')}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

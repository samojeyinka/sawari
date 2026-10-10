import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuCheck, LuChevronsUpDown, LuPlus } from 'react-icons/lu'
import { useApp } from '../../state/store'
import { pathPercent } from '../../data'
import { cx } from '../../lib/utils'

export function PathSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { state, activePath, activatePath } = useApp()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (id: string) => {
    activatePath(id)
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 text-left transition-colors hover:border-line-strong"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {activePath ? activePath.subject : 'No paths yet'}
          </span>
          <span className="block text-xs text-muted">
            {activePath ? `${pathPercent(activePath)}% complete` : 'Create one to start'}
          </span>
        </span>
        <LuChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 animate-rise rounded-lg border border-line bg-panel p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
          {state.paths.map((path) => {
            const pct = pathPercent(path)
            const isActive = path.id === activePath?.id
            return (
              <button
                key={path.id}
                onClick={() => pick(path.id)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-canvas' : 'hover:bg-canvas',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <span className="truncate">{path.subject}</span>
                    {isActive && <LuCheck className="h-3.5 w-3.5 shrink-0 text-accent" />}
                  </span>
                  <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-canvas-deep">
                    <span
                      className="block h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{pct}%</span>
              </button>
            )
          })}

          <div className="my-1.5 border-t border-line" />
          <button
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              navigate('/setup')
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-body transition-colors hover:bg-canvas hover:text-ink"
          >
            <LuPlus className="h-4 w-4" />
            New learning path
          </button>
        </div>
      )}
    </div>
  )
}

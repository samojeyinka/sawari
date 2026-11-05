import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../state/store'
import { pathPercent } from '../../data'
import { monoLabel } from './nav'
import { cx } from '../../lib/utils'
import { LuChevronDown, LuPlus } from 'react-icons/lu'

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
    navigate('/app/path')
  }

  const createPath = () => {
    setOpen(false)
    onNavigate?.()
    navigate('/setup')
  }

  return (
    <div ref={wrap}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="group w-full rounded-2xl border border-line bg-band-soft/70 p-3.5 text-left transition-colors hover:border-accent-bright/30 hover:bg-band-soft"
        >
          <span className="flex items-center justify-between gap-3">
            <span className={cx(monoLabel, 'text-[10px]')}>Your learning path</span>
            <LuChevronDown aria-hidden="true" className={cx('h-4 w-4 text-on-band-dim transition-transform duration-300', open && 'rotate-180')} />
          </span>
          <span className="mt-2 block truncate text-[13px] font-bold text-on-band">
            {activePath ? activePath.subject : 'No paths yet'}
          </span>
          <span className="mt-1 block text-[11px] font-medium text-on-band-dim">
            {activePath ? `${pathPercent(activePath)}% complete` : 'Create a path to start learning'}
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Learning paths"
            className="absolute left-0 right-0 top-full z-40 mt-2 animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-[0_14px_36px_rgba(33,27,42,.14)]"
          >
            {state.paths.map((path) => {
              const pct = pathPercent(path)
              const isActive = path.id === activePath?.id
              return (
                <button
                  key={path.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(path.id)}
                  className={cx(
                    'w-full border-b border-line px-3.5 py-3 text-left transition-colors last:border-b-0',
                    isActive ? 'bg-band-soft' : 'hover:bg-band-soft/70',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cx(
                        'truncate text-[12px] font-bold',
                        isActive ? 'text-accent-bright' : 'text-on-band',
                      )}
                    >
                      {path.subject}
                    </span>
                    <span className={cx(monoLabel, 'shrink-0')}>{pct}%</span>
                  </span>
                  <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-accent-bright transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={createPath}
        className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-line-strong bg-white px-3.5 py-2.5 text-left text-[12px] font-bold text-on-band-muted transition-colors hover:border-accent-bright/50 hover:bg-band-soft hover:text-accent-bright"
      >
        <LuPlus aria-hidden="true" className="h-4 w-4 text-accent-bright" />
        New learning path
      </button>
    </div>
  )
}

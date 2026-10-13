import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../state/store'
import { pathPercent } from '../../data'
import { monoLabel } from './nav'
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
          className="group w-full border border-on-band/15 bg-panel px-3.5 py-3 text-left transition-colors hover:border-on-band/35"
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className={monoLabel}>active path</span>
            <span
              className={cx(
                monoLabel,
                'transition-colors',
                open ? 'text-accent-bright' : 'text-on-band-dim group-hover:text-on-band',
              )}
            >
              {open ? 'close' : 'switch'}
            </span>
          </span>
          <span className="mt-1.5 block truncate text-[13.5px] text-on-band">
            {activePath ? activePath.subject : 'No paths yet'}
          </span>
          <span className={cx(monoLabel, 'mt-1 block')}>
            {activePath ? `${pathPercent(activePath)}% complete` : 'create one to start'}
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Learning paths"
            className="absolute left-0 right-0 top-full z-40 mt-1.5 animate-rise border border-on-band/20 bg-panel"
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
                    'w-full border-b border-on-band/10 px-3.5 py-3 text-left transition-colors last:border-b-0',
                    isActive ? 'bg-on-band/[0.05]' : 'hover:bg-on-band/[0.03]',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cx(
                        'truncate text-[13.5px]',
                        isActive ? 'text-accent-bright' : 'text-on-band',
                      )}
                    >
                      {path.subject}
                    </span>
                    <span className={cx(monoLabel, 'shrink-0')}>{pct}%</span>
                  </span>
                  <span className="mt-2 block h-[3px] w-full bg-on-band/10">
                    <span
                      className="block h-full bg-accent-bright transition-all duration-500"
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
        className="mt-2 w-full border border-dashed border-on-band/25 px-3.5 py-3 text-left text-[13.5px] text-on-band-dim transition-colors hover:border-accent-bright/60 hover:text-on-band"
      >
        <span aria-hidden="true" className="mr-2 font-mono text-accent-bright">
          +
        </span>
        New learning path
      </button>
    </div>
  )
}

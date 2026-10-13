import { useEffect, useRef, useState } from 'react'
import { DayPicker, type ChevronProps } from 'react-day-picker'
import { cx } from '../../lib/utils'

function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function fromISO(iso: string): Date | undefined {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

const fmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' })

const monoNote = 'font-mono text-[10.5px] uppercase tracking-[0.08em]'

/** Matches the setup flow's fields: square, hairline, distinct surface. */
const trigger =
  'flex w-full items-center justify-between gap-3 border border-on-band/20 bg-band-soft px-4 py-3 ' +
  'text-left text-[15px] text-on-band transition-colors duration-150 hover:border-on-band/35 ' +
  'focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/20'

export function DatePickerField({
  value,
  onChange,
  id,
  placeholder = 'Pick a date',
}: {
  value: string
  onChange: (iso: string) => void
  id?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const selected = fromISO(value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (date: Date | undefined) => {
    onChange(date ? toISO(date) : '')
    setOpen(false)
  }

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cx(trigger, !value && 'text-on-band-dim')}
      >
        <span className="truncate">{value && selected ? fmt.format(selected) : placeholder}</span>
        <span className={cx(monoNote, 'shrink-0')}>{value ? 'change' : 'pick'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a date"
          className="absolute left-0 top-full z-40 mt-2 animate-rise border border-on-band/20 bg-panel p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        >
          <DayPicker
            mode="single"
            required={false}
            selected={selected}
            onSelect={pick}
            defaultMonth={selected ?? new Date()}
            locale={{ options: { weekStartsOn: 1 } }}
            components={{ Chevron }}
          />
        </div>
      )}
    </div>
  )
}

/** Month navigation as type, so the flow stays glyph-free. */
function Chevron({ orientation }: ChevronProps) {
  return (
    <span aria-hidden="true" className={cx(monoNote, 'text-[13px] text-on-band-dim')}>
      {orientation === 'left' ? '←' : orientation === 'right' ? '→' : '↓'}
    </span>
  )
}

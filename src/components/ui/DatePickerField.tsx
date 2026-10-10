import { useEffect, useRef, useState } from 'react'
import { DayPicker, type ChevronProps } from 'react-day-picker'
import { LuCalendar, LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { cx } from '../../lib/utils'
import { inputClass } from './ProgressBar'

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
        className={cx(inputClass, 'flex items-center justify-between gap-2 text-left', !value && 'text-faint')}
      >
        <span className="truncate">{value && selected ? fmt.format(selected) : placeholder}</span>
        <LuCalendar className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a date"
          className="absolute left-0 top-full z-40 mt-2 animate-rise rounded-xl border border-line bg-panel p-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
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

function Chevron({ orientation, size = 18 }: ChevronProps) {
  const cls = 'shrink-0 text-muted'
  if (orientation === 'left') return <LuChevronLeft size={size} className={cls} />
  if (orientation === 'right') return <LuChevronRight size={size} className={cls} />
  return <LuChevronDown size={size} className={cls} />
}

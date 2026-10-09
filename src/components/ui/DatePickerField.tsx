import { useEffect, useRef, useState } from 'react'
import { DayPicker, type ChevronProps, type ClassNames } from 'react-day-picker'
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

const classNames: Partial<ClassNames> = {
  root: 'p-1.5',
  months: 'flex flex-col gap-1',
  nav: 'flex items-center justify-between px-0.5',
  button_previous:
    'grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink',
  button_next:
    'grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink',
  month_caption: 'flex-1 text-center',
  caption_label: 'text-sm font-medium text-ink',
  month_grid: 'mt-0.5 w-full border-collapse',
  weekdays: 'flex',
  weekday:
    'flex h-7 flex-1 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted',
  week: 'flex',
  day: 'flex',
  day_button:
    'flex h-7 flex-1 items-center justify-center rounded-md text-[13px] text-body transition-colors duration-100 hover:bg-canvas hover:text-ink disabled:pointer-events-none',
  today: 'font-semibold text-accent',
  outside: 'text-faint',
  disabled: 'opacity-35',
  chevron: 'm-0',
}

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
          className="absolute inset-0 top-full z-40 mt-2 w-full animate-rise rounded-xl border border-line bg-panel p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <DayPicker
            mode="single"
            required={false}
            selected={selected}
            onSelect={pick}
            defaultMonth={selected ?? new Date()}
            locale={{ options: { weekStartsOn: 1 } }}
            classNames={classNames}
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
import { cx } from '../../lib/utils'

export interface TabItem {
  id: string
  label: string
}

export function Tabs({
  items,
  active,
  onChange,
  variant = 'underline',
  className,
}: {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}) {
  if (variant === 'pill') {
    return (
      <div className={cx('inline-flex border border-on-band/15 bg-panel p-1', className)}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-selected={active === item.id}
            className={cx(
              'px-3.5 py-1.5 text-sm transition-colors duration-150',
              active === item.id
                ? 'bg-on-band/[0.07] font-medium text-on-band'
                : 'text-on-band-dim hover:text-on-band',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-on-band/10', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          aria-selected={active === item.id}
          className={cx(
            'relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors duration-150',
            active === item.id
              ? 'font-medium text-on-band'
              : 'text-on-band-dim hover:text-on-band',
          )}
        >
          {item.label}
          <span
            aria-hidden="true"
            className={cx(
              'absolute inset-x-2 -bottom-px h-0.5 transition-colors duration-200',
              active === item.id ? 'bg-accent-bright' : 'bg-transparent',
            )}
          />
        </button>
      ))}
    </div>
  )
}

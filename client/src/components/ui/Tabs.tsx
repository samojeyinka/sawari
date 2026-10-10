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
      <div className={cx('inline-flex rounded-lg border border-line bg-canvas p-1', className)}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cx(
              'rounded-md px-3.5 py-1.5 text-sm transition-all duration-150',
              active === item.id
                ? 'bg-panel text-ink font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cx(
            'relative whitespace-nowrap px-3 py-2.5 text-sm transition-colors duration-150',
            active === item.id
              ? 'font-medium text-ink'
              : 'text-muted hover:text-ink',
          )}
        >
          {item.label}
          <span
            className={cx(
              'absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all duration-200',
              active === item.id ? 'bg-ink opacity-100' : 'opacity-0',
            )}
          />
        </button>
      ))}
    </div>
  )
}

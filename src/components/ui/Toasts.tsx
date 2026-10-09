import { useApp } from '../../state/store'
import { cx } from '../../lib/utils'

export function Toasts() {
  const { state } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'animate-rise rounded-lg border border-on-band/15 bg-band-teal px-4 py-2.5 text-sm text-on-band',
            'shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
          )}
        >
          {toast.text}
        </div>
      ))}
    </div>
  )
}

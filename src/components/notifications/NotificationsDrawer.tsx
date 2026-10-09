import { useApp } from '../../state/store'
import { Drawer } from '../ui/Drawer'
import { cx } from '../../lib/utils'

const kindLabel: Record<string, string> = {
  session: 'Session',
  project: 'Project',
  path: 'Path',
  account: 'Account',
}

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, markRead, markAllRead } = useApp()

  return (
    <Drawer open={open} onClose={onClose} side="right" title="Notifications">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {state.notifications.filter((n) => !n.read).length} new
        </span>
        <button
          onClick={markAllRead}
          className="text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
        >
          Mark all read
        </button>
      </div>

      {state.notifications.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm font-medium text-ink">Nothing here yet</p>
          <p className="mt-1 text-[13px] text-muted">
            Session reminders and project feedback will show up here.
          </p>
        </div>
      ) : (
        <ul>
          {state.notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markRead(n.id)}
                className={cx(
                  'flex w-full gap-3 border-b border-line px-5 py-4 text-left transition-colors hover:bg-canvas',
                  !n.read && 'bg-accent-soft/40',
                )}
              >
                <span
                  className={cx(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    n.read ? 'bg-line-strong' : 'bg-accent',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    <span className="shrink-0 text-xs text-faint">{n.time}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                    {n.body}
                  </span>
                  <span className="mt-1.5 inline-block text-[11px] font-medium uppercase tracking-wide text-faint">
                    {kindLabel[n.kind]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

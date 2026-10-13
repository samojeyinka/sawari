import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const handleClick = (id: string, link?: string | null) => {
    markRead(id)
    if (link) {
      onClose()
      navigate(link)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} side="right" title="Notifications">
      <div className="flex items-center justify-between gap-4 border-b border-on-band/10 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
          {state.notifications.filter((n) => !n.read).length} new
        </span>
        <button
          type="button"
          onClick={markAllRead}
          className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-accent-bright transition-colors hover:text-on-band"
        >
          Mark all read
        </button>
      </div>

      {state.notifications.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-[14px] text-on-band">Nothing here yet</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-band-dim">
            Session reminders and project feedback will show up here.
          </p>
        </div>
      ) : (
        <ul>
          {state.notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n.id, n.link)}
                className={cx(
                  'flex w-full gap-3.5 border-b border-on-band/10 px-5 py-4 text-left transition-colors hover:bg-on-band/[0.03]',
                  !n.read && 'bg-on-band/[0.04]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'mt-1.5 h-2.5 w-2.5 shrink-0 border',
                    n.read ? 'border-on-band/30' : 'border-accent-bright bg-accent-bright',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] text-on-band">{n.title}</span>
                    <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
                      {n.time}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-on-band-muted">
                    {n.body}
                  </span>
                  <span className="mt-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
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

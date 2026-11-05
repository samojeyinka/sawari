import { useNavigate } from 'react-router-dom'
import { LuBell, LuCheck, LuCircle } from 'react-icons/lu'
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
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <span className="text-[11px] font-semibold text-on-band-dim">
          {state.notifications.filter((n) => !n.read).length} unread
        </span>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-accent-bright transition-colors hover:bg-accent-soft"
        >
          <LuCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      {state.notifications.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-band-soft text-accent-bright">
            <LuBell aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="mt-4 text-[14px] font-bold text-on-band">You&apos;re all caught up</p>
          <p className="mt-2 text-[12px] leading-relaxed text-on-band-dim">
            Session reminders and project feedback will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-1 p-3">
          {state.notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n.id, n.link)}
                className={cx(
                  'flex w-full gap-3 rounded-xl px-3.5 py-3.5 text-left transition-colors hover:bg-band-soft/70',
                  !n.read && 'bg-accent-soft/60',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    n.read ? 'bg-white text-on-band-dim' : 'bg-accent-bright text-white',
                  )}
                >
                  {n.read ? <LuCircle className="h-3 w-3" /> : <LuBell className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[12px] font-bold text-on-band">{n.title}</span>
                    <span className="shrink-0 text-[10px] font-medium text-on-band-dim">
                      {n.time}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-on-band-muted">
                    {n.body}
                  </span>
                  <span className="mt-2 block text-[10px] font-bold text-accent-bright">
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

import { NavLink } from 'react-router-dom'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { PathSwitcher } from './PathSwitcher'
import { monoLabel, navClass, navItems } from './nav'
import { cx, initials } from '../../lib/utils'

export function Sidebar({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  const { state, unreadCount } = useApp()
  const user = state.user

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-on-band/10 bg-band-deep lg:flex">
      <div className="flex items-center px-5 py-5">
        <NavLink to="/app/today" aria-label="Sawari home">
          <Logo />
        </NavLink>
      </div>

      <div className="px-4 pb-6">
        <PathSwitcher />
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-on-band/10 py-3">
        <NavLink to="/app/settings" className={({ isActive }) => navClass(isActive)}>
          Settings
        </NavLink>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex w-full items-center justify-between border-l-2 border-transparent px-5 py-2.5 text-[13.5px] text-on-band-dim transition-colors hover:text-on-band"
        >
          Notifications
          {unreadCount > 0 && (
            <span className={cx(monoLabel, 'text-accent-bright')}>{unreadCount}</span>
          )}
        </button>
      </div>

      {user && (
        <NavLink
          to="/app/settings"
          className="flex items-center gap-3 border-t border-on-band/10 px-4 py-4 transition-colors hover:bg-on-band/[0.03]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-bright font-mono text-[11px] uppercase text-band">
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] text-on-band">{user.name}</span>
            <span className={cx(monoLabel, 'block truncate')}>{user.email}</span>
          </span>
        </NavLink>
      )}
    </aside>
  )
}

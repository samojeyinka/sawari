import { NavLink } from 'react-router-dom'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { PathSwitcher } from './PathSwitcher'
import { monoLabel, navClass, navItems } from './nav'
import { cx, initials } from '../../lib/utils'
import { LuBell, LuChevronRight, LuSettings2, LuShieldCheck } from 'react-icons/lu'

export function Sidebar({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  const { state, unreadCount } = useApp()
  const user = state.user

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white px-4 lg:flex">
      <div className="flex h-[76px] items-center px-2">
        <NavLink to="/app/today" aria-label="Sawari home">
          <Logo />
        </NavLink>
      </div>

      <div className="pb-6">
        <PathSwitcher />
      </div>

      <nav className="flex-1 space-y-1">
        <p className={cx(monoLabel, 'mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.1em]')}>Workspace</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
            <item.icon aria-hidden="true" className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
            {item.label}
            <LuChevronRight aria-hidden="true" className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line py-4">
        {user?.role === 'admin' && (
          <NavLink to="/app/admin" className={({ isActive }) => navClass(isActive)}>
            <LuShieldCheck aria-hidden="true" className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
            Admin
          </NavLink>
        )}
        <NavLink to="/app/settings" className={({ isActive }) => navClass(isActive)}>
          <LuSettings2 aria-hidden="true" className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
          Settings
        </NavLink>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-on-band-muted transition-colors hover:bg-band-soft hover:text-on-band"
        >
          <LuBell aria-hidden="true" className="h-[17px] w-[17px] shrink-0" strokeWidth={1.9} />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto grid min-h-5 min-w-5 place-items-center rounded-full bg-accent-soft px-1.5 text-[10px] font-extrabold text-accent-strong">{unreadCount}</span>
          )}
        </button>
      </div>

      {user && (
        <NavLink
          to="/app/settings"
          className="flex items-center gap-3 border-t border-line px-1 py-4 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-extrabold text-accent-strong">
            {initials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold text-on-band">{user.name}</span>
            <span className="mt-0.5 block truncate text-[10px] font-medium text-on-band-dim">{user.email}</span>
          </span>
        </NavLink>
      )}
    </aside>
  )
}

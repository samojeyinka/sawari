import { NavLink } from 'react-router-dom'
import { LuBell, LuSettings } from 'react-icons/lu'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { PathSwitcher } from './PathSwitcher'
import { navClass, navItems } from './nav'
import { initials } from '../../lib/utils'

export function Sidebar({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  const { state, unreadCount } = useApp()
  const user = state.user

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-canvas lg:flex">
      <div className="px-5 pb-4 pt-6">
        <NavLink to="/app/today" aria-label="Sawari home">
          <Logo />
        </NavLink>
      </div>

      <div className="px-4">
        <PathSwitcher />
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line px-3 py-3">
        <NavLink
          to="/app/settings"
          className={({ isActive }) => navClass(isActive)}
        >
          <LuSettings className="h-[18px] w-[18px] shrink-0" />
          Settings
        </NavLink>

        <button
          onClick={onOpenNotifications}
          className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-body transition-all duration-150 hover:bg-panel/70 hover:text-ink"
        >
          <span className="relative">
            <LuBell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-band">
                {unreadCount}
              </span>
            )}
          </span>
          Notifications
        </button>

        {user && (
          <NavLink
            to="/app/settings"
            className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-panel/70"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-band">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
              <span className="block truncate text-xs text-muted">{user.email}</span>
            </span>
          </NavLink>
        )}
      </div>
    </aside>
  )
}

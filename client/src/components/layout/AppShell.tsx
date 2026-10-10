import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LuBell, LuLogOut, LuMenu, LuPlus, LuSettings } from 'react-icons/lu'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { Drawer } from '../ui/Drawer'
import { PathSwitcher } from './PathSwitcher'
import { Sidebar } from './Sidebar'
import { navItems, navClass } from './nav'
import { NotificationsDrawer } from '../notifications/NotificationsDrawer'
import { RouteFallback } from '../ui/RouteFallback'
import { initials, cx } from '../../lib/utils'

export function AppShell() {
  const { state, unreadCount, signOut } = useApp()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    setNavOpen(false)
  }, [location.pathname])

  const user = state.user

  return (
    <div className="app-theme min-h-screen bg-band lg:flex">
      <Sidebar onOpenNotifications={() => setNotifOpen(true)} />

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-ink transition-colors hover:bg-canvas"
        >
          <LuMenu className="h-5 w-5" />
        </button>
        <Link to="/app/today" aria-label="Sawari home">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNotifOpen(true)}
            aria-label="Notifications"
            className="relative rounded-lg p-1.5 text-ink transition-colors hover:bg-canvas"
          >
            <LuBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
          {user && (
            <Link
              to="/app/settings"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-band"
              aria-label="Settings"
            >
              {initials(user.name)}
            </Link>
          )}
        </div>
      </header>

      {/* page content */}
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <div key={location.pathname} className="animate-fade">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5">
          {[...navItems, { to: '/app/settings', label: 'Settings', icon: LuSettings }].map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                    isActive ? 'font-medium text-accent' : 'text-muted',
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label === 'Learning path' ? 'Path' : item.label}
              </NavLink>
            ),
          )}
        </div>
      </nav>

      {/* mobile navigation drawer */}
      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" title="Menu">
        <div className="space-y-5 p-5">
          <PathSwitcher onNavigate={() => setNavOpen(false)} />

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-1 border-t border-line pt-4">
            <NavLink
              to="/app/settings"
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              <LuSettings className="h-[18px] w-[18px] shrink-0" />
              Settings
            </NavLink>
            <Link
              to="/setup"
              onClick={() => setNavOpen(false)}
              className={navClass(false)}
            >
              <LuPlus className="h-[18px] w-[18px] shrink-0" />
              New learning path
            </Link>
            <button
              onClick={() => {
                setNavOpen(false)
                signOut()
              }}
              className={cx(navClass(false), 'w-full')}
            >
              <LuLogOut className="h-[18px] w-[18px] shrink-0" />
              Sign out
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-band">
                {initials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
            </div>
          )}
        </div>
      </Drawer>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

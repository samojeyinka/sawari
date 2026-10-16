import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { Drawer } from '../ui/Drawer'
import { PathSwitcher } from './PathSwitcher'
import { Sidebar } from './Sidebar'
import { monoLabel, navClass, navItems } from './nav'
import { NotificationsDrawer } from '../notifications/NotificationsDrawer'
import { RouteFallback } from '../ui/RouteFallback'
import { cx, initials } from '../../lib/utils'

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
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-on-band/10 bg-band-deep/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className={cx(monoLabel, 'transition-colors hover:text-on-band')}
        >
          Menu
        </button>
        <Link to="/app/today" aria-label="Sawari home">
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className={cx(monoLabel, 'transition-colors hover:text-on-band')}
        >
          {unreadCount > 0 ? `Alerts ${unreadCount}` : 'Alerts'}
        </button>
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
        className="fixed inset-x-0 bottom-0 z-30 border-t border-on-band/10 bg-band-deep/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-6">
          {[...navItems, { to: '/app/settings', label: 'Settings', short: 'Settings' }].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'border-t-2 py-3 text-center text-[11px] transition-colors',
                  isActive
                    ? 'border-accent-bright text-on-band'
                    : 'border-transparent text-on-band-dim',
                )
              }
            >
              {item.short}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* mobile navigation drawer */}
      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" title="Menu">
        <div className="space-y-6 p-5">
          <PathSwitcher onNavigate={() => setNavOpen(false)} />

          <nav>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-on-band/10 pt-3">
            {user?.role === 'admin' && (
              <NavLink
                to="/app/admin"
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                Admin
              </NavLink>
            )}
            <NavLink
              to="/app/settings"
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              Settings
            </NavLink>
            <Link to="/setup" onClick={() => setNavOpen(false)} className={navClass(false)}>
              New learning path
            </Link>
            <button
              type="button"
              onClick={() => {
                setNavOpen(false)
                signOut()
              }}
              className={cx(navClass(false), 'w-full')}
            >
              Sign out
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 border-t border-on-band/10 pt-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-bright font-mono text-[11px] uppercase text-band">
                {initials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] text-on-band">{user.name}</span>
                <span className={cx(monoLabel, 'block truncate')}>{user.email}</span>
              </span>
            </div>
          )}
        </div>
      </Drawer>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../state/store'
import { Logo } from '../ui/Logo'
import { Drawer } from '../ui/Drawer'
import { PathSwitcher } from './PathSwitcher'
import { Sidebar } from './Sidebar'
import { navClass, navItems } from './nav'
import { NotificationsDrawer } from '../notifications/NotificationsDrawer'
import { RouteFallback } from '../ui/RouteFallback'
import { cx, initials } from '../../lib/utils'
import { LuBell, LuLogOut, LuMenu, LuPlus, LuSettings2, LuShieldCheck } from 'react-icons/lu'

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
  const mobileNavItems = [...navItems, { to: '/app/settings', label: 'Settings', short: 'Settings', icon: LuSettings2 }]

  return (
    <div className="min-h-screen bg-band text-body lg:flex">
      <Sidebar onOpenNotifications={() => setNotifOpen(true)} />

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-on-band-muted transition-colors hover:bg-band-soft hover:text-accent-bright"
        >
          <LuMenu aria-hidden="true" className="h-5 w-5" />
        </button>
        <Link to="/app/today" aria-label="Sawari home">
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
          className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-on-band-muted transition-colors hover:bg-band-soft hover:text-accent-bright"
        >
          <LuBell aria-hidden="true" className="h-[18px] w-[18px]" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent-bright px-1 text-[9px] font-extrabold text-white">{unreadCount}</span>}
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
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-6 px-1">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'flex min-w-0 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold transition-colors',
                  isActive
                    ? 'text-accent-bright'
                    : 'text-on-band-dim',
                )
              }
            >
              <item.icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.9} />
              <span className="truncate">{item.short}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* mobile navigation drawer */}
      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" title="Menu">
        <div className="space-y-6 p-5">
          <PathSwitcher onNavigate={() => setNavOpen(false)} />

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                <item.icon aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
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
                <LuShieldCheck aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
                Admin
              </NavLink>
            )}
            <NavLink
              to="/app/settings"
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => navClass(isActive)}
            >
              <LuSettings2 aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
              Settings
            </NavLink>
            <Link to="/setup" onClick={() => setNavOpen(false)} className={navClass(false)}>
              <LuPlus aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
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
              <LuLogOut aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
              Sign out
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 border-t border-line pt-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-extrabold text-accent-strong">
                {initials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-bold text-on-band">{user.name}</span>
                <span className="mt-0.5 block truncate text-[10px] font-medium text-on-band-dim">{user.email}</span>
              </span>
            </div>
          )}
        </div>
      </Drawer>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

import type { IconType } from 'react-icons'
import { LuBookmark, LuCalendarDays, LuChartNoAxesCombined, LuFolderKanban, LuRoute } from 'react-icons/lu'

export interface NavItem {
  to: string
  label: string
  /** Short label for the mobile bottom bar. */
  short: string
  icon: IconType
}

export const navItems: NavItem[] = [
  { to: '/app/today', label: 'Today', short: 'Today', icon: LuCalendarDays },
  { to: '/app/path', label: 'Learning path', short: 'Path', icon: LuRoute },
  { to: '/app/saved', label: 'Saved', short: 'Saved', icon: LuBookmark },
  { to: '/app/projects', label: 'Projects', short: 'Projects', icon: LuFolderKanban },
  { to: '/app/progress', label: 'Progress', short: 'Progress', icon: LuChartNoAxesCombined },
]

/** Compact secondary label used by app navigation and page metadata. */
export const monoLabel = 'font-sans text-[11px] font-semibold text-on-band-dim'

/** Shared active and hover treatment for app navigation links. */
export function navClass(isActive: boolean): string {
  return [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
    isActive
      ? 'bg-accent-soft text-accent-strong'
      : 'text-on-band-muted hover:bg-band-soft hover:text-on-band',
  ].join(' ')
}

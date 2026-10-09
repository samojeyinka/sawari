import type { IconType } from 'react-icons'
import {
  LuChartNoAxesColumnIncreasing,
  LuFolderKanban,
  LuHouse,
  LuRoute,
} from 'react-icons/lu'

export interface NavItem {
  to: string
  label: string
  icon: IconType
}

export const navItems: NavItem[] = [
  { to: '/app/today', label: 'Today', icon: LuHouse },
  { to: '/app/path', label: 'Learning path', icon: LuRoute },
  { to: '/app/projects', label: 'Projects', icon: LuFolderKanban },
  { to: '/app/progress', label: 'Progress', icon: LuChartNoAxesColumnIncreasing },
]

export function navClass(isActive: boolean): string {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
    isActive
      ? 'bg-panel font-medium text-ink border border-line shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
      : 'border border-transparent text-body hover:bg-panel/70 hover:text-ink',
  ].join(' ')
}

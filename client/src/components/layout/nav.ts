export interface NavItem {
  to: string
  label: string
  /** Short label for the mobile bottom bar. */
  short: string
}

export const navItems: NavItem[] = [
  { to: '/app/today', label: 'Today', short: 'Today' },
  { to: '/app/path', label: 'Learning path', short: 'Path' },
  { to: '/app/projects', label: 'Projects', short: 'Projects' },
  { to: '/app/progress', label: 'Progress', short: 'Progress' },
]

/** Mono micro-label used for every eyebrow, tag and meta line in the app. */
export const monoLabel = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'

/** A left accent rule marks the current page — no pills, no icons. */
export function navClass(isActive: boolean): string {
  return [
    'flex items-center justify-between border-l-2 px-5 py-2.5 text-[13.5px] transition-colors',
    isActive
      ? 'border-accent-bright text-on-band'
      : 'border-transparent text-on-band-dim hover:text-on-band',
  ].join(' ')
}

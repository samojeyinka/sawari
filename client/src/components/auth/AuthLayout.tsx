import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { cx } from '../../lib/utils'

/* Matches the landing page: full-width bands, inset content, hairline cells. */
const inset = 'mx-auto w-full max-w-[1880px] px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-[118px]'

export const monoNote = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'
export const authEyebrow = 'font-mono text-[11px] uppercase tracking-[0.12em] text-on-band-dim'

/* Square corners, no icons — the same rules the public pages follow. */
export const authLabel = 'block text-[13px] text-on-band-muted'
export const authInput =
  'w-full border border-on-band/20 bg-band-soft px-3.5 py-2.5 text-[15px] text-on-band ' +
  'placeholder:text-on-band-dim transition-colors duration-150 focus:border-accent-bright ' +
  'focus:outline-none focus:ring-2 focus:ring-accent-bright/25 hover:border-on-band/35 ' +
  'disabled:opacity-50'
export const authSubmit =
  'group relative inline-flex h-12 w-full items-center justify-center overflow-hidden bg-on-band ' +
  'text-[14.5px] font-medium text-band transition-colors disabled:pointer-events-none disabled:opacity-50'
export const authAlt =
  'group relative inline-flex h-11 w-full items-center justify-center overflow-hidden border ' +
  'border-on-band/20 text-[13.5px] text-on-band transition-colors hover:border-on-band/50'
export const authLink = 'font-medium text-accent-bright transition-colors hover:text-on-band'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  blurb: string
  points: [string, string][]
  children: ReactNode
}

/**
 * The public account screen. A ruled cell field carries the pitch on the left
 * and the form sits in the next cell, so signing in looks like the rest of the
 * product rather than a separate surface.
 */
export function AuthLayout({ eyebrow, title, blurb, points, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-band text-on-band-muted">
      <header className="border-b border-on-band/10">
        <div className={cx(inset, 'flex h-[76px] items-center justify-between gap-6')}>
          <Link to="/" aria-label="Sawari home" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={cx(monoNote, 'hidden transition-colors hover:text-on-band sm:block')}
            >
              Home
            </Link>
            <Link
              to="/setup"
              className={cx(monoNote, 'hidden transition-colors hover:text-on-band sm:block')}
            >
              Build a path
            </Link>
          </div>
        </div>
      </header>

      <main className={cx(inset, 'grid flex-1 lg:grid-cols-[minmax(0,1fr)_480px]')}>
        <div className="cell-field hidden flex-col justify-center gap-5 py-16 lg:flex lg:border-r lg:border-on-band/10 lg:pr-16">
          <p className={authEyebrow}>{eyebrow}</p>
          <h2 className="font-display text-[30px] font-light leading-[1.1] tracking-[-0.025em] text-on-band xl:text-[36px]">
            {title}
          </h2>
          <p className="max-w-[440px] text-[15.5px] leading-relaxed text-on-band-muted">{blurb}</p>
          <div className="mt-4 max-w-[440px] space-y-1">
            {points.map(([heading, note]) => (
              <div key={heading} className="border-t border-on-band/10 pt-3">
                <p className="text-[14.5px] text-on-band">{heading}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-on-band-dim">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center py-12 lg:py-16 lg:pl-16">{children}</div>
      </main>

      <footer className="border-t border-on-band/10">
        <div className={cx(inset, 'flex flex-wrap items-center justify-between gap-3 py-5')}>
          <p className={monoNote}>your account is stored securely</p>
          <p className={monoNote}>paths generated with deepseek ai</p>
        </div>
      </footer>
    </div>
  )
}

/** What the account gets you. Shared by every account screen. */
export const accountPoints: [string, string][] = [
  ['Your path', 'Nine sections, ordered, with the hours each one costs.'],
  ["Today's session", 'Four activities and one obvious next thing to do.'],
  ['Your progress', 'Hours you actually spent, not points you collected.'],
]

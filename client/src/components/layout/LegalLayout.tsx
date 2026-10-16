import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { cx } from '../../lib/utils'

/* Matches the public pages: full-width bands, inset content, hairlines. */
const inset = 'mx-auto w-full max-w-[1880px] px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-[118px]'
const mono = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'

interface LegalLayoutProps {
  eyebrow: string
  title: string
  updated: string
  children: ReactNode
}

/** Shared shell for the public legal pages (Privacy, Terms). */
export function LegalLayout({ eyebrow, title, updated, children }: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-band text-on-band-muted">
      <header className="border-b border-on-band/10">
        <div className={cx(inset, 'flex h-[76px] items-center justify-between gap-6')}>
          <Link to="/" aria-label="Sawari home" className="shrink-0">
            <Logo />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className={cx(mono, 'transition-colors hover:text-on-band')}>
              Home
            </Link>
            <Link to="/privacy" className={cx(mono, 'transition-colors hover:text-on-band')}>
              Privacy
            </Link>
            <Link to="/terms" className={cx(mono, 'transition-colors hover:text-on-band')}>
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className={cx(inset, 'flex-1 py-14')}>
        <div className="max-w-[760px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-band-dim">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-[30px] font-light leading-[1.1] tracking-[-0.025em] text-on-band xl:text-[38px]">
            {title}
          </h1>
          <p className={cx(mono, 'mt-4')}>Last updated {updated}</p>
          <div className="mt-10 space-y-9">{children}</div>
        </div>
      </main>

      <footer className="border-t border-on-band/10">
        <div className={cx(inset, 'flex flex-wrap items-center justify-between gap-3 py-5')}>
          <p className={mono}>© 2026 Sawari</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className={cx(mono, 'transition-colors hover:text-on-band')}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={cx(mono, 'transition-colors hover:text-on-band')}>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** A titled block of legal copy. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[19px] font-normal tracking-[-0.01em] text-on-band">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-on-band-muted">{children}</div>
    </section>
  )
}

/** A short bullet list inside a legal section. */
export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item) => (
        <li key={item} className="relative pl-4">
          <span
            aria-hidden="true"
            className="absolute left-0 top-[0.55em] h-1 w-1 bg-accent-bright"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}

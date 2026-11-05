import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { cx } from '../../lib/utils'

const inset = 'mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20'

export const monoNote = 'font-sans text-[11px] font-semibold text-on-band-dim'
export const authEyebrow = 'font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-bright'
export const authLabel = 'block text-[13px] font-bold text-on-band'
export const authInput =
  'w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[14px] text-on-band ' +
  'placeholder:text-on-band-dim transition-[border-color,box-shadow] duration-150 focus:border-accent-bright ' +
  'focus:outline-none focus:ring-4 focus:ring-accent-bright/10 hover:border-accent-bright/50 disabled:opacity-50'
export const authSubmit =
  'group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[#51249c] ' +
  'text-[13px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,.2)] transition-[transform,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bright/20 ' +
  'hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(113,59,209,.25)] disabled:pointer-events-none disabled:opacity-50'
export const authAlt =
  'group relative inline-flex h-11 w-full items-center justify-center rounded-xl border ' +
  'border-line-strong bg-white text-[13px] font-bold text-on-band transition-colors hover:border-accent-bright/60 hover:bg-band-soft'
export const authLink = 'font-bold text-accent-bright transition-colors hover:text-[#51249c]'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  blurb: string
  points: [string, string][]
  children: ReactNode
}

/** Shared account shell in the same warm paper and violet system as the catalog. */
export function AuthLayout({ eyebrow, title, blurb, points, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-band text-on-band-muted">
      <header className="border-b border-line bg-white">
        <div className={cx(inset, 'flex h-[68px] items-center justify-between gap-6 sm:h-[76px]')}>
          <Link to="/" aria-label="Sawari home" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/"
              className="hidden text-[12px] font-bold text-on-band-muted transition-colors hover:text-accent-bright sm:block"
            >
              Explore courses
            </Link>
            <Link
              to="/setup"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent-bright px-4 text-[12px] font-extrabold text-white transition-colors hover:bg-[#6130ae] sm:px-5"
            >
              Build your path
            </Link>
          </div>
        </div>
      </header>

      <main className={cx(inset, 'grid flex-1 items-center gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:gap-14 lg:py-16')}>
        <section className="relative hidden min-h-[620px] overflow-hidden rounded-[28px] bg-[#211b2a] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-28 h-[430px] w-[430px] rounded-full bg-[#713bd1] opacity-80 blur-[1px]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-28 h-[460px] w-[460px] rounded-full border-[80px] border-white/5" />

          <div className="relative z-10 max-w-[510px]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#d8baff]">{eyebrow}</p>
            <h2 className="mt-5 font-sans text-[clamp(34px,4vw,54px)] font-extrabold leading-[1.04] tracking-[-0.055em] text-white">
              {title}
            </h2>
            <p className="mt-5 max-w-[460px] text-[15px] leading-7 text-white/75">{blurb}</p>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm xl:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">Your learning plan</p>
                <p className="mt-1 text-[17px] font-extrabold text-white">Small steps. Real progress.</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d8baff] text-[17px] font-black text-[#39205a]">✓</span>
            </div>
            <div className="mt-5 space-y-3">
              {points.map(([heading, note], index) => (
                <div key={heading} className="flex items-start gap-3 border-t border-white/15 pt-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-extrabold text-[#e4d0ff]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-white">{heading}</p>
                    <p className="mt-0.5 text-[12px] leading-5 text-white/65">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px] rounded-[22px] border border-line bg-white p-5 shadow-[0_18px_60px_rgba(33,27,42,.08)] sm:p-8 lg:p-10">
          <div className="mb-7 lg:hidden">
            <p className={authEyebrow}>{eyebrow}</p>
            <h2 className="mt-2 font-sans text-[25px] font-extrabold leading-tight tracking-[-0.04em] text-on-band">{title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-on-band-muted">{blurb}</p>
          </div>
          {children}
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className={cx(inset, 'flex flex-wrap items-center justify-between gap-2 py-4')}>
          <p className={monoNote}>A learning plan that fits your time.</p>
          <p className={monoNote}>Your account is stored securely.</p>
        </div>
      </footer>
    </div>
  )
}

/** What the account gets you. Shared by every account screen. */
export const accountPoints: [string, string][] = [
  ['Your path', 'A clear sequence of lessons with the time each one takes.'],
  ["Today's session", 'A focused next step, ready when you are.'],
  ['Your progress', 'Pick up right where you left off.'],
]

import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { LuPlay } from 'react-icons/lu'
import { Logo } from '../components/ui/Logo'
import { KineticLink } from '../components/landing/KineticLink'
import { HeroGrid } from '../components/landing/HeroGrid'
import {
  AdaptVisual,
  AssessmentVisual,
  PathVisual,
  ProjectVisual,
  SetupVisual,
  TodayVisual,
} from '../components/landing/visuals'

const sections = [
  {
    id: 'goal',
    title: 'Start with a goal.',
    body: 'A few questions about what you want, why, and how much time you have. Two minutes, no account needed.',
    visual: <SetupVisual />,
  },
  {
    id: 'path',
    title: 'Get a path that fits you.',
    body: 'Sections in a sensible order, with the time each one takes and what is done, current or locked.',
    visual: <PathVisual />,
  },
  {
    id: 'today',
    title: 'Know what to do today.',
    body: 'One session, four activities, about 45 minutes. Open it and start, no planning required.',
    visual: <TodayVisual />,
  },
  {
    id: 'doing',
    title: 'Learn by doing.',
    body: 'Short lessons end in real work: a plan, a register, a presentation you can actually show.',
    visual: <ProjectVisual />,
  },
  {
    id: 'check',
    title: 'See what you actually know.',
    body: 'Checks are quick and honest. You find out why an answer works before you move on.',
    visual: <AssessmentVisual />,
  },
  {
    id: 'adapt',
    title: 'Your path changes as you learn.',
    body: 'A weak check adds a review. A strong one moves you forward. Tomorrow is always current.',
    visual: <AdaptVisual />,
  },
]

const stats = [
  { n: '02', label: 'Minutes to a path', note: 'Seven questions, then it is built.' },
  { n: '04', label: 'Activities per session', note: 'Learn, read, practice, check.' },
  { n: '45', label: 'Minutes a day', note: 'One session. Then you are done.' },
  { n: '01', label: 'Thing to do next', note: 'Never a menu of options.' },
]

const subjects = [
  'Project Management',
  'Spanish',
  'Photography',
  'Data Analysis',
  'Copywriting',
  'Product Design',
  'Personal Finance',
  'Public Speaking',
]

export function LandingPage() {
  const scrollToHow = (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-band">
      {/* header: slim, fixed, over the dark hero */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-on-band/10 bg-band/85 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-5 sm:px-10">
          <Link to="/" aria-label="Sawari home">
            <Logo tone="on-band" />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-7">
            <a
              href="#how"
              onClick={scrollToHow}
              className="hidden text-sm text-on-band-muted transition-colors hover:text-on-band sm:block"
            >
              How it works
            </a>
            <Link
              to="/login"
              className="text-sm text-on-band-muted transition-colors hover:text-on-band"
            >
              Log in
            </Link>
            <KineticLink to="/setup" tone="cream" size="sm">
              Build my path
            </KineticLink>
          </nav>
        </div>
      </header>

      {/* hero — dark band with teal-dusk wash and coloured right-side grid cells */}
      <section className="hero-wash relative overflow-hidden px-5 pb-16 pt-[60px] sm:px-10">
        <HeroGrid />
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1200px]">
          <div className="pt-14 sm:pt-20 lg:pt-24">
            <div className="max-w-2xl">
              <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">
                Free learning, one place
              </p>
              <h1 className="mt-5 max-w-2xl text-[34px] font-normal leading-[1.05] tracking-[-0.05em] text-on-band sm:text-[72px]">
                No more fees,
                <br />
                your AI agent
                <br />
                builds your path.
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-on-band-muted sm:text-lg">
                The best material for any skill is already out there, and it is free. Your
                personal AI learning agent piles it into one path, schedules it around the hours
                you have, and coaches you through real practice in a workspace until you are
                certified, no course fees.
              </p>
              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <KineticLink to="/setup" tone="cream" size="lg">
                  Build my learning path
                </KineticLink>
                <a
                  href="#how"
                  onClick={scrollToHow}
                  className="inline-flex h-12 items-center justify-center gap-2 border border-on-band/30 px-5 text-sm font-bold uppercase tracking-wide text-on-band transition-colors hover:border-on-band/70"
                >
                  <LuPlay className="h-3.5 w-3.5" />
                  See how it works
                </a>
              </div>
            </div>
          </div>

          {/* hero product shot */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden border border-on-band/15 bg-band-soft">
              <div className="flex items-center gap-1.5 border-b border-on-band/10 bg-panel px-4 py-2.5">
                <span className="h-2.5 w-2.5 bg-on-band/25" />
                <span className="h-2.5 w-2.5 bg-on-band/25" />
                <span className="ml-3 font-mono text-xs text-on-band-dim">sawari / today</span>
              </div>
              <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                <div className="hidden border-r border-on-band/10 bg-panel/50 p-4 md:block">
                  <Logo size="sm" tone="on-band" />
                  <div className="mt-4 space-y-1.5">
                    {['Today', 'Learning path', 'Projects', 'Progress'].map((item, i) => (
                      <div
                        key={item}
                        className={
                          i === 0
                            ? 'border border-on-band/15 bg-panel-soft px-3 py-2 text-[13px] font-medium text-on-band'
                            : 'px-3 py-2 text-[13px] text-on-band-dim'
                        }
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 border border-on-band/15 bg-panel-soft px-3 py-2.5">
                    <p className="text-[13px] font-medium text-on-band">Project Management</p>
                    <div className="mt-1.5 h-1 w-full bg-on-band/12">
                      <div className="h-full w-1/3 bg-accent-bright" />
                    </div>
                    <p className="mt-1 text-[11px] text-on-band-dim">32% complete</p>
                  </div>
                </div>
                <div className="p-5 sm:p-7">
                  <p className="text-sm text-on-band-dim">Good evening, Sam.</p>
                  <h3 className="mt-1 text-xl font-semibold text-on-band">
                    Here is what to do today.
                  </h3>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <TodayVisual />
                    <div className="hidden lg:block">
                      <PathVisual />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* subject ticker */}
      <section className="marquee overflow-hidden border-y border-on-band/10 py-5">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {subjects.map((subject) => (
                <span
                  key={subject}
                  className="flex items-center gap-8 whitespace-nowrap px-8 font-mono text-sm uppercase tracking-wide text-on-band-muted"
                >
                  {subject}
                  <span className="text-accent-bright">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* how it works — teal-tinted dark band */}
      <section id="how" className="border-y border-on-band/10 bg-band-teal">
        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-10 sm:py-28">
          <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">Overview</p>
          <h2 className="mt-3 max-w-2xl text-[26px] font-normal leading-[1.15] tracking-[-0.04em] text-on-band sm:text-[40px]">
            From a goal to something you do today.
          </h2>

          <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
            {sections.map((section, i) => (
              <div
                key={section.id}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
              >
                <div className={i % 2 === 1 ? 'lg:order-2' : undefined}>
                  <span className="font-mono text-sm uppercase tracking-wide text-on-band-dim">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-2xl font-normal tracking-[-0.02em] text-on-band sm:text-[28px]">
                    {section.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-on-band-muted">
                    {section.body}
                  </p>
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : undefined}>{section.visual}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* numbers — soft warm band, panels instead of cream cards */}
      <section className="relative overflow-hidden bg-band-soft px-5 py-20 sm:px-10 sm:py-28">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(50% 60% at 85% 20%, rgba(53,179,163,0.12), transparent 65%), radial-gradient(40% 50% at 10% 90%, rgba(255,178,123,0.08), transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1200px]">
          <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">Numbers</p>
          <h2 className="mt-3 max-w-2xl text-[26px] font-normal leading-[1.15] tracking-[-0.04em] text-on-band sm:text-[40px]">
            Small sessions. Real progress.
          </h2>
          <div className="mt-12 grid gap-px bg-on-band/10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-panel p-7">
                <p className="font-display text-[40px] leading-none text-accent-bright sm:text-[52px]">{stat.n}</p>
                <p className="mt-4 text-sm font-semibold text-on-band">{stat.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-on-band-muted">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* closing — deepest band, dotted paper texture, big CTA */}
      <section
        className="relative border-t border-on-band/10 px-5 py-20 text-center sm:px-10 sm:py-24"
        style={{
          background:
            'radial-gradient(rgba(240,234,223,0.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          backgroundColor: 'var(--color-band-deep)',
        }}
      >
        <h2 className="mx-auto max-w-2xl text-[26px] font-normal leading-[1.15] tracking-[-0.04em] text-on-band sm:text-[40px]">
          What do you want to learn?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-on-band-muted">
          It takes two minutes to see your path. No account, no card, no fuss.
        </p>
        <div className="mt-8">
          <KineticLink to="/setup" tone="cream" size="lg">
            Build my learning path
          </KineticLink>
        </div>
      </section>

      {/* footer — dark band */}
      <footer className="border-t border-on-band/10 bg-band px-5 py-10 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <Logo tone="on-band" size="sm" />
          <p className="text-[13px] text-on-band-muted">
            Frontend prototype with mock data. Paths, sessions and reviews are simulated.
          </p>
          <div className="flex gap-5 text-[13px] text-on-band-muted">
            <a href="#how" onClick={scrollToHow} className="transition-colors hover:text-on-band">
              How it works
            </a>
            <Link to="/login" className="transition-colors hover:text-on-band">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

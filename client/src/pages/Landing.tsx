import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { cx } from '../lib/utils'
import { Logo } from '../components/ui/Logo'
import { AvatarMenu } from '../components/ui/AvatarMenu'
import { CellLattice } from '../components/landing/CellLattice'
import { Sweep } from '../components/ui/Sweep'
import { useTypewriter } from '../hooks/useTypewriter'
import { useRevealAll } from '../hooks/useReveal'

/* ------------------------------------------------------------ shared bits */

/* Bands and their rules run the full viewport width; only the content inside
   them is inset, so the cell grid reads edge to edge. */
const inset = 'mx-auto w-full max-w-[1880px] px-6 sm:px-8 lg:px-12 xl:px-20 2xl:px-[118px]'
const band = 'border-b border-on-band/10'
const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.12em] text-on-band-dim'
const monoNote = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'
const body = 'text-[15.5px] leading-relaxed text-on-band-muted'
const display = 'font-display font-light tracking-[-0.025em] text-on-band'

const btn = 'group relative inline-flex items-center justify-center overflow-hidden transition-colors'
const btnPrimary = cx(btn, 'h-[46px] bg-on-band px-6 text-[14.5px] font-medium text-band')
const btnGhost = cx(
  btn,
  'h-[46px] border border-on-band/25 px-6 text-[14.5px] font-medium text-on-band hover:border-on-band/60',
)
const btnSmall = cx(btn, 'h-[38px] bg-on-band px-4 text-[13.5px] font-medium text-band sm:px-5')

const navLinks = [
  { label: 'How it works', href: '#how' },
  { label: "What's included", href: '#included' },
  { label: 'Paths', href: '#paths' },
]

/* words the hero types through, then the cell strip echoes back */
const SUBJECTS = [
  'Photography',
  'Project Management',
  'Spanish',
  'Data Analysis',
  'Public Speaking',
] as const

const stripA = ['Project Management', 'Spanish', 'Photography', 'Data Analysis']
const stripB = ['Public Speaking', 'Copywriting', 'Product Design', 'Personal Finance']

const specs = [
  ['Setup', '2 minutes', 'Seven short questions, then your path exists.'],
  ['Session', '45 minutes', 'Four activities, then you are done for the day.'],
  ['Path', '9 sections', 'Ordered, each one with the hours it costs.'],
  ['Checks', '5 per session', 'Explanations first, so you know why.'],
]

const steps = [
  [
    '1',
    'Say what you want to learn',
    'Seven short questions: the goal, where you are starting from, and the hours you can honestly give each week.',
  ],
  [
    '2',
    'Get a path in the right order',
    'Foundations first, the harder material later. Every section lists the hours it costs and how it is checked.',
  ],
  [
    '3',
    'Do one session a day',
    'Forty-five minutes, four activities, one obvious next thing. The path rearranges itself as you go.',
  ],
]

const keepPoints = [
  ['Project workspace', 'Tasks, files and notes pinned to the section you are on.'],
  ['Feedback you can act on', 'Specific notes back, not a score out of ten.'],
  ['Proof of what you did', 'Finished projects stay with the hours behind them.'],
]

const checkPoints = [
  ['Explanations, not scores', 'You see why the right answer is right before you carry on.'],
  ['Spaced review', 'Weak spots get rescheduled instead of quietly forgotten.'],
  ['Hours, not points', 'Progress is the time you actually spent learning.'],
]

/* ------------------------------------------------------------ small parts */

function Point({ title, note }: { title: string; note: string }) {
  return (
    <div className="border-t border-on-band/10 pt-3">
      <p className="text-[14.5px] text-on-band">{title}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-on-band-dim">{note}</p>
    </div>
  )
}

function Card({
  label,
  title,
  meta,
  children,
}: {
  label: string
  title: string
  meta: string
  children?: ReactNode
}) {
  return (
    <div className="overflow-hidden border border-on-band/15 bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-on-band/10 px-5 py-4">
        <div>
          <p className="text-[15.5px] font-medium text-on-band">{title}</p>
          <p className={cx(monoNote, 'mt-1')}>{meta}</p>
        </div>
        <p className={monoNote}>{label}</p>
      </div>
      {children}
    </div>
  )
}

const cellTone = ['bg-accent-bright/80', 'bg-warn-bright/70', 'bg-blue-bright/70']

/** A ruled strip of cells that scrolls, pausing under the cursor. */
function CellStrip({
  items,
  duration,
  reverse,
}: {
  items: string[]
  duration: number
  reverse?: boolean
}) {
  const track = [...items, ...items, ...items, ...items]
  return (
    <div className={cx('marquee overflow-hidden', reverse && 'marquee-reverse')}>
      <div
        className="marquee-track"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {track.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className="flex h-[78px] w-[248px] shrink-0 items-center gap-3 border-r border-on-band/10 px-5"
          >
            <span className={cx('h-3.5 w-3.5 shrink-0', cellTone[i % cellTone.length])} />
            <span className={cx(monoNote, 'truncate text-on-band-muted')}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ shots */

/** The daily session screen, exactly as it looks once you sign in. */
function TodayShot() {
  const activities: [string, string, string][] = [
    ['LEARN', 'Read the room before you brief it', '15 min'],
    ['READ', 'Brief someone who does not want to listen', '10 min'],
    ['PRACTICE', 'Place each stakeholder on the grid', '10 min'],
    ['CHECK', 'Five questions on mapping', '10 min'],
  ]
  const sections: [string, string][] = [
    ['Foundations', 'Done'],
    ['Project Planning', 'Done'],
    ['Agile and Scrum', 'Current'],
    ['Risk Management', 'Locked'],
    ['Communication', 'Locked'],
  ]

  return (
    <div className="overflow-hidden border border-on-band/20 bg-band-teal">
      <div className="flex h-11 items-center justify-between border-b border-on-band/10 bg-band-deep px-5">
        <p className={monoNote}>sawari / today</p>
        <p className={cx(monoNote, 'hidden sm:block')}>session 12 of 24</p>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden flex-col justify-between gap-10 border-r border-on-band/10 bg-band-deep p-5 lg:flex">
          <div className="space-y-5">
            <Logo size="sm" />
            <nav className="flex flex-col gap-0.5">
              {['Today', 'Learning path', 'Projects', 'Progress', 'Settings'].map((item, i) => (
                <div
                  key={item}
                  className={cx(
                    'px-3 py-2 text-[13px]',
                    i === 0
                      ? 'bg-accent-bright/20 font-medium text-accent-bright'
                      : 'text-on-band-dim',
                  )}
                >
                  {item}
                </div>
              ))}
            </nav>
          </div>
          <div className="border border-on-band/10 bg-panel p-3.5">
            <p className={monoNote}>Active path</p>
            <p className="mt-2 text-[13px] font-medium text-on-band">Project Management</p>
            <div className="mt-2.5 h-[3px] w-full bg-on-band/10">
              <div className="h-full w-[32%] bg-accent-bright" />
            </div>
            <p className={cx(monoNote, 'mt-2')}>section 4 of 9</p>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <p className="text-[24px] font-medium tracking-[-0.02em] text-on-band">Today</p>
          <p className={cx(monoNote, 'mt-1.5')}>Thursday, 12 October</p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Card label="45 minutes" title="Session 12 · Stakeholder Management" meta="four activities">
              {activities.map(([kind, title, time]) => (
                <div
                  key={kind}
                  className="flex items-center justify-between gap-4 border-t border-on-band/10 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={cx(monoNote, 'w-[68px] shrink-0 text-accent-bright')}>
                      {kind}
                    </span>
                    <span className="truncate text-[13.5px] text-on-band-muted">{title}</span>
                  </div>
                  <span className={cx(monoNote, 'shrink-0')}>{time}</span>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 bg-band-deep px-5 py-3.5">
                <p className="text-[12.5px] text-on-band-dim">
                  One session, then you are done today.
                </p>
                <span className="inline-flex h-[34px] items-center bg-on-band px-4 text-[12.5px] font-medium text-band">
                  Start session
                </span>
              </div>
            </Card>

            <div className="flex flex-col justify-between border border-on-band/15 bg-panel p-[18px]">
              <div>
                <div className="flex items-center justify-between">
                  <p className={monoNote}>Your path</p>
                  <p className={cx(monoNote, 'text-accent-bright')}>32%</p>
                </div>
                <div className="mt-3 h-[3px] w-full bg-on-band/10">
                  <div className="h-full w-[32%] bg-accent-bright" />
                </div>
                <div className="mt-3">
                  {sections.map(([title, state]) => (
                    <div
                      key={title}
                      className="flex items-center justify-between border-t border-on-band/10 py-2.5"
                    >
                      <span
                        className={cx(
                          'text-[12.5px]',
                          state === 'Current'
                            ? 'text-on-band'
                            : state === 'Locked'
                              ? 'text-on-band-dim'
                              : 'text-on-band-muted',
                        )}
                      >
                        {title}
                      </span>
                      <span
                        className={cx(
                          monoNote,
                          state === 'Current' ? 'text-accent-bright' : 'text-on-band-dim',
                        )}
                      >
                        {state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className={cx(monoNote, 'mt-4')}>next: agile and scrum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A project with work in progress. */
function ProjectShot() {
  const tasks: [string, string, boolean][] = [
    ['Define the objectives', 'Done', false],
    ['Identify the stakeholders', 'Done', false],
    ['Create a timeline', 'Done', false],
    ['Create the risk register', 'In progress', true],
    ['Prepare the final presentation', 'Next', false],
  ]

  return (
    <Card label="3 of 5 done" title="Plan a Product Launch" meta="project · section 6, risk">
      <div className="px-5 pt-4">
        <div className="h-[3px] w-full bg-on-band/10">
          <div className="h-full w-[60%] bg-accent-bright" />
        </div>
      </div>
      <div className="mt-3">
        {tasks.map(([task, state, hot]) => (
          <div
            key={task}
            className="flex items-center justify-between gap-4 border-t border-on-band/10 px-5 py-3"
          >
            <span
              className={cx(
                'text-[13.5px]',
                state === 'Next' ? 'text-on-band-dim' : 'text-on-band-muted',
              )}
            >
              {task}
            </span>
            <span className={cx(monoNote, 'shrink-0', hot && 'text-accent-bright')}>{state}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 bg-band-teal px-5 py-3.5">
        <p className={monoNote}>due sunday · 2 tasks left</p>
        <span className="inline-flex h-[32px] items-center bg-on-band px-4 text-[12.5px] font-medium text-band">
          Open workspace
        </span>
      </div>
    </Card>
  )
}

/** A check, answered, with the reasoning kept. */
function CheckShot() {
  const options: [string, boolean][] = [
    ['Keep them informed with detailed updates', false],
    ['Keep them satisfied with short, factual updates', true],
    ['Manage closely and involve them in every decision', false],
    ['Monitor them and take no action', false],
  ]

  return (
    <Card label="Question 2 of 5" title="Check · Stakeholder mapping" meta="5 questions">
      <div className="space-y-3 px-5 py-5">
        <p className="text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-on-band">
          High influence, low interest. What is the right approach?
        </p>
        <div className="space-y-2.5">
          {options.map(([text, correct]) => (
            <div
              key={text}
              className={cx(
                'flex items-center justify-between gap-4 px-3.5 py-2.5',
                correct ? 'bg-accent-bright/20' : 'border border-on-band/20',
              )}
            >
              <span
                className={cx(
                  'text-[13.5px]',
                  correct ? 'text-accent-bright' : 'text-on-band-muted',
                )}
              >
                {text}
              </span>
              {correct && (
                <span className={cx(monoNote, 'shrink-0 text-accent-bright')}>correct</span>
              )}
            </div>
          ))}
        </div>
        <div className="bg-band-teal px-3.5 py-3">
          <p className="text-[13px] leading-relaxed text-on-band-dim">
            They can change the project but they do not want the detail. Short, reliable updates
            keep their support.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 px-5 py-3.5">
        <p className={monoNote}>review added in 4 days</p>
        <p className={cx(monoNote, 'text-accent-bright')}>next question</p>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------- the header */

function Header() {
  const { state, signOut } = useApp()
  const user = state.user

  return (
    <header className="sticky top-0 z-40 border-b border-on-band/10 bg-band/90 backdrop-blur">
      <div className={cx(inset, 'flex h-[76px] items-center justify-between gap-6')}>
        <Link to="/" aria-label="Sawari home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cx(
                monoNote,
                'group relative overflow-hidden px-3 py-2 transition-colors hover:text-on-band',
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-accent-bright/25 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
              <span className="relative">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <AvatarMenu name={user.name} onSignOut={signOut} />
          ) : (
            <>
              <Link
                to="/login"
                className={cx(monoNote, 'py-2 transition-colors hover:text-on-band')}
              >
                Log in
              </Link>
              <Link to="/setup" className={btnSmall}>
                <Sweep tone="accent" />
                <span className="relative">Start free</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------ the landing */

export function LandingPage() {
  const typed = useTypewriter(SUBJECTS)
  useRevealAll()

  return (
    <div className="min-h-screen bg-band text-on-band-muted">
      <Header />

      {/* hero */}
      <section className={cx(band, 'xl:h-[456px]')}>
        <div
          className={cx(inset, 'h-full xl:grid xl:grid-cols-[minmax(0,1fr)_456px]')}
        >
          <div className="flex flex-col justify-center gap-5 py-14 xl:py-0">
            <p className={eyebrow}>Personal learning agent</p>
            <h1
              className={cx(
                display,
                'text-[34px] leading-[1.06] tracking-[-0.03em] sm:text-[52px] xl:text-[66px]',
              )}
            >
              Learn anything.
              <br />
              <span className="block min-h-[1.06em]">
                <span className="text-accent-bright">{typed}</span>
                <span
                  aria-hidden="true"
                  className="saw-caret ml-[0.08em] inline-block h-[0.72em] w-[0.42em] bg-accent-bright align-baseline"
                />
                <span className="sr-only">{SUBJECTS.join(', ')}</span>
              </span>
            </h1>
            <p className={cx(body, 'max-w-[520px]')}>
              The material you need is already out there, all free. Sawari orders it into one
              path, fits it around the hours you actually have, and walks you through real practice
              until you can do the thing.
            </p>
            <div className="mt-1 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link to="/setup" className={btnPrimary}>
                <Sweep tone="accent" />
                <span className="relative">Build my learning path</span>
              </Link>
              <a href="#how" className={btnGhost}>
                <Sweep tone="soft" />
                <span className="relative">See how it works</span>
              </a>
            </div>
            <p className={cx(monoNote, 'mt-1')}>free to start · no card until you save a path</p>
          </div>

          <div className="hidden h-full justify-end overflow-hidden xl:flex">
            <CellLattice cols={8} rows={8} size={57} interactive />
          </div>
        </div>
      </section>

      {/* spec cells */}
      <section id="paths" className={cx(band, 'scroll-mt-[88px]')}>
        <div className={cx(inset, 'grid lg:grid-cols-4')}>
          {specs.map(([label, value, note], i) => (
            <div
              key={label}
              data-reveal
              className={cx(
                'reveal-up flex flex-col gap-3 py-7 lg:pr-8',
                i < specs.length - 1 && 'border-b border-on-band/10 lg:border-b-0 lg:border-r',
                i > 0 && 'lg:pl-8',
              )}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <p className={monoNote}>{label}</p>
              <p className="text-[21px] font-medium tracking-[-0.01em] text-on-band">{value}</p>
              <p className="text-[13.5px] leading-relaxed text-on-band-dim">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* product */}
      <section className={band}>
        <div className={cx(inset, 'py-12')}>
          <div data-reveal className="reveal-up">
            <TodayShot />
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className={cx(band, 'scroll-mt-[88px]')}>
        <div className={cx(inset, 'flex flex-col gap-4 pb-10 pt-12')}>
          <p className={eyebrow}>How it works</p>
          <h2 className={cx(display, 'max-w-[760px] text-[30px] leading-[1.1] sm:text-[42px]')}>
            Three steps, then it is just the work.
          </h2>
        </div>
        <div className={cx(inset, 'grid border-t border-on-band/10 lg:grid-cols-3')}>
          {steps.map(([num, title, text], i) => (
            <div
              key={num}
              data-reveal
              className={cx(
                'reveal-up flex flex-col items-start gap-4 py-9 lg:pr-8',
                i < steps.length - 1 && 'border-b border-on-band/10 lg:border-b-0 lg:border-r',
                i > 0 && 'lg:pl-8',
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="flex h-[34px] w-[34px] items-center justify-center bg-accent-bright text-[15px] font-medium text-band">
                {num}
              </span>
              <h3 className="text-[19px] font-normal leading-snug tracking-[-0.01em] text-on-band">
                {title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-on-band-dim">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* what's included */}
      <section id="included" className={cx(band, 'scroll-mt-[88px]')}>
        <div className={cx(inset, 'grid xl:grid-cols-[500px_minmax(0,1fr)]')}>
          <div
            data-reveal
            className="reveal-up flex flex-col justify-center gap-4 py-12 xl:pr-12"
          >
            <p className={eyebrow}>What&apos;s included</p>
            <h2 className={cx(display, 'text-[28px] leading-[1.12] sm:text-[36px]')}>
              Sessions end in something you keep.
            </h2>
            <p className={body}>
              Practising takes longer than reading, and it is the part that sticks. Each section
              finishes with a piece of work you build inside Sawari.
            </p>
            <div className="mt-2 space-y-1">
              {keepPoints.map(([title, note]) => (
                <Point key={title} title={title} note={note} />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-on-band/10 py-10 xl:border-l xl:border-t-0 xl:pl-12">
            <div data-reveal className="reveal-up">
              <ProjectShot />
            </div>
          </div>
        </div>
      </section>

      {/* checks */}
      <section className={band}>
        <div className={cx(inset, 'grid xl:grid-cols-[minmax(0,1fr)_500px]')}>
          <div className="flex flex-col justify-center border-b border-on-band/10 py-10 xl:order-1 xl:border-b-0 xl:border-r xl:pr-12">
            <div data-reveal className="reveal-up">
              <CheckShot />
            </div>
          </div>
          <div
            data-reveal
            className="reveal-up flex flex-col justify-center gap-4 py-12 xl:order-2 xl:pl-12"
          >
            <p className={eyebrow}>Checks</p>
            <h2 className={cx(display, 'text-[28px] leading-[1.12] sm:text-[36px]')}>
              Checks that change what comes next.
            </h2>
            <p className={body}>
              Every session closes with five honest questions. Miss one and the idea comes back in a
              few days. Get it and the path moves on.
            </p>
            <div className="mt-2 space-y-1">
              {checkPoints.map(([title, note]) => (
                <Point key={title} title={title} note={note} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* quote */}
      <section className={cx(band, 'bg-band-deep')}>
        <div className={cx(inset, 'grid lg:grid-cols-[300px_minmax(0,1fr)]')}>
          <div className="pt-12 lg:py-14">
            <p className={cx(monoNote, 'uppercase tracking-[0.12em]')}>from a learner</p>
          </div>
          <div
            data-reveal
            className="reveal-up flex flex-col justify-center gap-5 border-t border-on-band/10 py-12 lg:border-l lg:border-t-0 lg:pl-12"
          >
            <p className={cx(display, 'max-w-[900px] text-[22px] leading-[1.34] sm:text-[30px]')}>
              I have started six courses and finished none of them. This is the first one where the
              next forty-five minutes were already decided for me.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[13.5px] text-on-band-muted">Amara Osei, Product Manager</p>
              <p className={monoNote}>finished the project management path</p>
            </div>
          </div>
        </div>
      </section>

      {/* cell strip */}
      <section className={band}>
        <div className={cx(inset, 'grid lg:grid-cols-[420px_minmax(0,1fr)]')}>
          <div data-reveal className="reveal-up flex flex-col justify-center gap-4 py-12 lg:pr-12">
            <p className={eyebrow}>Paths</p>
            <h2 className={cx(display, 'text-[28px] leading-[1.12] sm:text-[36px]')}>
              Whatever you want to learn, it is already here.
            </h2>
            <p className={body}>
              There is no catalogue to browse. Tell the agent what you want to learn and it builds
              your path from free material that already exists for it.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-px overflow-hidden border-t border-on-band/10 py-10 lg:border-t-0 lg:pl-12">
            <CellStrip items={stripA} duration={48} />
            <CellStrip items={stripB} duration={58} reverse />
          </div>
        </div>
      </section>

      {/* closing */}
      <section className={cx(band, 'cell-field')}>
        <div
          className={cx(
            inset,
            'flex flex-col items-center justify-center gap-4 py-24 text-center',
          )}
        >
         
          <h2 className={cx(display, 'text-[32px] leading-[1.1] sm:text-[46px]')}>
            What do you want to learn?
          </h2>
          <p className="max-w-[600px] text-base leading-relaxed text-on-band-muted">
            Answer seven questions and your path appears, ordered and scheduled. Free to start, and
            no card at the end of it.
          </p>
          <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link to="/setup" className={btnPrimary}>
              <Sweep tone="accent" />
              <span className="relative">Build my learning path</span>
            </Link>
            <a href="#how" className={btnGhost}>
              <Sweep tone="soft" />
              <span className="relative">See how it works</span>
            </a>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-band-deep">
        <div className={cx(inset, 'grid gap-y-0 sm:grid-cols-2 xl:grid-cols-[420px_1fr_1fr_1fr_1fr]')}>
          <div className="flex flex-col items-start gap-4 py-10 sm:pr-10">
            <Logo size="sm" />
            <p className="max-w-[300px] text-[13.5px] leading-relaxed text-on-band-dim">
              Learn anything. Make it yours. Material gathered from the open web, ordered around the
              time you have.
            </p>
          </div>
          {[
            {
              heading: 'Product',
              items: [
                { label: 'How it works', to: '#how' },
                { label: "What's included", to: '#included' },
                { label: 'Paths', to: '#paths' },
              ],
            },
            {
              heading: 'Get started',
              items: [
                { label: 'Build a path', to: '/setup' },
                { label: 'Log in', to: '/login' },
                { label: 'Create account', to: '/setup' },
              ],
            },
            {
              heading: 'Learn',
              items: [
                { label: 'Project Management', to: '#paths' },
                { label: 'Spanish', to: '#paths' },
                { label: 'Photography', to: '#paths' },
              ],
            },
            {
              heading: 'Legal',
              items: [
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
              ],
            },
          ].map((column) => (
            <div
              key={column.heading}
              className="flex flex-col items-start gap-3 border-t border-on-band/10 py-10 sm:px-10 sm:first-of-type:border-t-0 xl:border-l xl:border-t-0 xl:first-of-type:border-l-0"
            >
              <p className={monoNote}>{column.heading}</p>
              <div className="flex flex-col items-start gap-3">
                {column.items.map((item) =>
                  item.to.startsWith('#') ? (
                    <a
                      key={item.label}
                      href={item.to}
                      className="text-[13.5px] text-on-band-dim transition-colors hover:text-on-band"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="text-[13.5px] text-on-band-dim transition-colors hover:text-on-band"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={cx(inset, 'flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 py-[18px]')}>
          <p className={monoNote}>© 2025 Sawari</p>
          <p className={monoNote}>made for people who learn on their own time</p>
        </div>
      </footer>
    </div>
  )
}

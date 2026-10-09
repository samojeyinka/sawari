import {
  LuCheck,
  LuChevronDown,
  LuClock,
  LuLock,
  LuPlay,
  LuRoute,
} from 'react-icons/lu'
import { cx } from '../../lib/utils'

/** Flat, square, dark-panel product mock — matches the landing's band world. */
const shell = 'overflow-hidden border border-on-band/12 bg-panel'

const headRow = 'flex items-center justify-between border-b border-on-band/12 px-5 py-3.5'
const divider = 'divide-y divide-on-band/10'
const rowBorder = 'border-t border-on-band/12'

/** Step 2 of the setup flow, mid-answer. */
export function SetupVisual() {
  return (
    <div className={shell}>
      <div className={headRow}>
        <span className="text-[13px] font-medium text-on-band">Why are you learning this?</span>
        <span className="font-mono text-xs text-on-band-dim">Step 3 of 7</span>
      </div>
      <div className="px-5 py-5">
        <div className="mb-4 h-1 w-full bg-on-band/12">
          <div className="h-full w-2/5 bg-accent-bright" />
        </div>
        <div className="space-y-2">
          {['Career', 'School', 'Personal development', 'Career change'].map((option, i) => (
            <div
              key={option}
              className={cx(
                'flex items-center justify-between border px-3.5 py-2.5 text-sm',
                i === 0
                  ? 'border-accent-bright/60 bg-accent-bright/10 font-medium text-accent-bright'
                  : 'border-on-band/12 text-on-band-muted',
              )}
            >
              {option}
              {i === 0 && <LuCheck className="h-4 w-4" strokeWidth={3} />}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <span className="text-[13px] text-on-band-dim">Back</span>
          <span className="bg-on-band px-3.5 py-1.5 text-[13px] font-medium text-band">
            Continue
          </span>
        </div>
      </div>
    </div>
  )
}

/** A generated path with statuses. */
export function PathVisual() {
  const rows = [
    { n: '01', title: 'Foundations', state: 'done' },
    { n: '02', title: 'Project Planning', state: 'done' },
    { n: '03', title: 'Project Execution', state: 'done' },
    { n: '04', title: 'Agile and Scrum', state: 'current' },
    { n: '05', title: 'Risk Management', state: 'locked' },
  ]
  return (
    <div className={shell}>
      <div className={headRow}>
        <span className="text-[13px] font-semibold text-on-band">Project Management</span>
        <span className="font-mono text-xs font-medium text-accent-bright">48% complete</span>
      </div>
      <div className={divider}>
        {rows.map((row) => (
          <div key={row.n} className="flex items-center gap-3 px-5 py-3">
            <span
              className={cx(
                'flex h-7 w-7 items-center justify-center border font-mono text-[11px] font-semibold',
                row.state === 'done' &&
                  'border-success-bright/40 bg-success-bright/12 text-success-bright',
                row.state === 'current' && 'border-accent-bright bg-accent-bright text-band',
                row.state === 'locked' && 'border-on-band/15 text-on-band-dim',
              )}
            >
              {row.state === 'done' ? (
                <LuCheck className="h-3.5 w-3.5" strokeWidth={3} />
              ) : row.state === 'locked' ? (
                <LuLock className="h-3 w-3" />
              ) : (
                row.n
              )}
            </span>
            <span
              className={cx(
                'flex-1 text-sm',
                row.state === 'current'
                  ? 'font-semibold text-on-band'
                  : row.state === 'locked'
                    ? 'text-on-band-dim'
                    : 'text-on-band-muted',
              )}
            >
              {row.title}
            </span>
            {row.state === 'current' && (
              <span className="bg-accent-bright/12 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-bright">
                Current
              </span>
            )}
            {row.state === 'locked' && (
              <span className="text-xs text-on-band-dim">Locked</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The daily session card. */
export function TodayVisual() {
  const activities = [
    { kind: 'Learn', title: 'Read the room before you brief it', time: '15 min' },
    { kind: 'Read', title: 'Brief someone who does not want to listen', time: '10 min' },
    { kind: 'Practice', title: 'Place each stakeholder', time: '10 min' },
    { kind: 'Check', title: 'Five questions on mapping', time: '10 min' },
  ]
  return (
    <div className={shell}>
      <div className="px-5 py-4">
        <p className="text-[13px] text-on-band-dim">Good evening, Sam.</p>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg font-semibold text-on-band">Stakeholder Management</span>
          <span className="flex items-center gap-1 text-sm text-on-band-muted">
            <LuClock className="h-3.5 w-3.5" /> 45 min
          </span>
        </div>
      </div>
      <div className={cx(divider, rowBorder)}>
        {activities.map((activity) => (
          <div key={activity.kind} className="flex items-center gap-3 px-5 py-2.5">
            <span className="w-16 shrink-0 font-mono text-[11px] font-medium uppercase tracking-wide text-accent-bright">
              {activity.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-on-band">
              {activity.title}
            </span>
            <span className="text-xs text-on-band-dim">{activity.time}</span>
          </div>
        ))}
      </div>
      <div
        className={cx(
          'flex items-center justify-between bg-panel-soft px-5 py-3',
          rowBorder,
        )}
      >
        <span className="text-[13px] text-on-band-dim">One session, then you are done today.</span>
        <span className="flex items-center gap-1.5 bg-on-band px-3.5 py-1.5 text-[13px] font-medium text-band">
          <LuPlay className="h-3 w-3" /> Start session
        </span>
      </div>
    </div>
  )
}

/** A project with tasks in progress. */
export function ProjectVisual() {
  const tasks = [
    { title: 'Define objectives', done: true },
    { title: 'Identify stakeholders', done: true },
    { title: 'Create timeline', done: true },
    { title: 'Create risk register', done: false },
    { title: 'Prepare final presentation', done: false },
  ]
  return (
    <div className={shell}>
      <div className={headRow}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-on-band">Plan a Product Launch</span>
          <span className="font-mono text-xs text-on-band-dim">3 of 5 tasks</span>
        </div>
      </div>
      <div className="px-5 pt-2.5">
        <div className="h-1 w-full bg-on-band/12">
          <div className="h-full w-3/5 bg-warn-bright" />
        </div>
      </div>
      <div className={cx(divider, 'mt-2.5')}>
        {tasks.map((task) => (
          <div key={task.title} className="flex items-center gap-3 px-5 py-2.5">
            <span
              className={cx(
                'flex h-[18px] w-[18px] items-center justify-center border',
                task.done
                  ? 'border-success-bright bg-success-bright text-band'
                  : 'border-on-band/25',
              )}
            >
              {task.done && <LuCheck className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span
              className={cx(
                'text-sm',
                task.done ? 'text-on-band-dim line-through' : 'text-on-band',
              )}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A question mid-review. */
export function AssessmentVisual() {
  const options = [
    { text: 'Keep them informed with detailed updates', state: 'neutral' },
    { text: 'Keep satisfied with short, factual updates', state: 'good' },
    { text: 'Manage closely and involve in every decision', state: 'neutral' },
    { text: 'Monitor and take no action', state: 'neutral' },
  ]
  return (
    <div className={shell}>
      <div className={headRow}>
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-accent-bright">
          Check your understanding
        </span>
        <span className="font-mono text-[11px] text-on-band-dim">Q 2 / 5</span>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-on-band">
          High influence, low interest. What is the right approach?
        </p>
        <div className="mt-3 space-y-2">
          {options.map((option) => (
            <div
              key={option.text}
              className={cx(
                'flex items-center gap-2.5 border px-3 py-2 text-[13px]',
                option.state === 'good'
                  ? 'border-success-bright/50 bg-success-bright/10 font-medium text-success-bright'
                  : 'border-on-band/12 text-on-band-muted',
              )}
            >
              {option.state === 'good' && (
                <LuCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
              )}
              {option.text}
            </div>
          ))}
          <div className="border border-on-band/12 bg-panel-soft px-3 py-2.5 text-[13px] leading-relaxed text-on-band-muted">
            They can change the project but do not want detail. Short, reliable updates keep their
            support.
          </div>
        </div>
      </div>
    </div>
  )
}

/** The path adapting after a check. */
export function AdaptVisual() {
  return (
    <div className={shell}>
      <div className="border-b border-on-band/12 bg-accent-bright/8 px-5 py-3.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-accent-bright">
          <LuRoute className="h-4 w-4" />
          Path updated after your check
        </span>
      </div>
      <div className="space-y-3 px-5 py-4">
        <div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-on-band-dim">Progress</span>
            <span className="font-semibold text-on-band">32% · 18 hours left</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-on-band/12">
            <div className="h-full w-1/3 bg-accent-bright" />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border border-on-band/12 px-3.5 py-2.5 text-sm">
            <span className="text-on-band">Tomorrow · Communication strategies</span>
            <span className="text-xs text-on-band-dim">45 min</span>
          </div>
          <div className="flex items-center justify-between border border-dashed border-on-band/20 px-3.5 py-2.5 text-sm">
            <span className="text-on-band-muted">Moved back a day · Stakeholder influence</span>
            <span className="text-xs text-on-band-dim">45 min</span>
          </div>
          <div className="flex items-center justify-between bg-panel-soft px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-on-band-muted">
              <LuCheck className="h-4 w-4 text-success-bright" strokeWidth={3} />
              Stakeholder mapping checked off
            </span>
            <span className="text-xs text-on-band-dim">4 / 5</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-on-band/12 pt-3 text-[13px] text-on-band-dim">
          <span className="flex items-center gap-1.5">
            <LuChevronDown className="h-3.5 w-3.5" /> Real world project stays locked
          </span>
          <span>Until section 06 is done</span>
        </div>
      </div>
    </div>
  )
}

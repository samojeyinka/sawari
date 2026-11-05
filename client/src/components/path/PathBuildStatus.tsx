import type { GenerationStatus } from '../../types'
import { Page } from '../layout/PageHeader'
import { monoLabel } from '../layout/nav'
import { Sweep } from '../ui/Sweep'
import { ProgressBar } from '../ui/ProgressBar'
import { cx } from '../../lib/utils'

const primaryBtn =
  'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-accent-bright px-6 ' +
  'text-[13px] font-bold text-white transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bright/15 disabled:pointer-events-none disabled:opacity-50'

/** Full-page state for a path the AI worker is still designing. Updates live. */
export function PathBuilding({
  subject,
  status,
}: {
  subject: string
  status: GenerationStatus | undefined
}) {
  const generating = status === 'generating'
  return (
    <Page width="narrow">
      <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-band-soft">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-bright/20 border-t-accent-bright motion-reduce:animate-none" />
        </span>
        <p className={cx(monoLabel, 'mt-4 text-accent-bright')}>
          {generating ? 'designing sections' : 'queued'}
        </p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
          Building your {subject} path…
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
          {generating
            ? 'DeepSeek AI is designing your sections right now.'
            : 'Your brief is queued — design starts in a moment.'}{' '}
          This page updates automatically when it is ready. No need to refresh.
        </p>
          <div className="mx-auto mt-7 max-w-xs">
            <ProgressBar value={generating ? 66 : 33} className="h-2 rounded-full" />
        </div>
      </div>
    </Page>
  )
}

/** Full-page state for a path whose AI build failed, with a retry action. */
export function PathBuildFailed({
  subject,
  retrying,
  onRetry,
}: {
  subject: string
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <Page width="narrow">
      <div className="animate-rise rounded-[24px] border border-line bg-white px-6 py-12 text-center shadow-[0_14px_44px_rgba(33,27,42,.06)] sm:px-8 sm:py-14">
        <p className={cx(monoLabel, 'text-danger-bright')}>Path not ready</p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.04em] text-on-band sm:text-[30px]">
          Could not design your {subject} path
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
          Something went wrong while generating your sections. Your answers are saved — try again.
        </p>
        <button type="button" onClick={onRetry} disabled={retrying} className={cx(primaryBtn, 'mt-7')}>
          <Sweep />
          <span className="relative">{retrying ? 'Trying again…' : 'Try again'}</span>
        </button>
      </div>
    </Page>
  )
}

import type { GenerationStatus } from '../../types'
import { Page } from '../layout/PageHeader'
import { monoLabel } from '../layout/nav'
import { Sweep } from '../ui/Sweep'
import { ProgressBar } from '../ui/ProgressBar'
import { cx } from '../../lib/utils'

const primaryBtn =
  'group relative inline-flex h-12 items-center justify-center overflow-hidden bg-on-band px-7 ' +
  'text-[14.5px] font-medium text-band transition-colors disabled:pointer-events-none disabled:opacity-50'

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
      <div className="animate-rise border border-on-band/15 bg-panel px-8 py-16 text-center">
        <p className={cx(monoLabel, 'text-accent-bright')}>
          {generating ? 'designing sections' : 'queued'}
        </p>
        <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
          Building your {subject} path…
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
          {generating
            ? 'DeepSeek AI is designing your sections right now.'
            : 'Your brief is queued — design starts in a moment.'}{' '}
          This page updates automatically when it is ready. No need to refresh.
        </p>
        <div className="mx-auto mt-7 max-w-xs">
          <ProgressBar value={generating ? 66 : 33} />
        </div>
      </div>
    </Page>
  )
}

/** Full-page state for a path whose AI build failed, with a retry action. */
export function PathBuildFailed({
  subject,
  error,
  retrying,
  onRetry,
}: {
  subject: string
  error: string | null | undefined
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <Page width="narrow">
      <div className="animate-rise border border-danger-bright/40 bg-panel px-8 py-16 text-center">
        <p className={cx(monoLabel, 'text-danger-bright')}>failed</p>
        <h1 className="mt-4 font-display text-[28px] font-light tracking-[-0.025em] text-on-band">
          Could not design your {subject} path
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-on-band-muted">
          Something went wrong while generating your sections. Your answers are saved — try again.
        </p>
        {error && (
          <p className="mx-auto mt-5 max-w-md border border-on-band/15 bg-band-deep px-4 py-3 text-left font-mono text-[11px] leading-relaxed text-on-band-dim">
            {error}
          </p>
        )}
        <button type="button" onClick={onRetry} disabled={retrying} className={cx(primaryBtn, 'mt-7')}>
          <Sweep />
          <span className="relative">{retrying ? 'Trying again…' : 'Try again'}</span>
        </button>
      </div>
    </Page>
  )
}

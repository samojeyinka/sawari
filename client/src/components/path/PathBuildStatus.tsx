import { LuLoaderCircle, LuRefreshCw, LuSparkles, LuTriangleAlert } from 'react-icons/lu'
import type { GenerationStatus } from '../../types'
import { Page } from '../layout/PageHeader'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'

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
      <div className="animate-rise rounded-xl border border-line bg-panel px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <LuLoaderCircle className="h-6 w-6 animate-spin" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Building your {subject} path…</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {generating
            ? 'DeepSeek AI is designing your sections right now.'
            : 'Your brief is queued — design starts in a moment.'}{' '}
          This page updates automatically when it is ready. No need to refresh.
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <ProgressBar value={generating ? 66 : 33} />
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-muted">
          <LuSparkles className="h-3.5 w-3.5 text-accent" />
          {generating ? 'Designing sections' : 'Queued'}
        </p>
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
      <div className="animate-rise rounded-xl border border-line bg-panel px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <LuTriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">
          Could not design your {subject} path
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Something went wrong while generating your sections. Your answers are saved — try again.
        </p>
        {error && (
          <p className="mx-auto mt-3 max-w-md rounded-lg border border-line bg-canvas/60 px-4 py-2.5 text-xs text-muted">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Button onClick={onRetry} loading={retrying}>
            <LuRefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </Page>
  )
}

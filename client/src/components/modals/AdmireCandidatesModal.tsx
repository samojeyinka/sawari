import { Modal } from '../ui/Modal'
import { cx } from '../../lib/utils'
import type { AdmireCandidate } from '../../lib/goalExtract'

const monoNote = 'font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim'

/**
 * Lets the learner pick the person closest to the one they admire from the
 * AI-suggested candidates. Selecting a card returns it to the setup flow,
 * which builds the path around that person's niche and skills.
 */
export function AdmireCandidatesModal({
  open,
  onClose,
  candidates,
  selectedName,
  onSelect,
  offline = false,
}: {
  open: boolean
  onClose: () => void
  candidates: AdmireCandidate[]
  selectedName?: string
  onSelect: (candidate: AdmireCandidate) => void
  offline?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="People close to who you meant"
      description="Pick the one closest to the person you had in mind. We build your path around their skills."
    >
      <div className="flex items-center justify-between gap-3">
        <p className={monoNote}>
          {candidates.length === 1 ? '1 match' : `${candidates.length} matches`}
        </p>
        {offline && <span className={cx(monoNote, 'text-accent-bright/70')}>offline</span>}
      </div>

      <div className="mt-4 space-y-2.5">
        {candidates.map((candidate, index) => {
          const active = selectedName === candidate.name
          return (
            <button
              key={`${candidate.name}-${index}`}
              type="button"
              onClick={() => onSelect(candidate)}
              aria-pressed={active}
              className={cx(
                'block w-full border px-4 py-4 text-left transition-colors duration-150',
                active
                  ? 'border-accent-bright bg-accent-bright/10'
                  : 'border-on-band/15 hover:border-on-band/35 hover:bg-on-band/[0.03]',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-[15px] font-medium text-on-band">{candidate.name}</span>
                <span className={monoNote}>{candidate.role}</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-on-band-muted">
                {candidate.blurb}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="border border-accent-bright/40 bg-accent-bright/10 px-2 py-0.5 text-[11.5px] text-accent-bright">
                  {candidate.subject}
                </span>
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="border border-on-band/15 px-2 py-0.5 text-[11.5px] text-on-band-dim"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import type { Intensity, LearningFormat, WeeklyHours } from '../../types'
import { useApp } from '../../state/store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Chip } from '../ui/ProgressBar'
import { cx } from '../../lib/utils'

const hours: { id: WeeklyHours; label: string }[] = [
  { id: '2', label: '2 hours' },
  { id: '5', label: '5 hours' },
  { id: '10', label: '10 hours' },
  { id: '15+', label: '15+ hours' },
]

const intensities: { id: Intensity; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: 'Short sessions, plenty of breathing room' },
  { id: 'balanced', label: 'Balanced', hint: 'Steady pace with weekly momentum' },
  { id: 'intensive', label: 'Intensive', hint: 'Push hard, finish sooner' },
]

const formats: { id: LearningFormat; label: string }[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'articles', label: 'Articles' },
  { id: 'books', label: 'Books' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'projects', label: 'Projects' },
  { id: 'quizzes', label: 'Quizzes' },
]

export function EditPreferencesModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { activePath, updatePathPreferences, toast } = useApp()
  const [weekly, setWeekly] = useState<WeeklyHours>('5')
  const [intensity, setIntensity] = useState<Intensity>('balanced')
  const [selected, setSelected] = useState<LearningFormat[]>([])

  useEffect(() => {
    if (open && activePath) {
      setWeekly(activePath.weeklyHours)
      setIntensity(activePath.intensity)
      setSelected(activePath.formats)
    }
  }, [open, activePath])

  if (!activePath) return null

  const toggleFormat = (id: LearningFormat) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  const save = () => {
    updatePathPreferences(activePath.id, {
      weeklyHours: weekly,
      intensity,
      formats: selected.length ? selected : activePath.formats,
    })
    toast('Learning preferences updated')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Learning preferences"
      description={`Applies to ${activePath.subject}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Time each week</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hours.map((h) => (
              <button
                key={h.id}
                onClick={() => setWeekly(h.id)}
                className={cx(
                  'rounded-lg border px-3 py-2.5 text-sm transition-all',
                  weekly === h.id
                    ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                    : 'border-line text-body hover:border-line-strong hover:bg-canvas',
                )}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Intensity</p>
          <div className="space-y-2">
            {intensities.map((item) => (
              <button
                key={item.id}
                onClick={() => setIntensity(item.id)}
                className={cx(
                  'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all',
                  intensity === item.id
                    ? 'border-accent bg-accent-soft/60'
                    : 'border-line hover:border-line-strong hover:bg-canvas',
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="block text-[13px] text-muted">{item.hint}</span>
                </span>
                <span
                  className={cx(
                    'h-4 w-4 shrink-0 rounded-full border-2 transition-all',
                    intensity === item.id ? 'border-accent bg-accent' : 'border-line-strong',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Formats</p>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <Chip key={f.id} selected={selected.includes(f.id)} onClick={() => toggleFormat(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import type { Intensity, LearningFormat, WeeklyHours } from '../../types'
import { useApp } from '../../state/store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ContentOption } from '../ui/ContentOption'
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
      <div className="space-y-7">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
            Time each week
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {hours.map((h) => (
              <ContentOption
                key={h.id}
                selected={weekly === h.id}
                onClick={() => setWeekly(h.id)}
                className="justify-center"
              >
                {h.label}
              </ContentOption>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
            Intensity
          </p>
          <div className="mt-3 space-y-2">
            {intensities.map((item) => (
              <ContentOption
                key={item.id}
                selected={intensity === item.id}
                onClick={() => setIntensity(item.id)}
                className="w-full justify-between gap-3 px-4 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] text-on-band">{item.label}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-on-band-dim">
                    {item.hint}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'h-3.5 w-3.5 shrink-0 border',
                    intensity === item.id
                      ? 'border-accent-bright bg-accent-bright'
                      : 'border-on-band/30',
                  )}
                />
              </ContentOption>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-band-dim">
            Formats
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {formats.map((f) => (
              <ContentOption
                key={f.id}
                selected={selected.includes(f.id)}
                onClick={() => toggleFormat(f.id)}
              >
                {f.label}
              </ContentOption>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

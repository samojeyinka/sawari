import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { inputClass } from '../ui/ProgressBar'
import { cx } from '../../lib/utils'

export function SubmitProjectModal({
  open,
  onClose,
  onSubmit,
  title,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (note: string) => void
  title: string
}) {
  const [note, setNote] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit your project"
      description={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(note)}>Submit project</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-body">
          We will review it against the rubric for this project. You get strengths to keep and
          specific things to improve. Takes under a minute.
        </p>
        <div>
          <label htmlFor="submit-note" className="mb-2 block text-sm font-medium text-ink">
            Anything we should know? <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="submit-note"
            rows={4}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you found hard, what you would do differently, where you took a shortcut."
            className={cx(inputClass, 'resize-y leading-relaxed')}
          />
        </div>
      </div>
    </Modal>
  )
}

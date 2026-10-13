import { monoLabel } from '../layout/nav'

/** Inline note shown where an attend action would be while previewing a session. */
export function PreviewNotice() {
  return (
    <span className={monoLabel}>
      previewing — finish the earlier sections to attend this session
    </span>
  )
}

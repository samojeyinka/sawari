import { LuEye } from 'react-icons/lu'

/** Inline note shown where an attend action would be while previewing a session. */
export function PreviewNotice() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <LuEye className="h-4 w-4 shrink-0" />
      Previewing — finish the earlier sections to attend this session.
    </span>
  )
}

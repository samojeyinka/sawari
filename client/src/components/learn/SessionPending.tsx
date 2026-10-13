export function SessionPending() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-line border-t-accent animate-spin" />
      <h1 className="mt-4 text-xl font-semibold text-ink">Building your session</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        We are writing a session tailored to this section. This can take a few seconds.
      </p>
    </div>
  )
}
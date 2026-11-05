export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[45vh] items-center justify-center">
      <span className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-[0_6px_20px_rgba(33,27,42,.06)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-soft border-t-accent-bright motion-reduce:animate-none" />
        <span className="sr-only">Loading page</span>
      </span>
    </div>
  )
}

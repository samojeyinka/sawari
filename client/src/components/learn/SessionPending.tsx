export function SessionPending() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="rounded-[22px] border border-line bg-white px-6 py-9 text-center shadow-[0_12px_40px_rgba(33,27,42,.05)] sm:px-9">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-band-soft">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-bright/20 border-t-accent-bright motion-reduce:animate-none" />
        </span>
        <h1 className="mt-4 font-display text-[25px] font-extrabold tracking-[-0.04em] text-on-band">
          Building your session
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-on-band-muted">
          We are preparing a session around this section. It should be ready shortly.
        </p>
      </div>
    </div>
  )
}

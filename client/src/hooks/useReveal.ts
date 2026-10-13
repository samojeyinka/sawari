import { useEffect } from 'react'

/**
 * Adds `is-in` to every `[data-reveal]` element as it scrolls into view, so the
 * `reveal-up` class can fade and lift it. Falls back to showing everything when
 * IntersectionObserver is unavailable, and never hides content on its own.
 */
export function useRevealAll() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!targets.length) return

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
